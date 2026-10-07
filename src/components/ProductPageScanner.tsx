import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Bot,
  Search,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Link as LinkIcon,
  RotateCw,
  Info
} from 'lucide-react';
import { ExtractedProduct, TrustAnalysis } from '../types/extension';

interface ScannerProps {
  onAnalyze: (product: ExtractedProduct) => Promise<TrustAnalysis>;
}

export const ProductPageScanner: React.FC<ScannerProps> = ({ onAnalyze }) => {
  const [scanMode, setScanMode] = useState<'current_page' | 'paste_link'>('current_page');
  
  // URL Input for Option 1 - starts clean and empty
  const [pastedUrl, setPastedUrl] = useState<string>('');
  
  // State for Option 2: Active Browser Page Detection
  const [currentPageProduct, setCurrentPageProduct] = useState<ExtractedProduct | null>(null);
  const [detectingPage, setDetectingPage] = useState<boolean>(false);
  const [pageDetectionError, setPageDetectionError] = useState<string | null>(null);
  
  // Loading & Scan State
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TrustAnalysis | null>(null);

  // Check active browser tab on load
  useEffect(() => {
    detectCurrentBrowserTab();
  }, []);

  const detectCurrentBrowserTab = async () => {
    setDetectingPage(true);
    setPageDetectionError(null);
    setCurrentPageProduct(null);

    try {
      const win = typeof window !== 'undefined' ? (window as any) : null;
      if (win && win.chrome && win.chrome.tabs && win.chrome.tabs.query) {
        win.chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
          if (!tabs || !tabs[0] || !tabs[0].id) {
            setPageDetectionError('No active browser tab found.');
            setDetectingPage(false);
            return;
          }

          const tab = tabs[0];
          if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://'))) {
            setPageDetectionError('The active tab is a browser system page. Please navigate to an online store product page to scan.');
            setDetectingPage(false);
            return;
          }

          // Message content script to extract product info
          win.chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_PRODUCT_DATA' }, (response: any) => {
            if (win.chrome.runtime.lastError || !response || !response.success || !response.product || !response.product.title) {
              setPageDetectionError('This page does not contain detectable e-commerce product information. Please open a direct product page.');
              setCurrentPageProduct(null);
            } else {
              setCurrentPageProduct(response.product);
              setPageDetectionError(null);
            }
            setDetectingPage(false);
          });
        });
      } else {
        // In preview sandbox without Chrome Tabs API
        setPageDetectionError('Open TrustCart AI inside a shopping product tab to scan automatically, or paste a product link below.');
        setDetectingPage(false);
      }
    } catch {
      setPageDetectionError('Unable to inspect the current browser tab.');
      setDetectingPage(false);
    }
  };

  // Option 1: Handle Pasted Link Scan with strict validation
  const handleScanPastedLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setAnalysis(null);

    const input = pastedUrl.trim();
    if (!input) {
      setErrorMessage('Please enter a product page URL.');
      return;
    }

    // Strict URL validation: check if it's random letters/numbers or invalid string
    let parsedUrl: URL;
    try {
      const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;
      parsedUrl = new URL(withProtocol);
    } catch {
      setErrorMessage('Invalid URL format. Please enter a valid web address (e.g. https://www.amazon.com/dp/... or store product link).');
      return;
    }

    if (!parsedUrl.hostname || !parsedUrl.hostname.includes('.') || parsedUrl.hostname.length < 4) {
      setErrorMessage('Invalid domain name. Please enter a valid URL with a proper website domain.');
      return;
    }

    setLoading(true);

    try {
      // Send to /api/scan-url on backend for genuine HTML parsing & risk analysis
      const res = await fetch('/api/scan-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: parsedUrl.href })
      });

      const json = await res.json();

      if (!res.ok || !json.success || !json.data) {
        setErrorMessage(json.error || 'No valid product information found at this URL. Please verify the link points directly to a product page.');
        setAnalysis(null);
      } else {
        setAnalysis(json.data);
      }
    } catch (err: any) {
      setErrorMessage('Failed to connect to the analysis server. Please check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Option 2: Handle Scan Current Browser Page
  const handleScanCurrentPage = async () => {
    setErrorMessage(null);
    setAnalysis(null);

    if (!currentPageProduct || !currentPageProduct.title || currentPageProduct.title.trim().length < 3) {
      setErrorMessage('No valid product information is available on the current page to analyze.');
      return;
    }

    setLoading(true);
    try {
      const result = await onAnalyze(currentPageProduct);
      setAnalysis(result);
    } catch (e: any) {
      setErrorMessage(e?.message || 'Failed to analyze the product on current page.');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictCard = () => {
    if (!analysis) return null;
    const v = analysis.authenticity.verdict;

    if (v === 'REAL') {
      return {
        bg: 'bg-emerald-50 border-emerald-300 text-emerald-950',
        badge: 'bg-emerald-600 text-white',
        icon: ShieldCheck,
        title: 'VERDICT: REAL & AUTHENTIC PRODUCT',
        desc: analysis.authenticity.primaryReason
      };
    } else if (v === 'FRAUD') {
      return {
        bg: 'bg-red-50 border-red-300 text-red-950',
        badge: 'bg-red-600 text-white',
        icon: ShieldAlert,
        title: 'VERDICT: HIGH RISK / SUSPECTED FRAUD',
        desc: analysis.authenticity.primaryReason
      };
    } else if (v === 'AI_GENERATED') {
      return {
        bg: 'bg-purple-50 border-purple-300 text-purple-950',
        badge: 'bg-purple-600 text-white',
        icon: Bot,
        title: 'VERDICT: AI-GENERATED / SYNTHETIC LISTING',
        desc: analysis.authenticity.primaryReason
      };
    } else {
      return {
        bg: 'bg-amber-50 border-amber-300 text-amber-950',
        badge: 'bg-amber-600 text-white',
        icon: AlertTriangle,
        title: 'VERDICT: SUSPICIOUS / EXERCISE CAUTION',
        desc: analysis.authenticity.primaryReason
      };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const verdictCard = getVerdictCard();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Product Risk & Authenticity Scanner
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Evaluates product page signals to detect if a listing is <strong>Real</strong>, <strong>Fraud / Scam</strong>, or <strong>AI-Generated</strong>.
        </p>
      </div>

      {/* Two Scan Options Toggle */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300/60 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => {
            setScanMode('current_page');
            setErrorMessage(null);
          }}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            scanMode === 'current_page'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Scan Current Page</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setScanMode('paste_link');
            setErrorMessage(null);
          }}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            scanMode === 'paste_link'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          <span>Paste Product Link</span>
        </button>
      </div>

      {/* Error / Alert Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Scan Error:</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Option 1 View: Scan Current Active Browser Page */}
      {scanMode === 'current_page' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Browser Page:
            </span>
            <button
              type="button"
              onClick={detectCurrentBrowserTab}
              disabled={detectingPage}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${detectingPage ? 'animate-spin' : ''}`} />
              Refresh Tab
            </button>
          </div>

          {currentPageProduct ? (
            <div className="space-y-3">
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Product Detected
                  </span>
                  {currentPageProduct.currentPrice != null && (
                    <span className="text-xs font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                      {currentPageProduct.currency || '₹'}{currentPageProduct.currentPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                  {currentPageProduct.title}
                </p>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  {currentPageProduct.url || currentPageProduct.domain}
                </p>
              </div>

              <button
                type="button"
                onClick={handleScanCurrentPage}
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    Scanning Product Page...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Scan Product on This Page
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  {pageDetectionError || 'No product detected on this page.'}
                </p>
                <p className="text-xs text-slate-500">
                  To analyze a product, open an online shopping page in your browser or switch to the <strong>Paste Product Link</strong> tab.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Option 2 View: Paste Product Link */}
      {scanMode === 'paste_link' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <form onSubmit={handleScanPastedLink} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Paste Product Page URL:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={pastedUrl}
                  onChange={(e) => setPastedUrl(e.target.value)}
                  placeholder="https://www.amazon.com/dp/... or any shopping product link"
                  className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 font-medium placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  Extracting & Analyzing Product URL...
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4" />
                  Scan Product Link
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Scan Results - Only Rendered when Real Analysis is successfully computed */}
      {analysis && verdictCard && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Main Verdict Card */}
          <div className={`p-5 rounded-2xl border-2 ${verdictCard.bg} shadow-sm space-y-2`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <verdictCard.icon className="w-6 h-6 shrink-0" />
                <h3 className="text-base sm:text-lg font-black tracking-tight">{verdictCard.title}</h3>
              </div>
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${verdictCard.badge}`}>
                {analysis.riskLevel}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium leading-relaxed">
              {verdictCard.desc}
            </p>
          </div>

          {/* Score & Risk Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Trust Score */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center flex flex-col justify-center items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                Trust Score
              </span>
              <div className="text-3xl font-black" style={{ color: getScoreColor(analysis.trustScore) }}>
                {analysis.trustScore}
                <span className="text-xs font-medium text-slate-400">/100</span>
              </div>
              <span className="text-[11px] font-bold text-slate-600">{analysis.riskLevel}</span>
            </div>

            {/* AI Generation Risk */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-purple-600" />
                  AI Generation Risk
                </span>
                <span className={analysis.authenticity.aiGenerationProbability > 50 ? 'text-purple-700 font-extrabold' : 'text-slate-500'}>
                  {analysis.authenticity.aiGenerationProbability}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${analysis.authenticity.aiGenerationProbability}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">
                {analysis.authenticity.aiGenerationProbability > 50
                  ? 'Synthetic copy or bot review phrasing detected.'
                  : 'Natural human description & organic reviews.'}
              </p>
            </div>

            {/* Fraud Risk */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  Fraud / Scam Risk
                </span>
                <span className={analysis.authenticity.fraudProbability > 50 ? 'text-red-700 font-extrabold' : 'text-slate-500'}>
                  {analysis.authenticity.fraudProbability}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${analysis.authenticity.fraudProbability}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">
                {analysis.authenticity.fraudProbability > 50
                  ? 'High risk: suspicious pricing or seller trap.'
                  : 'Low fraud signals: legitimate seller & terms.'}
              </p>
            </div>
          </div>

          {/* Key Signals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Warnings */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Warning Flags
              </h4>
              <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc">
                {analysis.warnings.length > 0 ? (
                  analysis.warnings.map((w, i) => <li key={i}>{w}</li>)
                ) : (
                  <li className="text-slate-400 italic">No critical risk flags detected.</li>
                )}
              </ul>
            </div>

            {/* Positive */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Authenticity Signals
              </h4>
              <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc">
                {analysis.positiveSignals.length > 0 ? (
                  analysis.positiveSignals.map((s, i) => <li key={i}>{s}</li>)
                ) : (
                  <li className="text-slate-400 italic">Limited reassuring signals available.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Before You Buy (Recommendations):
            </h4>
            <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc">
              {analysis.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
