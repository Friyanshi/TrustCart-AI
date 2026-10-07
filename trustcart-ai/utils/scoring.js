/**
 * TrustCart AI - Transparent Deterministic Risk Scoring Engine
 * 
 * Formula:
 * Price Risk:       20%
 * Review Risk:      25%
 * Seller Risk:      25%
 * Policy Risk:      15%
 * Description Risk: 15%
 * 
 * Overall Trust Score = 100 - (PriceRisk*0.20 + ReviewRisk*0.25 + SellerRisk*0.25 + PolicyRisk*0.15 + DescriptionRisk*0.15)
 * 
 * Bands:
 * 80 - 100: LOW RISK
 * 60 - 79:  MODERATE RISK
 * 40 - 59:  HIGH RISK
 * 0  - 39:  VERY HIGH RISK
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TrustCartScoring = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  function calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
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

  function analyzeReviewRepetition(reviews) {
    if (!reviews || reviews.length < 2) {
      return { maxSimilarity: 0, hasRepeatedWording: false };
    }
    let maxSim = 0;
    for (let i = 0; i < reviews.length; i++) {
      for (let j = i + 1; j < reviews.length; j++) {
        const textA = reviews[i].text || '';
        const textB = reviews[j].text || '';
        const sim = calculateTextSimilarity(textA, textB);
        if (sim > maxSim) maxSim = sim;
      }
    }
    return {
      maxSimilarity: maxSim,
      hasRepeatedWording: maxSim > 0.65,
    };
  }

  function evaluatePriceRisk(product) {
    const signals = [];
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
      score = 90;
      signals.push({
        type: 'warning',
        text: 'Suspicious zero or negative price listed.',
        detail: 'Nominal or zero prices often trigger hidden recurring subscriptions.'
      });
    } else if (discount != null) {
      if (discount >= 85) {
        score = 85;
        signals.push({
          type: 'warning',
          text: `Unusually high discount detected (${Math.round(discount)}%).`,
          detail: 'Steep discounts (>85%) are frequently deployed to induce impulse buys. Consider verifying the seller.'
        });
      } else if (discount >= 70) {
        score = 65;
        signals.push({
          type: 'warning',
          text: `Substantial discount listed (${Math.round(discount)}%).`,
          detail: 'High markdown warrants comparison with regular market prices.'
        });
      } else if (discount >= 35) {
        score = 30;
        signals.push({
          type: 'info',
          text: `Standard promotional discount (${Math.round(discount)}%).`
        });
      } else if (discount > 0) {
        score = 15;
        signals.push({
          type: 'positive',
          text: `Moderate discount (${Math.round(discount)}%).`,
          detail: 'Consistent with verified standard retail practices.'
        });
      }
    } else {
      score = 20;
      signals.push({
        type: 'positive',
        text: 'Regular non-inflated retail price listed.'
      });
    }

    if (product.originalPrice && price && product.originalPrice > 0) {
      signals.push({
        type: 'info',
        text: `Listed MRP: ${product.currency || ''}${product.originalPrice} vs Current: ${product.currency || ''}${price}.`
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

  function evaluateReviewRisk(product) {
    const signals = [];
    let score = 30;

    const count = product.reviewCount;
    const rating = product.rating;
    const reviews = product.reviews || [];

    if (count == null && reviews.length === 0) {
      score = 60;
      signals.push({
        type: 'warning',
        text: 'No customer reviews available to corroborate quality.',
        detail: 'Unreviewed items offer limited buyer history. Additional vigilance is recommended.'
      });
    } else if ((count != null && count < 5) || (count == null && reviews.length < 3)) {
      score = 50;
      signals.push({
        type: 'warning',
        text: 'Very small number of reviews available.',
        detail: 'A sparse feedback sample makes it difficult to ascertain authentic performance.'
      });
    } else if (count != null && count >= 50) {
      score = 18;
      signals.push({
        type: 'positive',
        text: `Large review count available (${count.toLocaleString()}+ reviews).`,
        detail: 'Substantial buyer feedback helps validate consumer experience.'
      });
    } else {
      score = 30;
      signals.push({
        type: 'info',
        text: `Moderate review presence (${count || reviews.length} reviews).`
      });
    }

    if (rating != null) {
      if (rating === 5.0 && (count || reviews.length) < 20) {
        score += 15;
        signals.push({
          type: 'warning',
          text: 'Unbroken 5.0 rating on limited review volume.',
          detail: 'Flawless scores without critique can sometimes indicate incentivized ratings.'
        });
      } else if (rating >= 4.0 && rating <= 4.9) {
        score = Math.max(10, score - 10);
        signals.push({
          type: 'positive',
          text: `Healthy rating distribution (${rating.toFixed(1)} / 5.0).`
        });
      } else if (rating < 3.0) {
        score += 35;
        signals.push({
          type: 'warning',
          text: `Low average rating (${rating.toFixed(1)} / 5.0).`,
          detail: 'Customers report noticeable dissatisfaction or product defects.'
        });
      }
    }

    const repetition = analyzeReviewRepetition(reviews);
    if (repetition.hasRepeatedWording) {
      score += 25;
      signals.push({
        type: 'warning',
        text: 'Several reviews contain highly similar or repetitive phrasing.',
        detail: 'Identical phrasing patterns warrant additional review verification.'
      });
    }

    return {
      category: 'review',
      label: 'Review Risk',
      score: Math.min(100, Math.max(0, score)),
      weight: 0.25,
      signals,
    };
  }

  function evaluateSellerRisk(product) {
    const signals = [];
    let score = 35;

    const seller = product.seller || {};

    if (!seller.name || seller.name.toLowerCase().includes('unknown') || seller.name.trim() === '') {
      score = 70;
      signals.push({
        type: 'warning',
        text: 'Limited or unstated seller identity.',
        detail: 'Storefront or business profile is missing or obfuscated.'
      });
    } else {
      signals.push({
        type: 'positive',
        text: `Seller information available: "${seller.name}".`
      });

      if (seller.isVerified) {
        score -= 15;
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
            text: `High seller rating (${seller.rating.toFixed(1)} / 5).`
          });
        } else if (seller.rating < 3.2) {
          score = 65;
          signals.push({
            type: 'warning',
            text: `Substandard seller rating (${seller.rating.toFixed(1)} / 5).`,
            detail: 'Buyers report recurring fulfillment or delivery issues.'
          });
        }
      } else {
        score += 15;
        signals.push({
          type: 'info',
          text: 'Seller performance rating is unavailable.'
        });
      }

      if (seller.businessAddress) {
        signals.push({
          type: 'positive',
          text: 'Physical business or registered entity address listed.'
        });
      }
    }

    return {
      category: 'seller',
      label: 'Seller Risk',
      score: Math.min(100, Math.max(0, score)),
      weight: 0.25,
      signals,
    };
  }

  function evaluatePolicyRisk(product) {
    const signals = [];
    let score = 35;

    const policies = product.policies || { returnAvailable: 'unknown' };

    if (policies.returnAvailable === false) {
      score = 75;
      signals.push({
        type: 'warning',
        text: 'No returns or replacements accepted (Final Sale).',
        detail: 'Product cannot be returned or refunded if defective or incorrect.'
      });
    } else if (policies.returnAvailable === true) {
      score = 15;
      const windowText = policies.returnWindowDays ? `${policies.returnWindowDays}-day ` : '';
      signals.push({
        type: 'positive',
        text: `${windowText}Return and replacement policy clearly available.`
      });

      if (policies.replacementAvailable) {
        signals.push({
          type: 'positive',
          text: 'Free replacement option available for damaged arrivals.'
        });
      }
    } else {
      score = 50;
      signals.push({
        type: 'info',
        text: 'Return and refund policy information is unstated or unclear.',
        detail: 'Check exchange terms before finalizing order.'
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
      label: 'Policy Risk',
      score: Math.min(100, Math.max(0, score)),
      weight: 0.15,
      signals,
    };
  }

  function evaluateDescriptionRisk(product) {
    const signals = [];
    let score = 25;

    const desc = (product.description || '').toLowerCase();
    const specCount = Object.keys(product.specifications || {}).length;

    const exaggeratedTerms = [
      'miracle', '100% cure', 'guaranteed overnight', 'instant millionaire',
      'risk-free infinite', 'secret hack', 'banned by industry', 'magical result'
    ];

    const foundClaims = exaggeratedTerms.filter(t => desc.includes(t));
    if (foundClaims.length > 0) {
      score = 75;
      signals.push({
        type: 'warning',
        text: 'Product description contains unusually strong or exaggerated claims.',
        detail: `Phrasing detected: "${foundClaims.join(', ')}". High-pressure promises warrant scrutiny.`
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
        text: 'Sparse product description with no technical specifications.'
      });
    } else {
      signals.push({
        type: 'info',
        text: 'Standard narrative description provided without exhaustive spec table.'
      });
    }

    return {
      category: 'description',
      label: 'Description Risk',
      score: Math.min(100, Math.max(0, score)),
      weight: 0.15,
      signals,
    };
  }

  function calculateTrustScore(product) {
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

    let riskLevel = 'MODERATE RISK';
    if (trustScore >= 80) riskLevel = 'LOW RISK';
    else if (trustScore >= 60) riskLevel = 'MODERATE RISK';
    else if (trustScore >= 40) riskLevel = 'HIGH RISK';
    else riskLevel = 'VERY HIGH RISK';

    const allCategories = [priceRisk, reviewRisk, sellerRisk, policyRisk, descriptionRisk];
    const warnings = [];
    const positiveSignals = [];

    for (const cat of allCategories) {
      for (const sig of cat.signals) {
        if (sig.type === 'warning') warnings.push(sig.text);
        if (sig.type === 'positive') positiveSignals.push(sig.text);
      }
    }

    const recommendations = [];
    if (sellerRisk.score > 40) recommendations.push('Verify seller credentials, business registration, and customer service contacts.');
    if (priceRisk.score > 50) recommendations.push('Cross-reference the listed price against authorized brand outlets to confirm authentic market value.');
    if (reviewRisk.score > 40) recommendations.push('Sort reviews by "Most Recent" and look for verified purchase badges.');
    if (policyRisk.score > 40) recommendations.push('Review the merchant’s explicit return and replacement terms prior to payment.');
    if (recommendations.length < 3) {
      recommendations.push('Use credit card or secure escrow checkout with buyer protection rather than direct wire transfer.');
      recommendations.push('Confirm package contents immediately upon arrival and document unboxing if high value.');
    }

    const explanationPoints = [];
    if (warnings.length > 0) explanationPoints.push(`Key risk factors: ${warnings.slice(0, 3).join('; ')}.`);
    if (positiveSignals.length > 0) explanationPoints.push(`Reassuring signals: ${positiveSignals.slice(0, 3).join('; ')}.`);
    explanationPoints.push('Final score reflects weighted price (20%), review (25%), seller (25%), policy (15%), and description (15%) metrics.');

    return {
      trustScore,
      riskLevel,
      riskCategories: {
        price: priceRisk,
        review: reviewRisk,
        seller: sellerRisk,
        policy: policyRisk,
        description: descriptionRisk,
      },
      warnings,
      positiveSignals,
      recommendations: recommendations.slice(0, 4),
      explanation: {
        title: `Why this score? (${trustScore}/100 - ${riskLevel})`,
        points: explanationPoints,
      },
      disclaimer: 'This score is an informational risk assessment and does not guarantee that a product or seller is legitimate.',
    };
  }

  return {
    calculateTrustScore,
    evaluatePriceRisk,
    evaluateReviewRisk,
    evaluateSellerRisk,
    evaluatePolicyRisk,
    evaluateDescriptionRisk,
  };
});
