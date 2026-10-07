import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { analyzeProductRisk } from './src/services/geminiAnalyzer';
import { ExtractedProduct } from './src/types/extension';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for Chrome Extension origins & local development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve extension directory statically for inspector and zip download
app.use('/trustcart-ai', express.static(path.join(__dirname, 'trustcart-ai')));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'TrustCart AI',
    version: '1.0.0',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// Primary Risk Analysis API Endpoint (called by Extension & Web Sandbox)
app.post('/api/analyze', async (req: Request, res: Response) => {
  try {
    const { product } = req.body;

    if (!product || !product.title || typeof product.title !== 'string' || product.title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product payload: A valid product with a recognizable title is required. Cannot evaluate empty or non-product pages.'
      });
    }

    const titleLower = product.title.trim().toLowerCase();
    if (titleLower === 'untitled' || titleLower === 'unknown' || titleLower === 'error' || titleLower === '404 not found') {
      return res.status(400).json({
        success: false,
        error: 'No product information could be detected on this page.'
      });
    }

    const sanitizedProduct: ExtractedProduct = {
      url: String(product.url || 'https://example.com/product'),
      domain: String(product.domain || 'example.com'),
      title: String(product.title).slice(0, 500),
      currentPrice: product.currentPrice != null ? Number(product.currentPrice) : null,
      originalPrice: product.originalPrice != null ? Number(product.originalPrice) : null,
      currency: product.currency ? String(product.currency).slice(0, 10) : '₹',
      discountPercent: product.discountPercent != null ? Number(product.discountPercent) : null,
      isDiscountCalculated: Boolean(product.isDiscountCalculated),
      priceUnavailable: Boolean(product.priceUnavailable),
      rating: product.rating != null ? Number(product.rating) : null,
      reviewCount: product.reviewCount != null ? Number(product.reviewCount) : null,
      reviews: Array.isArray(product.reviews) ? product.reviews.slice(0, 20).map((r: any) => ({
        author: r.author ? String(r.author).slice(0, 100) : 'Anonymous',
        rating: r.rating != null ? Number(r.rating) : undefined,
        text: String(r.text || '').slice(0, 1000),
        date: r.date ? String(r.date) : undefined,
        verifiedPurchase: Boolean(r.verifiedPurchase)
      })) : [],
      seller: {
        name: product.seller?.name ? String(product.seller.name).slice(0, 200) : undefined,
        rating: product.seller?.rating != null ? Number(product.seller.rating) : undefined,
        reviewsCount: product.seller?.reviewsCount != null ? Number(product.seller.reviewsCount) : undefined,
        tenure: product.seller?.tenure ? String(product.seller.tenure) : undefined,
        businessAddress: product.seller?.businessAddress ? String(product.seller.businessAddress) : undefined,
        isVerified: Boolean(product.seller?.isVerified)
      },
      policies: {
        returnAvailable: product.policies?.returnAvailable !== undefined ? product.policies.returnAvailable : 'unknown',
        returnWindowDays: product.policies?.returnWindowDays != null ? Number(product.policies.returnWindowDays) : undefined,
        refundPolicyText: product.policies?.refundPolicyText ? String(product.policies.refundPolicyText) : undefined,
        warrantyText: product.policies?.warrantyText ? String(product.policies.warrantyText) : undefined,
        replacementAvailable: Boolean(product.policies?.replacementAvailable)
      },
      description: String(product.description || '').slice(0, 4000),
      specifications: typeof product.specifications === 'object' && product.specifications !== null ? product.specifications : {},
      images: Array.isArray(product.images) ? product.images.slice(0, 5) : [],
      extractedVia: product.extractedVia || 'manual-input',
      missingFields: Array.isArray(product.missingFields) ? product.missingFields : []
    };

    const analysis = await analyzeProductRisk(sanitizedProduct);

    return res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    console.error('API /api/analyze error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze product. Please try again.',
      details: error.message || String(error)
    });
  }
});

// URL Scanner Endpoint: Validates and extracts product signals from any live URL
app.post('/api/scan-url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a product page URL.'
      });
    }

    const trimmedUrl = url.trim();

    // Check basic URL validity
    let parsedUrl: URL;
    try {
      const withProto = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
      parsedUrl = new URL(withProto);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL. Please enter a valid web address (e.g., https://example.com/product/123).'
      });
    }

    // Disallow invalid hosts or non-FQDNs (e.g. random letters with no dot)
    if (!parsedUrl.hostname || !parsedUrl.hostname.includes('.') || parsedUrl.hostname.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'Invalid domain name. Please enter a complete website URL.'
      });
    }

    // Disallow localhost and private network scanning
    const host = parsedUrl.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || host.endsWith('.local')) {
      return res.status(400).json({
        success: false,
        error: 'Local or private network URLs cannot be scanned.'
      });
    }

    // Check if URL is obviously a non-product search engine or generic homepage
    const nonProductDomains = ['google.com', 'google.co.in', 'bing.com', 'yahoo.com', 'duckduckgo.com', 'wikipedia.org', 'facebook.com', 'twitter.com', 'instagram.com', 'reddit.com'];
    const bareHost = host.replace(/^www\./, '');
    if (nonProductDomains.includes(bareHost) && (parsedUrl.pathname === '/' || parsedUrl.pathname === '')) {
      return res.status(400).json({
        success: false,
        error: 'The provided URL is a search engine or generic website, not an e-commerce product page. Please provide a direct product link.'
      });
    }

    let extractedProduct: ExtractedProduct | null = null;

    // Attempt to fetch the URL to extract real metadata / JSON-LD
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(parsedUrl.href, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();

        // 1. Try to extract JSON-LD Product Schema
        const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
        if (jsonLdMatches) {
          for (const block of jsonLdMatches) {
            try {
              const inner = block.replace(/<script[^>]*>|<\/script>/gi, '').trim();
              const parsed = JSON.parse(inner);
              const items = Array.isArray(parsed) ? parsed : [parsed];
              for (const item of items) {
                const type = item['@type'];
                if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) {
                  const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
                  const price = offers?.price ? Number(offers.price) : undefined;
                  const currency = offers?.priceCurrency || '₹';
                  const title = item.name || item.title;
                  const rating = item.aggregateRating?.ratingValue ? Number(item.aggregateRating.ratingValue) : undefined;
                  const reviewCount = item.aggregateRating?.reviewCount ? Number(item.aggregateRating.reviewCount) : undefined;
                  const desc = item.description || '';

                  if (title) {
                    extractedProduct = {
                      url: parsedUrl.href,
                      domain: bareHost,
                      title: String(title),
                      currentPrice: price != null && !isNaN(price) ? price : null,
                      currency: String(currency),
                      rating: rating != null && !isNaN(rating) ? rating : null,
                      reviewCount: reviewCount != null && !isNaN(reviewCount) ? reviewCount : null,
                      description: String(desc),
                      seller: {
                        name: item.brand?.name || offers?.seller?.name || bareHost,
                      },
                      extractedVia: 'json-ld'
                    };
                    break;
                  }
                }
              }
              if (extractedProduct) break;
            } catch {
              // continue
            }
          }
        }

        // 2. Try OpenGraph and Meta tags
        if (!extractedProduct) {
          const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                               html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
          const ogPriceMatch = html.match(/<meta[^>]*property=["'](?:product:price:amount|og:price:amount)["'][^>]*content=["']([^"']+)["']/i);
          const ogCurrencyMatch = html.match(/<meta[^>]*property=["'](?:product:price:currency|og:price:currency)["'][^>]*content=["']([^"']+)["']/i);
          const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                              html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);

          const pageTitleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const title = ogTitleMatch?.[1] || pageTitleMatch?.[1];

          // Check if title looks like a 404 or non-product error
          if (title && !title.toLowerCase().includes('404') && !title.toLowerCase().includes('page not found') && !title.toLowerCase().includes('access denied')) {
            const price = ogPriceMatch?.[1] ? parseFloat(ogPriceMatch[1]) : null;
            extractedProduct = {
              url: parsedUrl.href,
              domain: bareHost,
              title: title.replace(/\s+/g, ' ').trim(),
              currentPrice: price && !isNaN(price) ? price : null,
              currency: ogCurrencyMatch?.[1] || '₹',
              description: ogDescMatch?.[1] ? ogDescMatch[1].trim() : '',
              seller: { name: bareHost },
              extractedVia: 'meta-tags'
            };
          }
        }
      }
    } catch {
      // Fetch error or network restriction
    }

    // 3. Fallback: Parse shopping URL structure if path indicates an e-commerce product
    if (!extractedProduct) {
      const pathname = parsedUrl.pathname;
      const isProductPath = /\/(dp|gp\/product|product|item|p|itm|buy|goods)\/[a-z0-9-_]+/i.test(pathname) ||
                            /[?&](id|pid|sku|product_id)=[a-z0-9-_]+/i.test(parsedUrl.search);

      if (isProductPath) {
        // Extract product name from path segments
        const segments = pathname.split('/').filter(Boolean);
        const nameSegment = segments.find(s => s.length > 5 && !['dp', 'product', 'item', 'p', 'gp'].includes(s.toLowerCase()));
        const cleanName = nameSegment ? decodeURIComponent(nameSegment).replace(/[-_]/g, ' ') : `Product on ${bareHost}`;

        extractedProduct = {
          url: parsedUrl.href,
          domain: bareHost,
          title: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
          currentPrice: null,
          currency: '₹',
          priceUnavailable: true,
          seller: { name: bareHost },
          description: `Product listing on ${bareHost}.`,
          extractedVia: 'url-heuristics'
        };
      }
    }

    if (!extractedProduct || !extractedProduct.title || extractedProduct.title.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'No product information could be detected on this page. Please make sure the URL leads directly to a valid product page.'
      });
    }

    const analysis = await analyzeProductRisk(extractedProduct);

    return res.json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    console.error('API /api/scan-url error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while scanning the product URL. Please check the URL and try again.'
    });
  }
});

// Serve the manifest and extension files for inspection
app.get('/api/extension/manifest', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'trustcart-ai', 'manifest.json'));
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`TrustCart AI server listening on http://localhost:${PORT}`);
  });
}

startServer();
