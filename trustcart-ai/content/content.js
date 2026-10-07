/**
 * TrustCart AI - Content Script
 * Injected into shopping pages to coordinate on-page scanning and extraction
 */

(function () {
  console.log('[TrustCart AI] Content script active on:', window.location.hostname);

  // Message dispatcher
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'PING') {
        sendResponse({ status: 'ok', domain: window.location.hostname });
        return true;
      }

      if (request.action === 'EXTRACT_PRODUCT_DATA') {
        try {
          if (!window.TrustCartExtractor) {
            sendResponse({
              success: false,
              error: 'Extractor module is not yet loaded on this page.'
            });
            return true;
          }

          const result = window.TrustCartExtractor.extractProduct();
          sendResponse({
            success: true,
            isViable: result.isViable,
            product: result.product
          });
        } catch (err) {
          sendResponse({
            success: false,
            error: err.message || 'Failed to extract product data from page.'
          });
        }
        return true; // Keep asynchronous sendResponse open
      }
    });
  }
})();
