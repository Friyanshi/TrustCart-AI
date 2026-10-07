/**
 * TrustCart AI - Multi-Website Product Data Extractor
 * Safely extracts publicly available product info using:
 * 1. JSON-LD Schema.org Product markup (highest fidelity)
 * 2. OpenGraph and standard Meta tags
 * 3. Microdata
 * 4. Resilient semantic DOM selectors & platform adapters (Amazon, Flipkart, Shopify, etc.)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TrustCartExtractor = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  /**
   * Cleans text by stripping whitespace and control characters
   */
  function cleanText(text) {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Safely parses numeric price and detects currency
   */
  function parsePriceString(str) {
    if (!str) return null;
    const clean = String(str).trim();
    
    let currency = '₹';
    if (clean.includes('$')) currency = '$';
    else if (clean.includes('€')) currency = '€';
    else if (clean.includes('£')) currency = '£';
    else if (clean.includes('¥')) currency = '¥';
    else if (clean.includes('Rs') || clean.includes('₹') || clean.includes('INR')) currency = '₹';
    
    // Extract first valid numeric floating sequence
    const match = clean.replace(/,/g, '').match(/[\d]+(\.[\d]{1,2})?/);
    if (!match) return null;
    const num = parseFloat(match[0]);
    if (isNaN(num)) return null;

    return { value: num, currency };
  }

  /**
   * Tries to find JSON-LD Product schema
   */
  function extractFromJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const json = JSON.parse(script.textContent || '{}');
        const items = Array.isArray(json) ? json : (json['@graph'] ? json['@graph'] : [json]);

        for (const item of items) {
          const type = item['@type'];
          if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) {
            const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            
            let currentPrice = null;
            let currency = '₹';
            if (offers) {
              const parsed = parsePriceString(offers.price || offers.lowPrice);
              if (parsed) {
                currentPrice = parsed.value;
                currency = offers.priceCurrency || parsed.currency;
              }
            }

            const aggRating = item.aggregateRating || {};
            const rating = aggRating.ratingValue ? parseFloat(aggRating.ratingValue) : null;
            const reviewCount = aggRating.reviewCount ? parseInt(aggRating.reviewCount, 10) : (aggRating.ratingCount ? parseInt(aggRating.ratingCount, 10) : null);

            const reviews = [];
            if (Array.isArray(item.review)) {
              for (const r of item.review.slice(0, 10)) {
                reviews.push({
                  author: r.author?.name || 'Customer',
                  rating: r.reviewRating?.ratingValue ? parseFloat(r.reviewRating.ratingValue) : undefined,
                  text: cleanText(r.reviewBody || r.description || ''),
                  date: r.datePublished
                });
              }
            }

            const sellerName = offers?.seller?.name || item.brand?.name || undefined;

            return {
              title: cleanText(item.name || ''),
              currentPrice,
              originalPrice: null,
              currency,
              rating,
              reviewCount,
              reviews,
              seller: {
                name: sellerName,
                isVerified: false
              },
              description: cleanText(item.description || ''),
              brand: item.brand?.name || undefined,
              images: Array.isArray(item.image) ? item.image : (item.image ? [item.image] : []),
              extractedVia: 'json-ld'
            };
          }
        }
      } catch (e) {
        // Continue searching
      }
    }
    return null;
  }

  /**
   * Tries to extract from OpenGraph & standard Meta tags
   */
  function extractFromMetaTags() {
    const getMeta = (names) => {
      for (const name of names) {
        const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
        if (el && el.getAttribute('content')) {
          return cleanText(el.getAttribute('content'));
        }
      }
      return null;
    };

    const title = getMeta(['og:title', 'twitter:title']);
    const desc = getMeta(['og:description', 'twitter:description', 'description']);
    const priceStr = getMeta(['product:price:amount', 'og:price:amount']);
    const currency = getMeta(['product:price:currency', 'og:price:currency']) || '₹';
    const image = getMeta(['og:image', 'twitter:image']);

    if (!title) return null;

    let price = null;
    if (priceStr) {
      const parsed = parsePriceString(priceStr);
      if (parsed) price = parsed.value;
    }

    return {
      title,
      description: desc || '',
      currentPrice: price,
      originalPrice: null,
      currency,
      images: image ? [image] : [],
      extractedVia: 'meta-tags'
    };
  }

  /**
   * Domain-specific and resilient semantic DOM selectors
   */
  function extractFromDomSelectors() {
    const domain = window.location.hostname.toLowerCase();

    let title = '';
    let currentPrice = null;
    let originalPrice = null;
    let currency = '₹';
    let rating = null;
    let reviewCount = null;
    let sellerName = undefined;
    let returnPolicyText = undefined;
    let warrantyText = undefined;
    let description = '';
    const specifications = {};
    const reviews = [];

    // Title Selectors
    const titleSelectors = [
      '#productTitle',                    // Amazon
      '.B_NuCI',                          // Flipkart
      'h1.product-title',                 // Shopify / Generic
      'h1[class*="product"]',
      'h1[class*="title"]',
      'h1.title',
      'h1'
    ];
    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el && cleanText(el.textContent).length > 3) {
        title = cleanText(el.textContent);
        break;
      }
    }

    // Price Selectors
    const currentPriceSelectors = [
      '.a-price .a-offscreen',            // Amazon
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '._30jeq3._16Jk6d',                 // Flipkart
      '.price--current',                  // Shopify
      '[data-product-price]',
      '.product-price',
      '.price'
    ];
    for (const sel of currentPriceSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const parsed = parsePriceString(el.textContent);
        if (parsed) {
          currentPrice = parsed.value;
          currency = parsed.currency;
          break;
        }
      }
    }

    // Original / List / MRP Price Selectors
    const originalPriceSelectors = [
      '.a-price.a-text-price .a-offscreen', // Amazon
      '#priceblock_listprice',
      '._3I9_wc._2p6lqe',                   // Flipkart
      '.price--compare',
      '.regular-price',
      'del',
      'strike'
    ];
    for (const sel of originalPriceSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const parsed = parsePriceString(el.textContent);
        if (parsed && parsed.value > (currentPrice || 0)) {
          originalPrice = parsed.value;
          break;
        }
      }
    }

    // Rating Selectors
    const ratingSelectors = [
      '#acrPopover .a-icon-alt',            // Amazon
      'span[data-hook="rating-out-of-text"]',
      '._3LWZlK',                           // Flipkart
      '[itemprop="ratingValue"]',
      '.product-rating',
      '.rating-score'
    ];
    for (const sel of ratingSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const match = el.textContent.match(/[\d]+(\.[\d]+)?/);
        if (match) {
          const val = parseFloat(match[0]);
          if (val <= 5.0) {
            rating = val;
            break;
          }
        }
      }
    }

    // Review Count Selectors
    const countSelectors = [
      '#acrCustomerReviewText',             // Amazon
      '._2_R_DZ span',                     // Flipkart
      '[itemprop="reviewCount"]',
      '.review-count',
      '.total-reviews'
    ];
    for (const sel of countSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const match = el.textContent.replace(/,/g, '').match(/\d+/);
        if (match) {
          reviewCount = parseInt(match[0], 10);
          break;
        }
      }
    }

    // Seller Selectors
    const sellerSelectors = [
      '#sellerProfileTriggerId',            // Amazon
      '#merchant-info',
      '#sellerName',                        // Flipkart
      '._2NKhZn',
      '[class*="seller-name"]',
      '[class*="merchant-name"]',
      '.vendor'
    ];
    for (const sel of sellerSelectors) {
      const el = document.querySelector(sel);
      if (el && cleanText(el.textContent).length > 1) {
        sellerName = cleanText(el.textContent).replace(/^Sold by:?\s*/i, '');
        break;
      }
    }

    // Review Elements
    const reviewSelectors = [
      '[data-hook="review-collapsed"]',     // Amazon
      'div[data-hook="review-body"]',
      '._6K-7Co',                           // Flipkart
      '.review-content',
      '.comment-text'
    ];
    for (const sel of reviewSelectors) {
      const els = document.querySelectorAll(sel);
      if (els && els.length > 0) {
        for (const el of Array.from(els).slice(0, 10)) {
          const text = cleanText(el.textContent);
          if (text.length > 15) {
            reviews.push({ text });
          }
        }
        break;
      }
    }

    // Policy & Return Detection in DOM text
    const pageText = document.body ? document.body.innerText.slice(0, 15000) : '';
    let returnAvailable = 'unknown';
    let returnWindowDays = undefined;

    if (pageText.match(/non[- ]returnable|no returns accepted|final sale/i)) {
      returnAvailable = false;
    } else {
      const returnMatch = pageText.match(/(\d+)[- ]day(s)?\s+(replacement|return)/i);
      if (returnMatch) {
        returnAvailable = true;
        returnWindowDays = parseInt(returnMatch[1], 10);
        returnPolicyText = returnMatch[0];
      } else if (pageText.match(/free return|eligible for return|return policy/i)) {
        returnAvailable = true;
      }
    }

    const warrantyMatch = pageText.match(/(\d+)[- ](year|month|yr|mo)\s+(warranty|guarantee)/i);
    if (warrantyMatch) {
      warrantyText = warrantyMatch[0];
    }

    // Description & Features
    const descSelectors = [
      '#feature-bullets',                   // Amazon
      '#productDescription',
      '._1mXcCf',                           // Flipkart
      '.product-single__description',       // Shopify
      '[itemprop="description"]',
      '.description'
    ];
    for (const sel of descSelectors) {
      const el = document.querySelector(sel);
      if (el && cleanText(el.textContent).length > 20) {
        description = cleanText(el.textContent).slice(0, 2500);
        break;
      }
    }

    // Specifications Table
    const specRows = document.querySelectorAll('table.prodDetTable tr, table.a-keyvalue tr, ._14cfVK tr, [class*="spec-row"]');
    if (specRows.length > 0) {
      for (const row of Array.from(specRows).slice(0, 12)) {
        const th = row.querySelector('th, td.a-color-secondary, ._1hKmbr');
        const td = row.querySelector('td.prodDetAttrValue, td.a-size-base, ._21lJbe');
        if (th && td) {
          const key = cleanText(th.textContent);
          const val = cleanText(td.textContent);
          if (key && val) specifications[key] = val;
        }
      }
    }

    return {
      title,
      currentPrice,
      originalPrice,
      currency,
      rating,
      reviewCount,
      sellerName,
      reviews,
      returnAvailable,
      returnWindowDays,
      returnPolicyText,
      warrantyText,
      description,
      specifications,
      extractedVia: 'selectors'
    };
  }

  /**
   * Master product extraction function
   */
  function extractProduct() {
    const url = window.location.href;
    const domain = window.location.hostname.replace(/^www\./, '');

    // Step 1: Check JSON-LD
    const jsonLd = extractFromJsonLd();

    // Step 2: Check Meta Tags
    const meta = extractFromMetaTags();

    // Step 3: Check DOM Selectors
    const dom = extractFromDomSelectors();

    // Combine best available signals without inventing fields
    const title = jsonLd?.title || dom.title || meta?.title || '';
    const currentPrice = jsonLd?.currentPrice != null ? jsonLd.currentPrice : (dom.currentPrice != null ? dom.currentPrice : (meta?.currentPrice != null ? meta.currentPrice : null));
    const originalPrice = dom.originalPrice || jsonLd?.originalPrice || null;
    const currency = jsonLd?.currency || dom.currency || meta?.currency || '₹';
    const rating = jsonLd?.rating != null ? jsonLd.rating : (dom.rating != null ? dom.rating : null);
    const reviewCount = jsonLd?.reviewCount != null ? jsonLd.reviewCount : (dom.reviewCount != null ? dom.reviewCount : null);
    const reviews = (jsonLd?.reviews && jsonLd.reviews.length > 0) ? jsonLd.reviews : dom.reviews;
    const sellerName = dom.sellerName || jsonLd?.seller?.name;
    const description = jsonLd?.description || dom.description || meta?.description || '';
    const specifications = dom.specifications || {};

    // Calculate discount if both MRP and sale price are available
    let discountPercent = null;
    let isDiscountCalculated = false;
    if (originalPrice && currentPrice && originalPrice > currentPrice) {
      discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
      isDiscountCalculated = true;
    }

    // Determine missing fields
    const missingFields = [];
    if (!currentPrice) missingFields.push('Price');
    if (!rating && (!reviews || reviews.length === 0)) missingFields.push('Reviews');
    if (!sellerName) missingFields.push('Seller info');
    if (dom.returnAvailable === 'unknown') missingFields.push('Return policy');
    if (!description) missingFields.push('Description');

    const extractedVia = jsonLd ? 'json-ld' : (dom.title ? 'selectors' : (meta?.title ? 'meta-tags' : 'heuristic'));

    // Check if sufficient info exists to classify as an online product page
    const isViable = Boolean(title && title.length >= 3 && (currentPrice != null || description.length > 40 || rating != null));

    return {
      isViable,
      product: {
        url,
        domain,
        title,
        currentPrice,
        originalPrice,
        currency,
        discountPercent,
        isDiscountCalculated,
        priceUnavailable: currentPrice == null,
        rating,
        reviewCount,
        reviews: reviews || [],
        seller: {
          name: sellerName,
          isVerified: false
        },
        policies: {
          returnAvailable: dom.returnAvailable,
          returnWindowDays: dom.returnWindowDays,
          refundPolicyText: dom.returnPolicyText,
          warrantyText: dom.warrantyText
        },
        description,
        specifications,
        extractedVia,
        missingFields
      }
    };
  }

  return {
    extractProduct,
    cleanText,
    parsePriceString
  };
});
