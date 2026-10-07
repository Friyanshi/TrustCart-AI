import React, { useState, useEffect } from 'react';
import {
  Shield,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Lock,
  Star,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ShoppingBag,
  ExternalLink,
  Bookmark,
  Share2,
  Truck,
  RotateCcw,
  Sparkles,
  Layers,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { SAMPLE_PRODUCTS, SampleScenario } from '../services/sampleProducts';
import { ExtractedProduct, TrustAnalysis } from '../types/extension';
import { calculateTrustScore } from '../services/scoringEngine';

interface SimulatorProps {
  onAnalyzeProduct: (product: ExtractedProduct) => Promise<TrustAnalysis>;
  onSaveProduct?: (analysis: TrustAnalysis) => void;
  savedProductIds?: Set<string>;
}

export const ExtensionSimulator: React.FC<SimulatorProps> = ({
  onAnalyzeProduct,
  onSaveProduct,
  savedProductIds = new Set()
}) => {
  const [selectedScenario, setSelectedScenario] = useState<SampleScenario>(SAMPLE_PRODUCTS[0]);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(true);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(false);

  // Popup States: 'detection' | 'scanning' | 'results'
  const [popupState, setPopupState] = useState<'detection' | 'scanning' | 'results'>('detection');
  const [scanStep, setScanStep] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<TrustAnalysis | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [isSavedLocally, setIsSavedLocally] = useState<boolean>(false);

  // Reset state when switching products
  useEffect(() => {
    setPopupState('detection');
    setScanStep(0);
    setAnalysisResult(null);
    setShowExplanation(false);
    setIsSavedLocally(savedProductIds.has(selectedScenario.product.url));
  }, [selectedScenario, savedProductIds]);

  const handleStartScan = async () => {
    setPopupState('scanning');
    setScanStep(1);

    const timer1 = setTimeout(() => setScanStep(2), 250);
    const timer2 = setTimeout(() => setScanStep(3), 500);
    const timer3 = setTimeout(() => setScanStep(4), 750);
    const timer4 = setTimeout(() => setScanStep(5), 1000);

    try {
      const result = await onAnalyzeProduct(selectedScenario.product);
      setTimeout(() => {
        setScanStep(6);
        setTimeout(() => {
          setAnalysisResult(result);
          setPopupState('results');
        }, 300);
      }, 1200);
    } catch (e) {
      const fallback = calculateTrustScore(selectedScenario.product);
      setTimeout(() => {
        setAnalysisResult({
          id: `tc_${Date.now()}`,
          product: selectedScenario.product,
          trustScore: fallback.trustScore,
          riskLevel: fallback.riskLevel,
          authenticity: fallback.authenticity,
          riskCategories: fallback.riskCategories,
          summary: `Product exhibits ${fallback.riskLevel.toLowerCase()} indicators based on available data.`,
          warnings: fallback.warnings,
          positiveSignals: fallback.positiveSignals,
          recommendations: fallback.recommendations,
          explanation: fallback.explanation,
          analyzedAt: new Date().toISOString(),
          isAIPowered: false,
          disclaimer: 'This score is an informational risk assessment and does not guarantee that a product or seller is legitimate.'
        });
        setPopupState('results');
      }, 1200);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getRiskBadgeStyles = (level: string) => {
    if (level === 'LOW RISK') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (level === 'MODERATE RISK') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (level === 'HIGH RISK') return 'bg-orange-50 text-orange-800 border-orange-200';
    return 'bg-red-50 text-red-800 border-red-200';
  };

  const handleSaveClick = () => {
    if (analysisResult) {
      setIsSavedLocally(true);
      if (onSaveProduct) {
        onSaveProduct(analysisResult);
      }
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Quick Store Navigator */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Shopping Store:</span>
          <div className="flex flex-wrap gap-1.5">
            {SAMPLE_PRODUCTS.map((scenario) => {
              const isSelected = selectedScenario.id === scenario.id;
              return (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      scenario.expectedRisk === 'LOW RISK'
                        ? 'bg-emerald-400'
                        : scenario.expectedRisk === 'MODERATE RISK'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />
                  <span>{scenario.name.split(' (')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Click the <span className="font-bold text-indigo-700">TrustCart AI Shield</span> in the browser toolbar to analyze.
        </div>
      </div>

      {/* Realistic Chrome Browser Window Frame */}
      <div className="bg-slate-900 rounded-2xl p-2.5 sm:p-3 shadow-2xl border border-slate-800">
        {/* Browser Top Tab Bar */}
        <div className="flex items-center justify-between px-2 py-1 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
          </div>

          <div className="bg-slate-800 text-slate-200 text-xs font-semibold px-4 py-1.5 rounded-t-lg max-w-md truncate flex items-center gap-2 border-t border-x border-slate-700">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{selectedScenario.product.title}</span>
          </div>

          <div className="w-12"></div>
        </div>

        {/* Chrome Address Bar & Extension Action Button */}
        <div className="bg-slate-800 rounded-xl p-2 flex items-center gap-2 sm:gap-3 text-slate-400 mb-2">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ArrowLeft className="w-4 h-4 cursor-pointer hover:text-white" />
            <ArrowRight className="w-4 h-4 cursor-pointer hover:text-white" />
            <RotateCw className="w-3.5 h-3.5 cursor-pointer hover:text-white" />
          </div>

          {/* URL bar */}
          <div className="flex-1 bg-slate-900 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs border border-slate-700/60 overflow-hidden">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-200 font-semibold truncate">https://{selectedScenario.product.domain}</span>
            <span className="text-slate-500 truncate hidden md:inline">/dp/{selectedScenario.id}</span>
          </div>

          {/* Extension Action Button */}
          <div className="flex items-center gap-2 relative shrink-0">
            <button
              onClick={() => setIsPopupOpen(!isPopupOpen)}
              className={`px-2.5 py-1.5 rounded-lg transition relative flex items-center gap-1.5 cursor-pointer font-bold text-xs ${
                isPopupOpen
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
              title="TrustCart AI Extension"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">TrustCart AI</span>
              {analysisResult && (
                <span
                  className="text-[10px] font-black px-1.5 py-0.2 rounded-full text-white ml-0.5"
                  style={{ backgroundColor: getScoreColor(analysisResult.trustScore) }}
                >
                  {analysisResult.trustScore}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Browser Page Viewport */}
        <div className="bg-white rounded-xl overflow-hidden relative min-h-[620px] grid grid-cols-1 lg:grid-cols-12">
          {/* E-Commerce Shopping Page */}
          <div className="lg:col-span-8 p-5 sm:p-8 bg-slate-50 overflow-y-auto max-h-[700px] space-y-6">
            <div className="max-w-3xl bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              {/* Product Store Brand & Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                    {selectedScenario.product.domain}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Free Fast Delivery Available</span>
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {selectedScenario.product.title}
                </h1>

                {/* Rating */}
                {selectedScenario.product.rating ? (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{selectedScenario.product.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 font-medium">
                      {selectedScenario.product.reviewCount?.toLocaleString() || 0} customer ratings
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">No ratings available yet</span>
                )}
              </div>

              {/* Price Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-baseline gap-3 sm:gap-4">
                <span className="text-3xl sm:text-4xl font-black text-emerald-700">
                  {selectedScenario.product.currency || '₹'}
                  {selectedScenario.product.currentPrice?.toLocaleString()}
                </span>
                {selectedScenario.product.originalPrice && (
                  <span className="text-base sm:text-lg text-slate-400 line-through">
                    {selectedScenario.product.currency || '₹'}
                    {selectedScenario.product.originalPrice?.toLocaleString()}
                  </span>
                )}
                {selectedScenario.product.discountPercent && (
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-md bg-rose-100 text-rose-700">
                    {selectedScenario.product.discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* In-Page TrustCart Helper Callout */}
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-indigo-950 font-semibold">
                  <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>TrustCart AI is monitoring this page for risk indicators.</span>
                </div>
                {!analysisResult && (
                  <button
                    onClick={() => {
                      setIsPopupOpen(true);
                      handleStartScan();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shrink-0 cursor-pointer shadow-sm"
                  >
                    Scan Now
                  </button>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Product Overview
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {selectedScenario.product.description}
                </p>
              </div>

              {/* Seller & Policy Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Sold By</span>
                  <span className="font-extrabold text-slate-900 block text-sm">
                    {selectedScenario.product.seller?.name || 'Third-Party Merchant'}
                  </span>
                  {selectedScenario.product.seller?.isVerified ? (
                    <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Brand Merchant
                    </span>
                  ) : (
                    <span className="text-slate-500">Unverified Merchant</span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block">Return & Replacement</span>
                  <span className="font-extrabold text-slate-900 block text-sm">
                    {selectedScenario.product.policies.returnAvailable === false
                      ? 'Non-returnable (Final Sale)'
                      : selectedScenario.product.policies.refundPolicyText || 'Return Policy Stated'}
                  </span>
                  {selectedScenario.product.policies.warrantyText && (
                    <span className="text-slate-600 block">{selectedScenario.product.policies.warrantyText}</span>
                  )}
                </div>
              </div>

              {/* Sample Customer Reviews */}
              {selectedScenario.product.reviews.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Customer Feedback & Reviews
                  </h3>
                  <div className="space-y-2">
                    {selectedScenario.product.reviews.map((r, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{r.author || 'Verified Buyer'}</span>
                          <span className="text-amber-500 font-bold">{r.rating || 5} ★</span>
                        </div>
                        <p className="text-slate-600 italic">"{r.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Extension Popup Overlay (Right Sidebar / Popup Window) */}
          <div className="lg:col-span-4 p-4 bg-slate-100/90 border-l border-slate-200 flex flex-col justify-start items-center">
            {isPopupOpen ? (
              <div className="w-full max-w-[360px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-200">
                {/* Popup Header */}
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 leading-tight">TrustCart AI</h2>
                      <p className="text-[10px] text-slate-500 font-medium">Before You Buy, Know the Risk.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPopupOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded cursor-pointer"
                    title="Close popup"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Popup Content */}
                <div className="p-4 space-y-4 max-h-[540px] overflow-y-auto">
                  {/* STATE 1: DETECTION */}
                  {popupState === 'detection' && (
                    <div className="space-y-3.5">
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Product detected ✓
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Current Page:
                        </span>
                        <p className="text-xs font-bold text-slate-900 line-clamp-2">
                          {selectedScenario.product.title}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                          <span className="text-slate-500">Price:</span>
                          <span className="font-extrabold text-emerald-700 text-sm">
                            {selectedScenario.product.currency || '₹'}
                            {selectedScenario.product.currentPrice?.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleStartScan}
                        className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        Analyze Product
                      </button>

                      <p className="text-[10px] text-center text-slate-400">
                        Based on publicly available product information.
                      </p>
                    </div>
                  )}

                  {/* STATE 2: SCANNING */}
                  {popupState === 'scanning' && (
                    <div className="py-6 text-center space-y-4">
                      <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                        <Shield className="w-6 h-6 text-indigo-600" />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Scanning product information…</h3>
                        <p className="text-[11px] text-slate-500">Analyzing available signals on page</p>
                      </div>

                      <div className="text-left max-w-[240px] mx-auto space-y-1.5 text-xs text-slate-500">
                        <div className={`flex items-center gap-2 ${scanStep >= 1 ? 'text-slate-900 font-semibold' : ''}`}>
                          <span className={scanStep >= 1 ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                            {scanStep >= 1 ? '✓' : '○'}
                          </span>
                          Product information
                        </div>
                        <div className={`flex items-center gap-2 ${scanStep >= 2 ? 'text-slate-900 font-semibold' : ''}`}>
                          <span className={scanStep >= 2 ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                            {scanStep >= 2 ? '✓' : '○'}
                          </span>
                          Price signals
                        </div>
                        <div className={`flex items-center gap-2 ${scanStep >= 3 ? 'text-slate-900 font-semibold' : ''}`}>
                          <span className={scanStep >= 3 ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                            {scanStep >= 3 ? '✓' : '○'}
                          </span>
                          Reviews & ratings
                        </div>
                        <div className={`flex items-center gap-2 ${scanStep >= 4 ? 'text-slate-900 font-semibold' : ''}`}>
                          <span className={scanStep >= 4 ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                            {scanStep >= 4 ? '✓' : '○'}
                          </span>
                          Seller information
                        </div>
                        <div className={`flex items-center gap-2 ${scanStep >= 5 ? 'text-slate-900 font-semibold' : ''}`}>
                          <span className={scanStep >= 5 ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                            {scanStep >= 5 ? '✓' : '○'}
                          </span>
                          Return & warranty policy
                        </div>
                      </div>

                      {scanStep >= 6 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> AI analysis complete
                        </span>
                      )}
                    </div>
                  )}

                  {/* STATE 3: RESULTS / TRUST SCORE */}
                  {popupState === 'results' && analysisResult && (
                    <div className="space-y-4">
                      {/* Circular Score Header */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                        <div className="flex items-center justify-center gap-4">
                          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                              <circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                stroke={getScoreColor(analysisResult.trustScore)}
                                strokeWidth="10"
                                strokeDasharray="264"
                                strokeDashoffset={264 - (264 * analysisResult.trustScore) / 100}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute text-2xl font-black text-slate-900">
                              {analysisResult.trustScore}
                            </span>
                          </div>

                          <div className="text-left space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              TRUST SCORE
                            </span>
                            <div className={`px-2.5 py-0.5 rounded text-xs font-black inline-block border ${getRiskBadgeStyles(analysisResult.riskLevel)}`}>
                              {analysisResult.riskLevel}
                            </div>
                            <p className="text-[10px] text-slate-500">Based on available signals</p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-snug pt-2 border-t border-slate-200 font-medium">
                          {analysisResult.summary}
                        </p>

                        <button
                          onClick={() => setShowExplanation(!showExplanation)}
                          className="w-full py-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>{showExplanation ? 'Hide Explanation' : 'Why this score?'}</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition ${showExplanation ? 'rotate-180' : ''}`} />
                        </button>

                        {showExplanation && (
                          <div className="p-3 rounded-lg bg-white border border-slate-200 text-left text-[11px] text-slate-600 space-y-1.5 animate-in fade-in">
                            <strong className="text-slate-900 block">{analysisResult.explanation.title}</strong>
                            <ul className="list-disc pl-4 space-y-1">
                              {analysisResult.explanation.points.map((pt, i) => (
                                <li key={i}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* 5 Risk Categories Breakdown */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                          Risk Categories Breakdown
                        </span>
                        <div className="space-y-1.5">
                          {Object.entries(analysisResult.riskCategories).map(([key, cat]) => (
                            <div key={key} className="space-y-0.5">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-slate-700">{cat.label}</span>
                                <span style={{ color: getScoreColor(100 - cat.score) }}>{cat.score} / 100</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${cat.score}%`,
                                    backgroundColor: getScoreColor(100 - cat.score)
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Positive Signals */}
                      {analysisResult.positiveSignals.length > 0 && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                          <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Positive Signals
                          </span>
                          <ul className="text-xs text-emerald-900 space-y-1 pl-4 list-disc">
                            {analysisResult.positiveSignals.map((sig, i) => (
                              <li key={i}>{sig}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Warnings */}
                      {analysisResult.warnings.length > 0 && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Warning Signals
                          </span>
                          <ul className="text-xs text-amber-900 space-y-1 pl-4 list-disc">
                            {analysisResult.warnings.map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendations */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-xs font-bold text-slate-900 block">
                          Before Purchasing:
                        </span>
                        <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc">
                          {analysisResult.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={handleSaveClick}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            isSavedLocally
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSavedLocally ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                          {isSavedLocally ? 'Saved ✓' : 'Save Product'}
                        </button>
                        <button
                          onClick={() => setPopupState('detection')}
                          className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                        >
                          Re-scan
                        </button>
                      </div>

                      {/* Disclaimer */}
                      <p className="text-[10px] text-slate-400 text-center leading-tight">
                        This score is an informational risk assessment and does not guarantee that a product or seller is legitimate.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-3">
                <Shield className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">Extension popup is closed.</p>
                <button
                  onClick={() => setIsPopupOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-sm cursor-pointer"
                >
                  Open TrustCart AI Popup
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
