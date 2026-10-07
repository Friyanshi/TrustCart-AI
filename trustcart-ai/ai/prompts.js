/**
 * TrustCart AI - Prompts Specification
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TrustCartPrompts = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  const SYSTEM_INSTRUCTION = `You are TrustCart AI, a senior e-commerce consumer protection intelligence agent.
Your objective is to examine online product pages and provide a transparent, balanced risk assessment.
Rules:
- Never claim that a product or seller is definitely a scam or definitely genuine.
- Identify both risk signals and reassuring positive signals.
- Evaluate description claims for realism vs exaggerated hype.
- Check review patterns for repetition or formulaic structure.
- Always output strict JSON adhering to the specified schema.`;

  function createProductAnalysisPrompt(product, deterministicScores) {
    return `Analyze this online shopping product page for potential consumer risk signals:

PRODUCT DATA:
Title: ${product.title || 'Unknown'}
Domain: ${product.domain || 'Unknown'}
URL: ${product.url || 'Unknown'}
Price: ${product.currentPrice != null ? `${product.currency || ''}${product.currentPrice}` : 'Unavailable'}
List/MRP: ${product.originalPrice != null ? `${product.currency || ''}${product.originalPrice}` : 'Unavailable'}
Discount: ${product.discountPercent != null ? `${product.discountPercent}%` : 'Unavailable'}
Rating: ${product.rating != null ? `${product.rating}/5.0` : 'Unavailable'}
Review Count: ${product.reviewCount != null ? product.reviewCount : 'Unavailable'}
Sample Reviews:
${(product.reviews || []).slice(0, 5).map((r, i) => `[${i + 1}] (${r.rating || '?'} stars): "${r.text}"`).join('\n') || 'None'}
Seller: ${product.seller?.name || 'Unknown'} (Rating: ${product.seller?.rating || 'N/A'}, Verified: ${product.seller?.isVerified ? 'Yes' : 'No'})
Policies: Return Available: ${product.policies?.returnAvailable}, Window: ${product.policies?.returnWindowDays || 'N/A'} days, Warranty: ${product.policies?.warrantyText || 'N/A'}
Description:
${(product.description || 'No description').slice(0, 1200)}

PRE-COMPUTED SCORES:
Overall Trust Score: ${deterministicScores.trustScore}/100 (${deterministicScores.riskLevel})
Category Breakdown:
- Price Risk: ${deterministicScores.riskCategories.price.score}/100
- Review Risk: ${deterministicScores.riskCategories.review.score}/100
- Seller Risk: ${deterministicScores.riskCategories.seller.score}/100
- Policy Risk: ${deterministicScores.riskCategories.policy.score}/100
- Description Risk: ${deterministicScores.riskCategories.description.score}/100

Respond with strict JSON containing:
{
  "summary": "1-2 sentence balanced summary",
  "riskLevel": "LOW RISK" | "MODERATE RISK" | "HIGH RISK" | "VERY HIGH RISK",
  "warnings": ["warning 1", "warning 2"],
  "positiveSignals": ["positive 1", "positive 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "explanationPoints": ["bullet 1", "bullet 2"]
}`;
  }

  return {
    SYSTEM_INSTRUCTION,
    createProductAnalysisPrompt
  };
});
