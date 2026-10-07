/**
 * TrustCart AI - Type Definitions
 */

export interface ProductReview {
  author?: string;
  rating?: number;
  text: string;
  date?: string;
  verifiedPurchase?: boolean;
}

export interface SellerInfo {
  name?: string;
  rating?: number;
  reviewsCount?: number;
  tenure?: string;
  businessAddress?: string;
  isVerified?: boolean;
}

export interface PolicyInfo {
  returnAvailable: boolean | 'unavailable' | 'unknown';
  returnWindowDays?: number;
  refundPolicyText?: string;
  warrantyText?: string;
  replacementAvailable?: boolean;
}

export interface ExtractedProduct {
  id?: string;
  url: string;
  domain: string;
  title: string;
  currentPrice?: number | null;
  originalPrice?: number | null;
  currency?: string | null;
  discountPercent?: number | null;
  isDiscountCalculated?: boolean;
  priceUnavailable?: boolean;
  
  rating?: number | null;
  reviewCount?: number | null;
  reviews: ProductReview[];
  
  seller: SellerInfo;
  policies: PolicyInfo;
  
  description: string;
  specifications: Record<string, string>;
  
  images?: string[];
  availability?: string;
  brand?: string;
  category?: string;
  extractedVia?: string;
  missingFields?: string[];
}

export type RiskLevel = 'LOW RISK' | 'MODERATE RISK' | 'HIGH RISK' | 'VERY HIGH RISK';

export type ProductVerdict = 'REAL' | 'FRAUD' | 'AI_GENERATED' | 'SUSPICIOUS';

export interface AuthenticityMetrics {
  verdict: ProductVerdict;
  verdictLabel: string;
  isAIGenerated: boolean;
  isPotentialFraud: boolean;
  isLegitimate: boolean;
  aiGenerationProbability: number; // 0-100%
  fraudProbability: number; // 0-100%
  primaryReason: string;
  aiSignals: string[];
  fraudSignals: string[];
  legitimacySignals: string[];
}

export interface RiskSignal {
  type: 'positive' | 'warning' | 'info';
  text: string;
  detail?: string;
}

export interface RiskCategoryScore {
  category: 'price' | 'review' | 'seller' | 'policy' | 'description';
  label: string;
  score: number; // 0 (safest) to 100 (highest risk)
  weight: number;
  signals: RiskSignal[];
}

export interface TrustAnalysis {
  id: string;
  product: ExtractedProduct;
  trustScore: number; // 0 to 100
  riskLevel: RiskLevel;
  authenticity: AuthenticityMetrics;
  riskCategories: {
    price: RiskCategoryScore;
    review: RiskCategoryScore;
    seller: RiskCategoryScore;
    policy: RiskCategoryScore;
    description: RiskCategoryScore;
  };
  summary: string;
  warnings: string[];
  positiveSignals: string[];
  recommendations: string[];
  explanation: {
    title: string;
    points: string[];
  };
  analyzedAt: string;
  isAIPowered: boolean;
  disclaimer: string;
}
