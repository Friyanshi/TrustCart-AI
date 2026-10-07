/**
 * TrustCart AI - Client AI Analyzer Orchestrator
 * Calls the secure backend proxy endpoint for Gemini AI analysis, with deterministic fallback
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TrustCartAIAnalyzer = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  async function analyzeProduct(product, options = {}) {
    const scoringEngine = typeof window !== 'undefined' && window.TrustCartScoring ? window.TrustCartScoring : (typeof self !== 'undefined' && self.TrustCartScoring ? self.TrustCartScoring : null);
    
    // Step 1: Pre-calculate deterministic baseline
    let baseline;
    if (scoringEngine) {
      baseline = scoringEngine.calculateTrustScore(product);
    }

    const endpoint = options.apiEndpoint || 'http://localhost:3000/api/analyze';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('[TrustCart AI] Server endpoint unavailable or network error. Using deterministic engine.', err);
    }

    // Step 2: Graceful fallback if server API is offline or returns error
    if (baseline) {
      return {
        id: `tc_local_${Date.now()}`,
        product,
        trustScore: baseline.trustScore,
        riskLevel: baseline.riskLevel,
        riskCategories: baseline.riskCategories,
        summary: `The product shows ${baseline.riskLevel.toLowerCase()} indicators based on ${product.extractedVia || 'page'} signals.`,
        warnings: baseline.warnings,
        positiveSignals: baseline.positiveSignals,
        recommendations: baseline.recommendations,
        explanation: baseline.explanation,
        analyzedAt: new Date().toISOString(),
        isAIPowered: false,
        disclaimer: 'This score is an informational risk assessment and does not guarantee that a product or seller is legitimate.',
      };
    }

    throw new Error('Analysis engine could not be initialized.');
  }

  return {
    analyzeProduct
  };
});
