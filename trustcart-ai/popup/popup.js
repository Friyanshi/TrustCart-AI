/**
 * TrustCart AI - Extension Popup Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const viewDetection = document.getElementById('view-detection');
  const viewScanning = document.getElementById('view-scanning');
  const viewResults = document.getElementById('view-results');

  // Mode buttons
  const btnModePage = document.getElementById('btn-mode-page');
  const btnModeLink = document.getElementById('btn-mode-link');
  const boxModePage = document.getElementById('box-mode-page');
  const boxModeLink = document.getElementById('box-mode-link');
  const inputPastedUrl = document.getElementById('input-pasted-url');
  const btnAnalyzePasted = document.getElementById('btn-analyze-pasted');

  // Page detection elements
  const detectionStatusBanner = document.getElementById('detection-status-banner');
  const detectionStatusText = document.getElementById('detection-status-text');
  const detectionIndicator = document.getElementById('detection-indicator');
  const productPreviewBox = document.getElementById('product-preview-box');
  const noProductBox = document.getElementById('no-product-box');
  const noProductText = document.getElementById('no-product-text');
  const detectedProductTitle = document.getElementById('detected-product-title');
  const detectedProductPrice = document.getElementById('detected-product-price');
  const detectedProductDomain = document.getElementById('detected-product-domain');
  const btnAnalyze = document.getElementById('btn-analyze');
  const btnRetryDetection = document.getElementById('btn-retry-detection');
  const btnExplainScore = document.getElementById('btn-explain-score');
  const scoreExplanationBox = document.getElementById('score-explanation-box');
  const btnRescan = document.getElementById('btn-rescan');

  // Result Elements
  const verdictBanner = document.getElementById('verdict-banner');
  const verdictTitle = document.getElementById('verdict-title');
  const verdictDesc = document.getElementById('verdict-desc');
  const resultTrustScore = document.getElementById('result-trust-score');
  const resultRiskLevel = document.getElementById('result-risk-level');
  const scoreCircleBar = document.getElementById('score-circle-bar');
  const positiveSignalsList = document.getElementById('positive-signals-list');
  const cardWarnings = document.getElementById('card-warnings');
  const warningsList = document.getElementById('warnings-list');
  const recommendationsList = document.getElementById('recommendations-list');
  const explTitle = document.getElementById('expl-title');
  const explPoints = document.getElementById('expl-points');

  let currentExtractedProduct = null;
  let activeTabId = null;

  // Mode Switcher
  btnModePage.addEventListener('click', () => {
    btnModePage.classList.add('active');
    btnModeLink.classList.remove('active');
    boxModePage.classList.remove('hidden');
    boxModeLink.classList.add('hidden');
  });

  btnModeLink.addEventListener('click', () => {
    btnModeLink.classList.add('active');
    btnModePage.classList.remove('active');
    boxModeLink.classList.remove('hidden');
    boxModePage.classList.add('hidden');
  });

  // View Switcher
  function switchView(viewName) {
    viewDetection.classList.remove('active');
    viewScanning.classList.remove('active');
    viewResults.classList.remove('active');

    if (viewName === 'detection') viewDetection.classList.add('active');
    if (viewName === 'scanning') viewScanning.classList.add('active');
    if (viewName === 'results') viewResults.classList.add('active');
  }

  // Detect Active Page in Chrome
  async function detectProductOnPage() {
    detectionStatusBanner.style.background = '#eef2ff';
    detectionStatusBanner.style.color = '#4f46e5';
    detectionStatusText.textContent = 'Detecting product on current page...';
    detectionIndicator.style.backgroundColor = '#4f46e5';
    productPreviewBox.classList.add('hidden');
    noProductBox.classList.add('hidden');
    btnAnalyze.classList.add('hidden');

    try {
      if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) {
        showNoProduct('Please open a shopping product page in Chrome.');
        return;
      }

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) {
        showNoProduct('Active tab is not an e-commerce store page.');
        return;
      }

      activeTabId = tab.id;

      chrome.tabs.sendMessage(activeTabId, { action: 'EXTRACT_PRODUCT_DATA' }, async (response) => {
        if (chrome.runtime.lastError || !response) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: activeTabId },
              files: ['utils/scoring.js', 'content/extractor.js', 'content/content.js']
            });
            chrome.tabs.sendMessage(activeTabId, { action: 'EXTRACT_PRODUCT_DATA' }, (retryRes) => {
              handleExtractionResult(retryRes);
            });
          } catch (err) {
            showNoProduct('Unable to find product data on this page.');
          }
        } else {
          handleExtractionResult(response);
        }
      });
    } catch (e) {
      showNoProduct('Unable to inspect page.');
    }
  }

  function handleExtractionResult(response) {
    if (response && response.success && response.isViable && response.product && response.product.title) {
      currentExtractedProduct = response.product;
      showDetectedProduct(currentExtractedProduct);
    } else {
      showNoProduct('This page does not contain detectable product info.');
    }
  }

  function showDetectedProduct(product) {
    detectionStatusBanner.style.background = '#ecfdf5';
    detectionStatusBanner.style.color = '#065f46';
    detectionStatusText.textContent = 'Product detected ✓';
    detectionIndicator.style.backgroundColor = '#10b981';

    detectedProductTitle.textContent = product.title || 'Untitled Product';
    detectedProductPrice.textContent = product.currentPrice != null
      ? `${product.currency || ''}${product.currentPrice.toLocaleString()}`
      : 'Price unavailable';
    detectedProductDomain.textContent = product.domain || 'Online Store';

    productPreviewBox.classList.remove('hidden');
    noProductBox.classList.add('hidden');
    btnAnalyze.classList.remove('hidden');
  }

  function showNoProduct(customMsg) {
    detectionStatusBanner.style.background = '#fffbeb';
    detectionStatusBanner.style.color = '#92400e';
    detectionStatusText.textContent = 'No product detected';
    detectionIndicator.style.backgroundColor = '#f59e0b';

    productPreviewBox.classList.add('hidden');
    noProductBox.classList.remove('hidden');
    btnAnalyze.classList.add('hidden');

    if (customMsg && noProductText) {
      noProductText.textContent = customMsg;
    }
  }

  // Run Scan Sequence
  async function runScanningSequence(product) {
    switchView('scanning');
    const steps = document.querySelectorAll('.tc-step');
    const completeMsg = document.getElementById('scan-complete-msg');
    completeMsg.classList.add('hidden');

    steps.forEach(s => {
      s.classList.remove('completed');
      s.querySelector('.tc-step-icon').textContent = '○';
    });

    const stepInterval = 200;
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, stepInterval));
      steps[i].classList.add('completed');
      steps[i].querySelector('.tc-step-icon').textContent = '✓';
    }

    try {
      const settings = await TrustCartStorage.getSettings();
      const analysis = await TrustCartAIAnalyzer.analyzeProduct(product, {
        apiEndpoint: settings.apiEndpoint
      });

      completeMsg.classList.remove('hidden');
      await new Promise(r => setTimeout(r, 250));

      renderResults(analysis);
      switchView('results');
    } catch (err) {
      alert('Analysis failed: ' + (err.message || 'Unable to analyze product signals.'));
      switchView('detection');
    }
  }

  function renderResults(analysis) {
    const score = analysis.trustScore;
    resultTrustScore.textContent = score;
    resultRiskLevel.textContent = analysis.riskLevel;
    resultRiskLevel.className = 'tc-risk-pill';

    let strokeColor = '#4f46e5';
    if (score >= 80) {
      resultRiskLevel.classList.add('low');
      strokeColor = '#10b981';
    } else if (score >= 60) {
      resultRiskLevel.classList.add('mod');
      strokeColor = '#f59e0b';
    } else if (score >= 40) {
      resultRiskLevel.classList.add('high');
      strokeColor = '#f97316';
    } else {
      resultRiskLevel.classList.add('vhigh');
      strokeColor = '#ef4444';
    }

    const offset = 264 - (264 * score) / 100;
    scoreCircleBar.style.stroke = strokeColor;
    setTimeout(() => {
      scoreCircleBar.style.strokeDashoffset = offset;
    }, 50);

    // Verdict
    const v = analysis.authenticity ? analysis.authenticity.verdict : (score >= 75 ? 'REAL' : (score < 45 ? 'FRAUD' : 'SUSPICIOUS'));
    verdictBanner.className = 'tc-verdict-box';
    if (v === 'REAL') {
      verdictBanner.classList.add('real');
      verdictTitle.textContent = '✓ REAL & AUTHENTIC PRODUCT';
      verdictDesc.textContent = analysis.authenticity?.primaryReason || 'Consistent retail pricing, verified seller, and authentic review feedback.';
    } else if (v === 'FRAUD') {
      verdictBanner.classList.add('fraud');
      verdictTitle.textContent = '⚠ HIGH RISK / SUSPECTED FRAUD';
      verdictDesc.textContent = analysis.authenticity?.primaryReason || 'Multiple risk signals detected: extreme markdown, unverified seller, or restrictive return terms.';
    } else if (v === 'AI_GENERATED') {
      verdictBanner.classList.add('ai');
      verdictTitle.textContent = '🤖 AI-GENERATED LISTING';
      verdictDesc.textContent = analysis.authenticity?.primaryReason || 'Synthetic description phrasing or repetitive bot reviews detected.';
    } else {
      verdictTitle.textContent = '⚠ SUSPICIOUS / EXERCISE CAUTION';
      verdictDesc.textContent = analysis.authenticity?.primaryReason || 'Product shows mixed signals. Check seller credentials before ordering.';
    }

    // Explanations
    explTitle.textContent = analysis.explanation ? analysis.explanation.title : 'Score Breakdown';
    explPoints.innerHTML = '';
    const points = (analysis.explanation && analysis.explanation.points) || [analysis.summary];
    points.forEach(pt => {
      const li = document.createElement('li');
      li.textContent = pt;
      explPoints.appendChild(li);
    });

    // Positive
    positiveSignalsList.innerHTML = '';
    if (analysis.positiveSignals && analysis.positiveSignals.length > 0) {
      analysis.positiveSignals.forEach(sig => {
        const li = document.createElement('li');
        li.textContent = sig;
        positiveSignalsList.appendChild(li);
      });
    } else {
      positiveSignalsList.innerHTML = '<li>No prominent positive indicators detected on this page.</li>';
    }

    // Warnings
    warningsList.innerHTML = '';
    if (analysis.warnings && analysis.warnings.length > 0) {
      cardWarnings.classList.remove('hidden');
      analysis.warnings.forEach(w => {
        const li = document.createElement('li');
        li.textContent = w;
        warningsList.appendChild(li);
      });
    } else {
      cardWarnings.classList.add('hidden');
    }

    // Recommendations
    recommendationsList.innerHTML = '';
    (analysis.recommendations || []).forEach(rec => {
      const li = document.createElement('li');
      li.textContent = rec;
      recommendationsList.appendChild(li);
    });
  }

  // Event Listeners
  btnAnalyze.addEventListener('click', () => {
    if (currentExtractedProduct && currentExtractedProduct.title) {
      runScanningSequence(currentExtractedProduct);
    }
  });

  btnAnalyzePasted.addEventListener('click', async () => {
    const raw = inputPastedUrl.value.trim();
    if (!raw) {
      alert('Please enter a product page URL.');
      return;
    }

    // URL validation
    let parsedUrl;
    try {
      const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      parsedUrl = new URL(withProto);
    } catch {
      alert('Invalid URL format. Please enter a valid web address (e.g. https://www.amazon.com/dp/...).');
      return;
    }

    if (!parsedUrl.hostname || !parsedUrl.hostname.includes('.') || parsedUrl.hostname.length < 4) {
      alert('Invalid domain name. Please enter a complete website link.');
      return;
    }

    switchView('scanning');

    try {
      const settings = await TrustCartStorage.getSettings();
      const endpoint = (settings.apiEndpoint || '').replace(/\/api\/analyze$/, '');
      const scanUrlEndpoint = `${endpoint}/api/scan-url`;

      const res = await fetch(scanUrlEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: parsedUrl.href })
      });

      const json = await res.json();

      if (!res.ok || !json.success || !json.data) {
        alert(json.error || 'No product information could be found at this URL.');
        switchView('detection');
        return;
      }

      renderResults(json.data);
      switchView('results');
    } catch (err) {
      alert('Network error while scanning URL. Please check connection and try again.');
      switchView('detection');
    }
  });

  btnRetryDetection.addEventListener('click', () => detectProductOnPage());

  btnExplainScore.addEventListener('click', () => {
    const isHidden = scoreExplanationBox.classList.contains('hidden');
    if (isHidden) {
      scoreExplanationBox.classList.remove('hidden');
      btnExplainScore.textContent = 'Hide Explanation';
    } else {
      scoreExplanationBox.classList.add('hidden');
      btnExplainScore.textContent = 'Why this score?';
    }
  });

  btnRescan.addEventListener('click', () => {
    switchView('detection');
    detectProductOnPage();
  });

  detectProductOnPage();
});
