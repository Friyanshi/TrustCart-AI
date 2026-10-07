/**
 * TrustCart AI - Gemini AI Product Risk & Authenticity Analyzer
 */

import { GoogleGenAI, Type } from '@google/genai';
import { ExtractedProduct, TrustAnalysis } from '../types/extension';
import { calculateTrustScore } from './scoringEngine';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface AIResponseStructure {
  verdict: 'REAL' | 'FRAUD' | 'AI_GENERATED' | 'SUSPICIOUS';
  verdictLabel: string;
  summary: string;
  riskLevel: 'LOW RISK' | 'MODERATE RISK' | 'HIGH RISK' | 'VERY HIGH RISK';
  aiGenerationProbability: number;
  fraudProbability: number;
  isAIGenerated: boolean;
  isPotentialFraud: boolean;
  primaryReason: string;
  aiSignals: string[];
  fraudSignals: string[];
  legitimacySignals: string[];
  warnings: string[];
  positiveSignals: string[];
  recommendations: string[];
  explanationPoints: string[];
}

export async function analyzeProductRisk(product: ExtractedProduct): Promise<TrustAnalysis> {
  const deterministic = calculateTrustScore(product);

  let isAIPowered = false;
  let verdict = deterministic.authenticity.verdict;
  let verdictLabel = deterministic.authenticity.verdictLabel;
  let summary = deterministic.explanation.points[0] || 'Product evaluated based on available page signals.';
  let warnings = [...deterministic.warnings];
  let positiveSignals = [...deterministic.positiveSignals];
  let recommendations = [...deterministic.recommendations];
  let explanationPoints = [...deterministic.explanation.points];
  let aiSignals = [...deterministic.authenticity.aiSignals];
  let fraudSignals = [...deterministic.authenticity.fraudSignals];
  let legitimacySignals = [...deterministic.authenticity.legitimacySignals];
  let aiGenerationProbability = deterministic.authenticity.aiGenerationProbability;
  let fraudProbability = deterministic.authenticity.fraudProbability;
  let primaryReason = deterministic.authenticity.primaryReason;

  if (apiKey) {
    try {
      const prompt = `
You are TrustCart AI. Analyze this online shopping product page and determine if it appears to be REAL & AUTHENTIC, FRAUD / SCAM, or AI-GENERATED (synthetic copy, bot reviews, fake image specs).

PRODUCT DETAILS:
Title: ${product.title || 'Unknown'}
Platform / Domain: ${product.domain || 'Unknown'}
URL: ${product.url || 'Unknown'}
Price: ${product.currentPrice != null ? `${product.currency || ''}${product.currentPrice}` : 'Unavailable'}
Original Price / MRP: ${product.originalPrice != null ? `${product.currency || ''}${product.originalPrice}` : 'Unavailable'}
Discount: ${product.discountPercent != null ? `${product.discountPercent}%` : 'Unavailable'}
Rating: ${product.rating != null ? `${product.rating}/5` : 'Unavailable'}
Review Count: ${product.reviewCount != null ? product.reviewCount : 'Unavailable'}
Sample Reviews:
${(product.reviews || []).slice(0, 5).map((r, i) => `[${i + 1}] (${r.rating || '?'}/5): "${r.text}"`).join('\n') || 'None'}
Seller: ${product.seller?.name || 'Unavailable'} (Rating: ${product.seller?.rating || 'N/A'}, Verified: ${product.seller?.isVerified ? 'Yes' : 'No'})
Policies: Return: ${product.policies?.returnAvailable}, Window: ${product.policies?.returnWindowDays || 'N/A'} days, Warranty: ${product.policies?.warrantyText || 'N/A'}
Description:
${(product.description || 'No description').slice(0, 1000)}

EVALUATE:
1. Is the product listing AI-generated (bot review patterns, GPT template phrases, fake specs)?
2. Does it show signs of fraud (unrealistic 90%+ discount bait, fake merchant, final sale trap, absurd promises)?
3. Does it look like a genuine authentic product listing?
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are TrustCart AI, a consumer protection engine that detects real products, fraud listings, and AI-generated e-commerce copy/reviews.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: {
                type: Type.STRING,
                enum: ['REAL', 'FRAUD', 'AI_GENERATED', 'SUSPICIOUS'],
              },
              verdictLabel: { type: Type.STRING },
              summary: { type: Type.STRING },
              riskLevel: {
                type: Type.STRING,
                enum: ['LOW RISK', 'MODERATE RISK', 'HIGH RISK', 'VERY HIGH RISK'],
              },
              aiGenerationProbability: { type: Type.NUMBER },
              fraudProbability: { type: Type.NUMBER },
              isAIGenerated: { type: Type.BOOLEAN },
              isPotentialFraud: { type: Type.BOOLEAN },
              primaryReason: { type: Type.STRING },
              aiSignals: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              fraudSignals: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              legitimacySignals: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              warnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              positiveSignals: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              explanationPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['verdict', 'verdictLabel', 'summary', 'riskLevel', 'aiGenerationProbability', 'fraudProbability', 'primaryReason', 'warnings', 'positiveSignals', 'recommendations', 'explanationPoints'],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text) as AIResponseStructure;
        verdict = parsed.verdict || verdict;
        verdictLabel = parsed.verdictLabel || verdictLabel;
        if (parsed.summary) summary = parsed.summary;
        if (parsed.primaryReason) primaryReason = parsed.primaryReason;
        if (parsed.aiGenerationProbability != null) aiGenerationProbability = parsed.aiGenerationProbability;
        if (parsed.fraudProbability != null) fraudProbability = parsed.fraudProbability;
        if (Array.isArray(parsed.warnings) && parsed.warnings.length > 0) warnings = parsed.warnings;
        if (Array.isArray(parsed.positiveSignals) && parsed.positiveSignals.length > 0) positiveSignals = parsed.positiveSignals;
        if (Array.isArray(parsed.aiSignals) && parsed.aiSignals.length > 0) aiSignals = parsed.aiSignals;
        if (Array.isArray(parsed.fraudSignals) && parsed.fraudSignals.length > 0) fraudSignals = parsed.fraudSignals;
        if (Array.isArray(parsed.legitimacySignals) && parsed.legitimacySignals.length > 0) legitimacySignals = parsed.legitimacySignals;
        if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) recommendations = parsed.recommendations.slice(0, 3);
        if (Array.isArray(parsed.explanationPoints) && parsed.explanationPoints.length > 0) explanationPoints = parsed.explanationPoints;

        isAIPowered = true;
      }
    } catch (err) {
      console.warn('Gemini API call skipped, using deterministic engine:', err);
    }
  }

  let finalTrustScore = deterministic.trustScore;
  if (verdict === 'REAL') finalTrustScore = Math.max(78, finalTrustScore);
  else if (verdict === 'FRAUD') finalTrustScore = Math.min(32, finalTrustScore);
  else if (verdict === 'AI_GENERATED') finalTrustScore = Math.min(48, finalTrustScore);

  let finalRiskLevel = deterministic.riskLevel;
  if (finalTrustScore >= 80) finalRiskLevel = 'LOW RISK';
  else if (finalTrustScore >= 60) finalRiskLevel = 'MODERATE RISK';
  else if (finalTrustScore >= 40) finalRiskLevel = 'HIGH RISK';
  else finalRiskLevel = 'VERY HIGH RISK';

  return {
    id: `tc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    product,
    trustScore: finalTrustScore,
    riskLevel: finalRiskLevel,
    authenticity: {
      verdict,
      verdictLabel,
      isAIGenerated: verdict === 'AI_GENERATED' || aiGenerationProbability > 60,
      isPotentialFraud: verdict === 'FRAUD' || fraudProbability > 60,
      isLegitimate: verdict === 'REAL',
      aiGenerationProbability,
      fraudProbability,
      primaryReason,
      aiSignals,
      fraudSignals,
      legitimacySignals
    },
    riskCategories: deterministic.riskCategories,
    summary,
    warnings: warnings.slice(0, 4),
    positiveSignals: positiveSignals.slice(0, 4),
    recommendations: recommendations.slice(0, 3),
    explanation: {
      title: `Analysis Breakdown (${finalTrustScore}/100 - ${finalRiskLevel})`,
      points: explanationPoints,
    },
    analyzedAt: new Date().toISOString(),
    isAIPowered,
    disclaimer: 'This score is an informational risk assessment based strictly on publicly available signals and does not guarantee that a product or seller is legitimate.',
  };
}
