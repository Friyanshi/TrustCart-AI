/**
 * TrustCart AI - Side Panel Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const spBtnRefresh = document.getElementById('sp-btn-refresh');
  const spBtnDashboard = document.getElementById('sp-btn-dashboard');
  
  const spDomainBadge = document.getElementById('sp-domain-badge');
  const spProductTitle = document.getElementById('sp-product-title');
  const spPrice = document.getElementById('sp-price');
  const spOriginalPrice = document.getElementById('sp-original-price');
  const spDiscount = document.getElementById('sp-discount');
  const spRating = document.getElementById('sp-rating');

  const spScoreHero = document.getElementById('sp-score-hero');
  const spTrustScore = document.getElementById('sp-trust-score');
  const spRiskTag = document.getElementById('sp-risk-tag');
  const spSummary = document.getElementById('sp-summary');

  const spPositiveSignals = document.getElementById('sp-positive-signals');
  const spWarningSignals = document.getElementById('sp-warning-signals');
  const spRecommendations = document.getElementById('sp-recommendations');
  const spSpecsContainer = document.getElementById('sp-specs-container');

  // Categories elements
  const catMap = {
    price: { score: document.getElementById('sp-score-price'), bar: document.getElementById('sp-bar-price'), desc: document.getElementById('sp-desc-price') },
    review: { score: document.getElementById('sp-score-review'), bar: document.getElementById('sp-bar-review'), desc: document.getElementById('sp-desc-review') },
    seller: { score: document.getElementById('sp-score-seller'), bar: document.getElementById('sp-bar-seller'), desc: document.getElementById('sp-desc-seller') },
    policy: { score: document.getElementById('sp-score-policy'), bar: document.getElementById('sp-bar-policy'), desc: document.getElementById('sp-desc-policy') },
    description: { score: document.getElementById('sp-score-desc'), bar: document.getElementById('sp-bar-desc'), desc: document.getElementById('sp-desc-description') }
  };

  async function loadActivePageReport() {
    try {
      if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) {
        loadDemoReport();
        return;
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        loadDemoReport();
        return;
      }

      chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_PRODUCT_DATA' }, async (response) => {
        if (response && response.success && response.isViable) {
          const settings = await TrustCartStorage.getSettings();
          const analysis = await TrustCartAIAnalyzer.analyzeProduct(response.product, {
            apiEndpoint: settings.apiEndpoint
          });
          renderSidePanelReport(analysis);
        } else {
          loadDemoReport();
        }
      });
    } catch (e) {
      loadDemoReport();
    }
  }

  function loadDemoReport() {
    const demo = {
      product: {
        title: 'SoundPro Elite ANC Wireless Bluetooth Headphones',
        domain: 'example-shopping.com',
        currentPrice: 1299,
        originalPrice: 4999,
        currency: '₹',
        discountPercent: 74,
        rating: 4.8,
        specifications: {
          'Battery': '40 Hours Playback',
          'Bluetooth': '5.3 Low Latency',
          'Noise Reduction': 'Active Hybrid ANC',
          'Warranty': '6 Months Brand Cover'
        }
      },
      trustScore: 61,
      riskLevel: 'MODERATE RISK',
      summary: 'The product displays some notable risk indicators such as steep discount and limited reviews alongside reassuring return terms.',
      riskCategories: {
        price: { score: 75, signals: [{ text: 'Steep discount of 74% compared to stated MRP.' }] },
        review: { score: 55, signals: [{ text: 'Several reviews share formulaic wording patterns.' }] },
        seller: { score: 62, signals: [{ text: 'Merchant registration details are limited.' }] },
        policy: { score: 35, signals: [{ text: '7-day replacement window detected.' }] },
        description: { score: 48, signals: [{ text: 'Contains strong absolute claims ("miracle audio").' }] }
      },
      positiveSignals: [
        '7-day return and replacement policy clearly available',
        'Detailed technical specifications table provided',
        'Verified delivery partner noted'
      ],
      warnings: [
        'Unusually high discount detected (74% off)',
        'Customer review text shows repetitive phrasing',
        'Storefront rating statistics are currently unlisted'
      ],
      recommendations: [
        'Compare product model price across authorized retailers',
        'Sort reviews by most recent and check verified purchase status',
        'Retain order confirmation and record unboxing'
      ]
    };

    renderSidePanelReport(demo);
  }

  function renderSidePanelReport(data) {
    const p = data.product || {};
    spDomainBadge.textContent = p.domain || 'Online Store';
    spProductTitle.textContent = p.title || 'Product Analysis';
    spPrice.textContent = p.currentPrice != null ? `${p.currency || ''}${p.currentPrice.toLocaleString()}` : 'Unavailable';
    spOriginalPrice.textContent = p.originalPrice != null ? `${p.currency || ''}${p.originalPrice.toLocaleString()}` : 'Unavailable';
    spDiscount.textContent = p.discountPercent != null ? `${p.discountPercent}%` : 'N/A';
    spRating.textContent = p.rating != null ? `${p.rating} / 5.0` : 'No rating';

    // Hero Score
    const score = data.trustScore;
    spTrustScore.textContent = score;
    spRiskTag.textContent = data.riskLevel;
    spSummary.textContent = data.summary;

    spScoreHero.className = 'tc-sp-card tc-score-hero';
    spRiskTag.className = 'tc-risk-tag';

    if (score >= 80) {
      spScoreHero.classList.add('low');
      spRiskTag.classList.add('low');
    } else if (score >= 60) {
      spScoreHero.classList.add('mod');
      spRiskTag.classList.add('mod');
    } else if (score >= 40) {
      spScoreHero.classList.add('high');
      spRiskTag.classList.add('high');
    } else {
      spScoreHero.classList.add('vhigh');
      spRiskTag.classList.add('vhigh');
    }

    // Categories
    const cats = data.riskCategories || {};
    Object.keys(catMap).forEach(key => {
      const c = cats[key];
      const ui = catMap[key];
      if (c && ui) {
        ui.score.textContent = `${c.score} / 100`;
        ui.bar.style.width = `${c.score}%`;

        let color = '#10b981';
        if (c.score >= 70) color = '#ef4444';
        else if (c.score >= 50) color = '#f97316';
        else if (c.score >= 30) color = '#f59e0b';
        
        ui.bar.style.background = color;
        ui.score.style.color = color;

        if (c.signals && c.signals[0]) {
          ui.desc.textContent = c.signals[0].text;
        }
      }
    });

    // Positive
    spPositiveSignals.innerHTML = '';
    (data.positiveSignals || []).forEach(sig => {
      const li = document.createElement('li');
      li.textContent = sig;
      spPositiveSignals.appendChild(li);
    });

    // Warnings
    spWarningSignals.innerHTML = '';
    (data.warnings || []).forEach(w => {
      const li = document.createElement('li');
      li.textContent = w;
      spWarningSignals.appendChild(li);
    });

    // Recommendations
    spRecommendations.innerHTML = '';
    (data.recommendations || []).forEach(r => {
      const li = document.createElement('li');
      li.textContent = r;
      spRecommendations.appendChild(li);
    });

    // Specs
    spSpecsContainer.innerHTML = '';
    const specs = p.specifications || {};
    const keys = Object.keys(specs);
    if (keys.length > 0) {
      keys.forEach(k => {
        const row = document.createElement('div');
        row.className = 'spec-row';
        row.innerHTML = `<span class="k">${k}</span><span class="v">${specs[k]}</span>`;
        spSpecsContainer.appendChild(row);
      });
    } else {
      spSpecsContainer.innerHTML = '<div class="tc-muted-notice">No structured specification table found on page.</div>';
    }
  }

  spBtnRefresh.addEventListener('click', () => loadActivePageReport());
  spBtnDashboard.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
    }
  });

  loadActivePageReport();
});
