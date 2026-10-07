/**
 * TrustCart AI - Validation & Sanitization Utilities
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TrustCartValidation = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  /**
   * Escape untrusted text to safely render inside innerHTML or text nodes
   */
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Validates if extracted product data has enough signals to be analyzed
   */
  function isViableProduct(product) {
    if (!product || typeof product !== 'object') return false;
    const hasTitle = typeof product.title === 'string' && product.title.trim().length >= 3;
    const hasPriceOrDesc = (product.currentPrice != null && product.currentPrice > 0) ||
      (typeof product.description === 'string' && product.description.trim().length > 20) ||
      (product.rating != null);
    return Boolean(hasTitle && hasPriceOrDesc);
  }

  /**
   * Validates the schema of an AI analysis payload
   */
  function validateAnalysisResponse(data) {
    if (!data || typeof data !== 'object') return false;
    const validLevels = ['LOW RISK', 'MODERATE RISK', 'HIGH RISK', 'VERY HIGH RISK'];
    if (typeof data.trustScore !== 'number' || data.trustScore < 0 || data.trustScore > 100) return false;
    if (!validLevels.includes(data.riskLevel)) return false;
    if (!data.riskCategories || typeof data.riskCategories !== 'object') return false;
    return true;
  }

  return {
    escapeHtml,
    isViableProduct,
    validateAnalysisResponse
  };
});
