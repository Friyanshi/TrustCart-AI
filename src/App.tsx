import React from 'react';
import { ProductPageScanner } from './components/ProductPageScanner';
import { ExtractedProduct, TrustAnalysis } from './types/extension';
import { calculateTrustScore } from './services/scoringEngine';
import { Shield } from 'lucide-react';

export default function App() {
  const analyzeProduct = async (product: ExtractedProduct): Promise<TrustAnalysis> => {
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('API error, using local scoring engine:', e);
    }

    // Deterministic fallback
    const deterministic = calculateTrustScore(product);
    return {
      id: `tc_${Date.now()}`,
      product,
      trustScore: deterministic.trustScore,
      riskLevel: deterministic.riskLevel,
      authenticity: deterministic.authenticity,
      riskCategories: deterministic.riskCategories,
      summary: `Product analyzed based on available page signals.`,
      warnings: deterministic.warnings,
      positiveSignals: deterministic.positiveSignals,
      recommendations: deterministic.recommendations,
      explanation: deterministic.explanation,
      analyzedAt: new Date().toISOString(),
      isAIPowered: false,
      disclaimer: 'This score is an informational risk assessment and does not guarantee that a product or seller is legitimate.',
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Clean, Uncluttered Top Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
              <Shield className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 block leading-tight">
                TrustCart AI
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Product Risk & Authenticity Scanner
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Single Scanner Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <ProductPageScanner onAnalyze={analyzeProduct} />
      </main>

      {/* Clean Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        <p>TrustCart AI — Before You Buy, Know the Risk. Informational risk assessment based on available signals.</p>
      </footer>
    </div>
  );
}
