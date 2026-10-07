import React from 'react';
import { Shield, Layers, Bookmark, SlidersHorizontal, ShoppingBag } from 'lucide-react';

interface NavbarProps {
  activeTab: 'browser' | 'compare' | 'history' | 'custom';
  setActiveTab: (tab: 'browser' | 'compare' | 'history' | 'custom') => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, savedCount }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setActiveTab('browser')}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
              <Shield className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">TrustCart AI</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Extension
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Before You Buy, Know the Risk.
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('browser')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'browser'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Shopping Browser</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'compare'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Compare Products</span>
              <span className="sm:hidden">Compare</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Saved & History</span>
              <span className="sm:hidden">Saved</span>
              {savedCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === 'history' ? 'bg-indigo-800 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Test custom product URLs or manual parameters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden md:inline">Custom Link Scanner</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
