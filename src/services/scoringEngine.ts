/**
 * TrustCart AI - Risk & Authenticity Scoring Engine
 */

import { AuthenticityMetrics, ExtractedProduct, ProductVerdict, RiskCategoryScore, RiskLevel, RiskSignal } from '../types/extension';

function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(text2.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3));
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  const union = new Set([...words1, ...words2]).size;
  return union === 0 ? 0 : intersection / union;
}

function analyzeReviewRepetition(reviews: { text: string }[]): { maxSimilarity: number; hasRepeatedWording: boolean } {
  if (!reviews || reviews.length < 2) {
    return { maxSimilarity: 0, hasRepeatedWording: false };
  }
  let maxSim = 0;
  for (let i = 0; i < reviews.length; i++) {
    for (let j = i + 1; j < reviews.length; j++) {
      const sim = calculateTextSimilarity(reviews[i].text, reviews[j].text);
      if (sim > maxSim) maxSim = sim;
    }
  }
  return {
    maxSimilarity: maxSim,
    hasRepeatedWording: maxSim > 0.65,
  };
}

export function evaluatePriceRisk(product: ExtractedProduct): RiskCategoryScore {
  const signals: RiskSignal[] = [];
  let score = 25;

  if (product.priceUnavailable || product.currentPrice == null) {
    score = 35;
    signals.push({
      type: 'info',
      text: 'Price information unavailable on this page.',
      detail: 'Ensure the price is clearly stated before checkout.'
    });
    return { category: 'price', label: 'Price Risk', score, weight: 0.20, signals };
  }

  const price = product.currentPrice;
  const discount = product.discountPercent;

  if (price <= 0) {
    score = 95;
    signals.push({
      type: 'warning',
      text: 'Suspicious zero or negative price listed (High Fraud Risk).',
      detail: 'Nominal or zero prices frequently trigger recurring hidden subscriptions.'
    });
  } else if (discount != null) {
    if (discount >= 85) {
      score = 88;
      signals.push({
        type: 'warning',
        text: `Unusually extreme discount detected (${Math.round(discount)}% off).`,
        detail: 'Discounts >85% are commonly deployed by high-risk drop-shipping or phantom storefronts.'
      });
    } else if (discount >= 70) {
      score = 65;
      signals.push({
        type: 'warning',
        text: `Substantial markdown listed (${Math.round(discount)}% off).`,
        detail: 'High markdown warrants comparison against official manufacturer pricing.'
      });
    } else if (discount >= 35) {
      score = 30;
      signals.push({
        type: 'info',
        text: `Standard promotional discount (${Math.round(discount)}%).`
      });
    } else {
      score = 15;
      signals.push({
        type: 'positive',
        text: `Moderate authentic discount (${Math.round(discount)}%).`
      });
    }
  } else {
    score = 20;
    signals.push({
      type: 'positive',
      text: 'Standard non-inflated retail price.'
    });
  }

  return {
    category: 'price',
    label: 'Price Risk',
    score: Math.min(100, Math.max(0, score)),
    weight: 0.20,
    signals,
  };
}

export function evaluateReviewRisk(product: ExtractedProduct): RiskCategoryScore {
  const signals: RiskSignal[] = [];
  let score = 30;

  const count = product.reviewCount;
  const rating = product.rating;
  const reviews = product.reviews || [];

  if (count == null && reviews.length === 0) {
    score = 60;
    signals.push({
      type: 'warning',
      text: 'No customer reviews available to corroborate authenticity.',
      detail: 'Unreviewed items offer limited buyer history.'
    });
  } else if ((count != null && count < 5) || (count == null && reviews.length < 3)) {
    score = 50;
    signals.push({
      type: 'warning',
      text: 'Very small review sample volume.',
      detail: 'Sparse feedback makes it difficult to ascertain authentic performance.'
    });
  } else if (count != null && count >= 50) {
    score = 15;
    signals.push({
      type: 'positive',
      text: `Large authentic review presence (${count.toLocaleString()}+ reviews).`
    });
  }

  if (rating != null) {
    if (rating === 5.0 && (count || reviews.length) < 20) {
      score += 20;
      signals.push({
        type: 'warning',
        text: 'Unbroken 5.0 rating on limited review volume.',
        detail: 'Flawless 5.0 scores without critical feedback often indicate incentivized or bot ratings.'
      });
    } else if (rating >= 4.0 && rating <= 4.9) {
      score = Math.max(10, score - 10);
      signals.push({
        type: 'positive',
        text: `Healthy organic rating distribution (${rating.toFixed(1)} / 5.0).`
      });
    } else if (rating < 3.0) {
      score += 40;
      signals.push({
        type: 'warning',
        text: `Low customer satisfaction score (${rating.toFixed(1)} / 5.0).`
      });
    }
  }

  const repetition = analyzeReviewRepetition(reviews);
  if (repetition.hasRepeatedWording) {
    score += 35;
    signals.push({
      type: 'warning',
      text: 'Repetitive bot phrasing detected across multiple reviews (AI/Bot Suspicion).',
      detail: 'Reviews share near-identical lexical templates commonly generated by automated review bots.'
    });
  }

  return {
    category: 'review',
    label: 'Review Authenticity',
    score: Math.min(100, Math.max(0, score)),
    weight: 0.25,
    signals,
  };
}

export function evaluateSellerRisk(product: ExtractedProduct): RiskCategoryScore {
  const signals: RiskSignal[] = [];
  let score = 35;

  const seller = product.seller || {};

  if (!seller.name || seller.name.toLowerCase().includes('unknown') || seller.name.trim() === '') {
    score = 75;
    signals.push({
      type: 'warning',
      text: 'Missing or obfuscated merchant identity (Fraud Signal).',
      detail: 'No registered seller name or storefront was found.'
    });
  } else {
    signals.push({
      type: 'positive',
      text: `Seller identity available: "${seller.name}".`
    });

    if (seller.isVerified) {
      score -= 20;
      signals.push({
        type: 'positive',
        text: 'Seller holds platform verification badge.'
      });
    }

    if (seller.rating != null) {
      if (seller.rating >= 4.5) {
        score = 15;
        signals.push({
          type: 'positive',
          text: `High seller satisfaction rating (${seller.rating.toFixed(1)} / 5).`
        });
      } else if (seller.rating < 3.2) {
        score = 70;
        signals.push({
          type: 'warning',
          text: `Poor seller rating (${seller.rating.toFixed(1)} / 5).`
        });
      }
    }
  }

  return {
    category: 'seller',
    label: 'Seller Verification',
    score: Math.min(100, Math.max(0, score)),
    weight: 0.25,
    signals,
  };
}

export function evaluatePolicyRisk(product: ExtractedProduct): RiskCategoryScore {
  const signals: RiskSignal[] = [];
  let score = 35;

  const policies = product.policies || { returnAvailable: 'unknown' };

  if (policies.returnAvailable === false) {
    score = 80;
    signals.push({
      type: 'warning',
      text: 'No returns or replacements accepted (Final Sale / Trap Risk).',
      detail: 'Merchant explicitly prohibits returns or refunds even if defective.'
    });
  } else if (policies.returnAvailable === true) {
    score = 15;
    const windowText = policies.returnWindowDays ? `${policies.returnWindowDays}-day ` : '';
    signals.push({
      type: 'positive',
      text: `${windowText}Return and replacement policy clearly guaranteed.`
    });
  } else {
    score = 50;
    signals.push({
      type: 'info',
      text: 'Return and refund terms are unstated or ambiguous.'
    });
  }

  if (policies.warrantyText) {
    score = Math.max(10, score - 10);
    signals.push({
      type: 'positive',
      text: `Warranty coverage detected: ${policies.warrantyText}.`
    });
  }

  return {
    category: 'policy',
    label: 'Policy Legitimacy',
    score: Math.min(100, Math.max(0, score)),
    weight: 0.15,
    signals,
  };
}

export function evaluateDescriptionRisk(product: ExtractedProduct): RiskCategoryScore {
  const signals: RiskSignal[] = [];
  let score = 25;

  const desc = (product.description || '').toLowerCase();
  const specCount = Object.keys(product.specifications || {}).length;

  // AI-hallucination or exaggerated scam buzzwords
  const exaggeratedTerms = [
    'miracle', '100% cure', 'guaranteed overnight', 'instant millionaire',
    'risk-free infinite', 'secret hack', 'banned by industry', 'never pay again',
    'free electricity', 'military secret'
  ];

  const foundClaims = exaggeratedTerms.filter(t => desc.includes(t));
  if (foundClaims.length > 0) {
    score = 85;
    signals.push({
      type: 'warning',
      text: `Exaggerated or impossible claims detected: "${foundClaims.join(', ')}".`,
      detail: 'Pseudoscientific promises are hallmark indicators of scam listings.'
    });
  }

  // Check for generic AI boilerplate
  const aiPhrases = [
    'in conclusion', 'delve into', 'unparalleled experience', 'game-changer in your daily life',
    'look no further', 'seamlessly blend', 'embark on a journey'
  ];
  const foundAi = aiPhrases.filter(p => desc.includes(p));
  if (foundAi.length >= 2) {
    score += 30;
    signals.push({
      type: 'warning',
      text: 'Product description exhibits formulaic AI-generated promotional phrasing.',
      detail: 'Text matches common synthetic copy generation templates.'
    });
  }

  if (specCount >= 4) {
    score = Math.max(10, score - 15);
    signals.push({
      type: 'positive',
      text: `Detailed technical specifications provided (${specCount} attributes).`
    });
  } else if (specCount === 0 && desc.length < 100) {
    score += 25;
    signals.push({
      type: 'warning',
      text: 'Sparse description with no technical model specifications.'
    });
  }

  return {
    category: 'description',
    label: 'Content Integrity',
    score: Math.min(100, Math.max(0, score)),
    weight: 0.15,
    signals,
  };
}

export function calculateTrustScore(product: ExtractedProduct): {
  trustScore: number;
  riskLevel: RiskLevel;
  authenticity: AuthenticityMetrics;
  riskCategories: {
    price: RiskCategoryScore;
    review: RiskCategoryScore;
    seller: RiskCategoryScore;
    policy: RiskCategoryScore;
    description: RiskCategoryScore;
  };
  warnings: string[];
  positiveSignals: string[];
  recommendations: string[];
  explanation: {
    title: string;
    points: string[];
  };
} {
  const priceRisk = evaluatePriceRisk(product);
  const reviewRisk = evaluateReviewRisk(product);
  const sellerRisk = evaluateSellerRisk(product);
  const policyRisk = evaluatePolicyRisk(product);
  const descriptionRisk = evaluateDescriptionRisk(product);

  const totalWeightedRisk = 
    priceRisk.score * priceRisk.weight +
    reviewRisk.score * reviewRisk.weight +
    sellerRisk.score * sellerRisk.weight +
    policyRisk.score * policyRisk.weight +
    descriptionRisk.score * descriptionRisk.weight;

  const trustScore = Math.max(0, Math.min(100, Math.round(100 - totalWeightedRisk)));

  let riskLevel: RiskLevel = 'MODERATE RISK';
  if (trustScore >= 80) riskLevel = 'LOW RISK';
  else if (trustScore >= 60) riskLevel = 'MODERATE RISK';
  else if (trustScore >= 40) riskLevel = 'HIGH RISK';
  else riskLevel = 'VERY HIGH RISK';

  // Determine Real vs Fraud vs AI Generated
  const desc = (product.description || '').toLowerCase();
  const hasAiPhrases = desc.includes('in conclusion') || desc.includes('unparalleled') || desc.includes('embark on');
  const reviewRepetition = analyzeReviewRepetition(product.reviews || []);
  const hasExtremeDiscount = (product.discountPercent || 0) >= 85;
  const isNoReturn = product.policies?.returnAvailable === false;
  const isSellerMissing = !product.seller?.name || product.seller.name.toLowerCase().includes('unknown');

  let verdict: ProductVerdict = 'REAL';
  let verdictLabel = 'REAL & AUTHENTIC';
  let isAIGenerated = false;
  let isPotentialFraud = false;
  let isLegitimate = false;
  let primaryReason = 'Product displays healthy pricing, verified seller presence, and authentic review feedback.';

  const aiSignals: string[] = [];
  const fraudSignals: string[] = [];
  const legitimacySignals: string[] = [];

  if (hasAiPhrases || reviewRepetition.hasRepeatedWording) {
    isAIGenerated = true;
    aiSignals.push('Synthetic or template-generated description phrasing detected');
    if (reviewRepetition.hasRepeatedWording) {
      aiSignals.push('Customer reviews contain repetitive formulaic bot wording');
    }
  }

  if (hasExtremeDiscount) fraudSignals.push(`Extreme discount (${product.discountPercent}%) commonly used in bait listings`);
  if (isNoReturn) fraudSignals.push('No returns or refunds accepted (Final Sale)');
  if (isSellerMissing) fraudSignals.push('Seller identity or storefront credentials missing');
  if (descriptionRisk.score >= 75) fraudSignals.push('Unrealistic or pseudoscientific marketing claims');

  if (trustScore >= 75 && !hasExtremeDiscount && !isNoReturn) {
    verdict = 'REAL';
    verdictLabel = 'REAL & AUTHENTIC';
    isLegitimate = true;
    legitimacySignals.push('Consistent market pricing');
    legitimacySignals.push('Established buyer review history');
    if (product.policies?.returnAvailable === true) legitimacySignals.push('Guaranteed return policy');
  } else if (isAIGenerated && (product.reviews?.length || 0) < 10 && trustScore < 60) {
    verdict = 'AI_GENERATED';
    verdictLabel = 'SUSPECTED AI-GENERATED';
    primaryReason = 'Listing shows high probability of synthetic AI-generated copy, bot reviews, and lacking verifiable specifications.';
  } else if (trustScore < 45 || fraudSignals.length >= 2) {
    verdict = 'FRAUD';
    verdictLabel = 'HIGH RISK / SUSPECTED FRAUD';
    isPotentialFraud = true;
    primaryReason = 'Multiple high-risk indicators detected including extreme markdown, unverified seller, and restrictive return terms.';
  } else {
    verdict = 'SUSPICIOUS';
    verdictLabel = 'SUSPICIOUS / CAUTION';
    primaryReason = 'Product exhibits mixed signals warranting careful review before purchasing.';
  }

  const allCategories = [priceRisk, reviewRisk, sellerRisk, policyRisk, descriptionRisk];
  const warnings: string[] = [];
  const positiveSignals: string[] = [];

  for (const cat of allCategories) {
    for (const sig of cat.signals) {
      if (sig.type === 'warning') warnings.push(sig.text);
      if (sig.type === 'positive') positiveSignals.push(sig.text);
    }
  }

  const recommendations: string[] = [];
  if (verdict === 'FRAUD' || verdict === 'AI_GENERATED') {
    recommendations.push('Avoid purchasing without verifying the seller on official brand registers.');
    recommendations.push('Do not share unnecessary payment or personal details.');
  }
  if (priceRisk.score > 50) {
    recommendations.push('Compare the price against authorized brand stores to verify true market value.');
  }
  if (recommendations.length < 3) {
    recommendations.push('Check the newest customer reviews for verified purchase badges.');
    recommendations.push('Confirm return and replacement terms before finalizing checkout.');
  }

  const explanationPoints: string[] = [];
  explanationPoints.push(`Status Assessment: ${verdictLabel}. ${primaryReason}`);
  if (warnings.length > 0) explanationPoints.push(`Key risk factors: ${warnings.slice(0, 2).join('; ')}.`);
  if (positiveSignals.length > 0) explanationPoints.push(`Positive signals: ${positiveSignals.slice(0, 2).join('; ')}.`);

  return {
    trustScore,
    riskLevel,
    authenticity: {
      verdict,
      verdictLabel,
      isAIGenerated,
      isPotentialFraud,
      isLegitimate,
      aiGenerationProbability: isAIGenerated ? 82 : (verdict === 'REAL' ? 12 : 38),
      fraudProbability: isPotentialFraud ? 85 : (verdict === 'REAL' ? 8 : 45),
      primaryReason,
      aiSignals,
      fraudSignals,
      legitimacySignals
    },
    riskCategories: {
      price: priceRisk,
      review: reviewRisk,
      seller: sellerRisk,
      policy: policyRisk,
      description: descriptionRisk,
    },
    warnings,
    positiveSignals,
    recommendations: recommendations.slice(0, 3),
    explanation: {
      title: `Why this score? (${trustScore}/100 - ${riskLevel})`,
      points: explanationPoints,
    },
  };
}
