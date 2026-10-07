import React from 'react';
import { Bookmark, Trash2, Layers, ExternalLink, Shield, Calendar, ArrowRight } from 'lucide-react';
import { TrustAnalysis } from '../types/extension';

interface SavedHistoryViewProps {
  savedProducts: TrustAnalysis[];
  history: TrustAnalysis[];
  onRemoveSaved: (id: string) => void;
  onClearHistory: () => void;
  onCompareWithSaved: () => void;
}

export const SavedHistoryView: React.FC<SavedHistoryViewProps> = ({
  savedProducts,
  history,
  onRemoveSaved,
  onClearHistory,
  onCompareWithSaved
}) => {
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Saved Products & Analysis History
          </h2>
          <p className="text-sm text-slate-500">
            Products you bookmarked for monitoring and your recent risk scans.
          </p>
        </div>

        {savedProducts.length >= 2 && (
          <button
            onClick={onCompareWithSaved}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            Compare Saved Items ({savedProducts.length})
          </button>
        )}
      </div>

      {/* Saved Products Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-indigo-600" />
            Saved Products ({savedProducts.length})
          </h3>
        </div>

        {savedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedProducts.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                      {item.product.domain}
                    </span>
                    <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded border ${getRiskBadgeStyles(item.riskLevel)}`}>
                      {item.riskLevel}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm line-clamp-2">
                    {item.product.title}
                  </h4>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Price:</span>
                    <span className="font-extrabold text-emerald-700 text-sm">
                      {item.product.currency || '₹'}
                      {item.product.currentPrice?.toLocaleString() || 'Unavailable'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200/70 text-xs">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Trust Score:</span>
                    <span style={{ color: getScoreColor(item.trustScore) }}>
                      {item.trustScore} / 100
                    </span>
                  </div>

                  <button
                    onClick={() => onRemoveSaved(item.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded transition cursor-pointer"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <Bookmark className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">No saved products yet. Click "Save Product" inside the extension popup.</p>
          </div>
        )}
      </div>

      {/* Analysis History Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Recent Scan History ({history.length})
          </h3>
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
            >
              Clear History
            </button>
          )}
        </div>

        {history.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {history.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                <div className="space-y-1 max-w-lg">
                  <span className="font-bold text-slate-900 block truncate">{item.product.title}</span>
                  <div className="flex items-center gap-2 text-slate-500">
                    <code>{item.product.domain}</code>
                    <span>•</span>
                    <span>{new Date(item.analyzedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-black text-sm block" style={{ color: getScoreColor(item.trustScore) }}>
                      {item.trustScore}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getRiskBadgeStyles(item.riskLevel)}`}>
                      {item.riskLevel}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">No scan history recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
