/**
 * TrustCart AI - Storage Utility
 * Supports Chrome Extension chrome.storage.local with automatic localStorage fallback
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TrustCartStorage = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  const SAVED_PRODUCTS_KEY = 'trustcart_saved_products';
  const HISTORY_KEY = 'trustcart_analysis_history';
  const SETTINGS_KEY = 'trustcart_settings';

  const isChromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

  function getItem(key) {
    return new Promise((resolve) => {
      if (isChromeStorage) {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] || null);
        });
      } else {
        try {
          const val = localStorage.getItem(key);
          resolve(val ? JSON.parse(val) : null);
        } catch (e) {
          resolve(null);
        }
      }
    });
  }

  function setItem(key, value) {
    return new Promise((resolve) => {
      if (isChromeStorage) {
        chrome.storage.local.set({ [key]: value }, () => resolve(true));
      } else {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          resolve(true);
        } catch (e) {
          resolve(false);
        }
      }
    });
  }

  async function getSavedProducts() {
    return (await getItem(SAVED_PRODUCTS_KEY)) || [];
  }

  async function saveProduct(analysis) {
    const list = await getSavedProducts();
    const existingIdx = list.findIndex(item => item.url === analysis.product.url || item.id === analysis.id);
    
    const record = {
      id: analysis.id || `saved_${Date.now()}`,
      productTitle: analysis.product.title,
      domain: analysis.product.domain || 'unknown',
      url: analysis.product.url,
      currentPriceText: analysis.product.currentPrice != null ? `${analysis.product.currency || ''}${analysis.product.currentPrice}` : 'Price unavailable',
      trustScore: analysis.trustScore,
      riskLevel: analysis.riskLevel,
      analyzedAt: analysis.analyzedAt || new Date().toISOString(),
      fullAnalysis: analysis
    };

    if (existingIdx >= 0) {
      list[existingIdx] = record;
    } else {
      list.unshift(record);
    }

    await setItem(SAVED_PRODUCTS_KEY, list);
    return record;
  }

  async function removeSavedProduct(id) {
    const list = await getSavedProducts();
    const updated = list.filter(item => item.id !== id);
    await setItem(SAVED_PRODUCTS_KEY, updated);
    return updated;
  }

  async function getAnalysisHistory() {
    return (await getItem(HISTORY_KEY)) || [];
  }

  async function addAnalysisHistory(analysis) {
    const history = await getAnalysisHistory();
    const record = {
      id: analysis.id || `hist_${Date.now()}`,
      productTitle: analysis.product.title,
      domain: analysis.product.domain || 'unknown',
      url: analysis.product.url,
      currentPriceText: analysis.product.currentPrice != null ? `${analysis.product.currency || ''}${analysis.product.currentPrice}` : 'Price unavailable',
      trustScore: analysis.trustScore,
      riskLevel: analysis.riskLevel,
      analyzedAt: analysis.analyzedAt || new Date().toISOString(),
      fullAnalysis: analysis
    };

    // Keep up to 50 latest analyses
    const updated = [record, ...history.filter(h => h.url !== record.url)].slice(0, 50);
    await setItem(HISTORY_KEY, updated);
    return updated;
  }

  async function clearHistory() {
    await setItem(HISTORY_KEY, []);
    return [];
  }

  async function getSettings() {
    const defaultSettings = {
      apiEndpoint: 'http://localhost:3000/api/analyze',
      autoScan: false,
      notifications: true,
      demoMode: false
    };
    const stored = await getItem(SETTINGS_KEY);
    return Object.assign({}, defaultSettings, stored || {});
  }

  async function updateSettings(settings) {
    const current = await getSettings();
    const updated = Object.assign({}, current, settings);
    await setItem(SETTINGS_KEY, updated);
    return updated;
  }

  return {
    getSavedProducts,
    saveProduct,
    removeSavedProduct,
    getAnalysisHistory,
    addAnalysisHistory,
    clearHistory,
    getSettings,
    updateSettings
  };
});
