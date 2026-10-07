import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sliders,
  FileText,
  DollarSign,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { ExtractedProduct, TrustAnalysis } from '../types/extension';
import { SAMPLE_PRODUCTS } from '../services/sampleProducts';

interface ScannerProps {
  onAnalyzeProduct: (product: ExtractedProduct) => Promise<TrustAnalysis>;
}

export const ProductRiskScanner: React.FC<ScannerProps> = ({ onAnalyzeProduct }) => {
  const [formData, setFormData] = useState<ExtractedProduct>({ ...SAMPLE_PRODUCTS[1].product });
  const [analysis, setAnalysis] = useState<TrustAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  const handleInputChange = (field: keyof ExtractedProduct, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // auto calculate discount
      if (updated.originalPrice && updated.currentPrice && updated.originalPrice > updated.currentPrice) {
        updated.discountPercent = Math.round(
          ((updated.originalPrice - updated.currentPrice) / updated.originalPrice) * 100
        );
        updated.isDiscountCalculated = true;
      }
      return updated;
    });
  };

  const handleSellerChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      seller: { ...prev.seller, [field]: value }
    }));
  };

  const handlePolicyChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      policies: { ...prev.policies, [field]: value }
    }));
  };

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await onAnalyzeProduct(formData);
      setAnalysis(res);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Multi-Signal Risk Diagnostic Engine
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Live Product Risk Analyzer
        </h2>
        <p className="text-sm text-slate-600">
          Test custom product listings, manipulate pricing discounts, review patterns, and return policies to inspect how Trust Score calculations respond.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs (Left) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Product Signals Configuration
            </h3>
            <button
              type="button"
              onClick={() => setFormData({ ...SAMPLE_PRODUCTS[0].product })}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Reset to Safe Product
            </button>
          </div>

          <form onSubmit={handleRunAnalysis} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Product Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Domain & URL */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Store Domain</label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => handleInputChange('domain', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
                <input
                  type="text"
                  value={formData.currency || '₹'}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Price</label>
                <input
                  type="number"
                  value={formData.currentPrice || ''}
                  onChange={(e) => handleInputChange('currentPrice', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">MRP / Listed</label>
                <input
                  type="number"
                  value={formData.originalPrice || ''}
                  onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Discount %</label>
                <input
                  type="number"
                  value={formData.discountPercent || ''}
                  onChange={(e) => handleInputChange('discountPercent', parseFloat(e.target.value) || null)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Seller */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block">Seller Credentials</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Seller Name</label>
                  <input
                    type="text"
                    value={formData.seller?.name || ''}
                    onChange={(e) => handleSellerChange('name', e.target.value)}
                    placeholder="e.g. Official Electronics Ltd"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Seller Rating (0–5)</label>
                  <input
                    type="number"
                    step="0.1"
                    max="5"
                    min="0"
                    value={formData.seller?.rating || ''}
                    onChange={(e) => handleSellerChange('rating', parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.seller?.isVerified)}
                  onChange={(e) => handleSellerChange('isVerified', e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Platform Verified Merchant Badge
              </label>
            </div>

            {/* Return Policy */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
              <span className="text-xs font-bold text-slate-700 block">Return & Warranty Policy</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Return Status</label>
                  <select
                    value={String(formData.policies.returnAvailable)}
                    onChange={(e) => handlePolicyChange('returnAvailable', e.target.value === 'true' ? true : e.target.value === 'false' ? false : 'unknown')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  >
                    <option value="true">Return Available</option>
                    <option value="false">Non-returnable (Final Sale)</option>
                    <option value="unknown">Unclear / Not stated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Window (Days)</label>
                  <input
                    type="number"
                    value={formData.policies.returnWindowDays || ''}
                    onChange={(e) => handlePolicyChange('returnWindowDays', parseInt(e.target.value) || undefined)}
                    placeholder="e.g. 7, 14, 30"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Description & Claims
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  Analyzing Structured Signals...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze Product Risk Signals
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results View (Right) */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {analysis ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              {/* Score Hero Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-4">
                  {/* Large Circular Score Indicator */}
                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke={getScoreColor(analysis.trustScore)}
                        strokeWidth="10"
                        strokeDasharray="264"
                        strokeDashoffset={264 - (264 * analysis.trustScore) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-2xl font-black text-slate-900">
                      {analysis.trustScore}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      OVERALL TRUST SCORE
                    </span>
                    <span
                      className="inline-block text-xs font-black px-2.5 py-0.5 rounded-full mt-0.5 border"
                      style={{
                        backgroundColor: `${getScoreColor(analysis.trustScore)}15`,
                        color: getScoreColor(analysis.trustScore),
                        borderColor: `${getScoreColor(analysis.trustScore)}40`
                      }}
                    >
                      {analysis.riskLevel}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      Based on available signals on this page
                    </p>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-xs font-bold text-slate-400 block">ENGINE STATUS</span>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block mt-0.5">
                    {analysis.isAIPowered ? 'Gemini 3.8 Flash Enhanced' : 'Deterministic Scoring'}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-sm text-slate-800 font-medium">
                {analysis.summary}
              </div>

              {/* 5 Risk Categories Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Risk Dimension Scores (Higher = Greater Risk)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(analysis.riskCategories).map(([key, cat]) => (
                    <div key={key} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-800">{cat.label}</span>
                        <span className="font-bold" style={{ color: getScoreColor(100 - cat.score) }}>
                          {cat.score} / 100
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cat.score}%`,
                            backgroundColor: getScoreColor(100 - cat.score)
                          }}
                        />
                      </div>
                      {cat.signals[0] && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">{cat.signals[0].text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Positive Signals & Warning Signals side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Positive Signals */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Positive Signals
                  </h4>
                  <ul className="text-xs text-emerald-900 space-y-1.5 pl-4 list-disc">
                    {analysis.positiveSignals.map((sig, i) => (
                      <li key={i}>{sig}</li>
                    ))}
                  </ul>
                </div>

                {/* Warnings */}
                <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Warning Signals
                  </h4>
                  <ul className="text-xs text-amber-900 space-y-1.5 pl-4 list-disc">
                    {analysis.warnings.length > 0 ? (
                      analysis.warnings.map((w, i) => <li key={i}>{w}</li>)
                    ) : (
                      <li>No critical risk indicators detected.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Before Purchasing:
                </h4>
                <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>

              {/* "Why this score?" Explanations */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-900">{analysis.explanation.title}</h4>
                <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc">
                  {analysis.explanation.points.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <p className="text-[11px] text-slate-400 text-center">
                {analysis.disclaimer}
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
              <ShieldAlert className="w-12 h-12 mx-auto text-slate-300" />
              <h3 className="font-bold text-slate-700 text-base">No Analysis Generated Yet</h3>
              <p className="text-xs max-w-sm mx-auto">
                Adjust the product signals on the left and click "Analyze Product Risk Signals" to execute the real-time scoring engine.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
