import React from 'react';
import {
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Folder,
  FileCode,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Download,
  AlertTriangle
} from 'lucide-react';

export const InstallGuide: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
          Chrome Extension Setup & Loading Guide
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Which Folder to Upload to Chrome?
        </h2>
        <p className="text-sm text-slate-600">
          Chrome requires the folder that directly contains <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs font-bold text-indigo-700">manifest.json</code>.
          Here is exactly how to upload depending on how you downloaded the code:
        </p>
      </div>

      {/* Which Folder Callout Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scenario 1: Downloaded via In-App "Download Extension (.zip)" */}
        <div className="bg-white p-6 rounded-2xl border-2 border-indigo-500 shadow-md space-y-4 relative">
          <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-extrabold uppercase tracking-wide">
            Option A (Recommended)
          </div>
          <div className="flex items-center gap-3 pt-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">In-App Extension ZIP</h3>
              <p className="text-xs text-slate-500">Downloaded from "Download & Code" tab</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-700">
            <p>1. Unzip the downloaded <code className="font-mono font-bold text-indigo-700">trustcart-ai-extension.zip</code>.</p>
            <p>2. Open <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">chrome://extensions/</code> in Chrome.</p>
            <p>3. Enable <strong>Developer mode</strong> (top-right toggle).</p>
            <p>4. Click <strong>"Load unpacked"</strong>.</p>
            <p className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-950 font-medium">
              👉 <strong>Select Folder:</strong> The unzipped <code className="font-mono font-bold text-indigo-800">trustcart-ai-extension</code> folder (which contains <code className="font-mono font-bold">manifest.json</code> directly inside it).
            </p>
          </div>
        </div>

        {/* Scenario 2: Downloaded full project repository from AI Studio / GitHub */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 relative">
          <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-slate-700 text-white text-[11px] font-extrabold uppercase tracking-wide">
            Option B
          </div>
          <div className="flex items-center gap-3 pt-1">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Full Project Source ZIP</h3>
              <p className="text-xs text-slate-500">Downloaded via AI Studio "Download Code" or Git</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-700">
            <p>1. Unzip the full repository folder on your computer.</p>
            <p>2. Open <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">chrome://extensions/</code>.</p>
            <p>3. Enable <strong>Developer mode</strong>.</p>
            <p>4. Click <strong>"Load unpacked"</strong>.</p>
            <p className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-900 font-medium">
              👉 <strong>Select Folder:</strong> Inside the unzipped repository, open and select the <code className="font-mono font-bold text-indigo-700">trustcart-ai</code> subfolder.
            </p>
          </div>
        </div>
      </div>

      {/* Directory Visual Explanation */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Folder Structure Reference</span>
          <span className="text-emerald-400 font-semibold text-[11px]">Manifest V3 Ready</span>
        </div>

        <pre className="text-slate-300 leading-relaxed overflow-x-auto">
{`your-extracted-folder/
├── package.json
├── server.ts
├── src/
└── trustcart-ai/             <--- 🎯 UPLOAD THIS FOLDER TO CHROME
    ├── manifest.json         <--- (Must be directly inside the selected folder!)
    ├── popup/
    │   ├── popup.html
    │   ├── popup.css
    │   └── popup.js
    ├── sidepanel/
    ├── content/
    │   ├── extractor.js
    │   └── content.js
    ├── background/
    │   └── service-worker.js
    ├── utils/
    ├── ai/
    ├── assets/icons/
    └── dashboard/`}
        </pre>
      </div>

      {/* Detailed Step-by-Step Instructions */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-slate-900 text-lg">Step-by-Step Installation Walkthrough</h3>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center shrink-0 text-sm">
            1
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="font-bold text-slate-900 text-sm">Navigate to Chrome Extensions Page</h4>
            <p className="text-xs text-slate-600">
              Open Google Chrome, type <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-indigo-700">chrome://extensions/</code> in the URL bar, and press Enter.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center shrink-0 text-sm">
            2
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="font-bold text-slate-900 text-sm">Toggle "Developer mode" in the top-right corner</h4>
            <p className="text-xs text-slate-600">
              Look for the <strong>Developer mode</strong> toggle switch at the top right of the <code className="font-mono text-slate-700">chrome://extensions/</code> page and turn it ON.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center shrink-0 text-sm">
            3
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="font-bold text-slate-900 text-sm">Click "Load unpacked" and choose the folder</h4>
            <p className="text-xs text-slate-600">
              Click the button labeled <strong>"Load unpacked"</strong> at top-left. Select the folder containing <code className="font-mono text-indigo-700">manifest.json</code> (<code className="font-mono">trustcart-ai</code>).
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center shrink-0 text-sm">
            4
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="font-bold text-slate-900 text-sm">Pin the Extension & Test on Any Shopping Site</h4>
            <p className="text-xs text-slate-600">
              Click the Extensions puzzle icon in Chrome's top bar and pin <strong>TrustCart AI</strong>. Visit Amazon, Flipkart, or any product listing and click the shield icon to run real-time risk checks!
            </p>
          </div>
        </div>
      </div>

      {/* Common Errors & Solutions */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 space-y-3">
        <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          Common Chrome Loading Errors & Fixes
        </h4>
        <div className="space-y-2 text-xs text-amber-900">
          <p>
            ❌ <strong>Error: "Manifest file is missing or unreadable"</strong><br />
            ✅ <em>Solution:</em> You selected the root workspace folder instead of the <code className="font-mono font-bold">trustcart-ai</code> subfolder. Double click into <code className="font-mono font-bold">trustcart-ai</code> and click "Select Folder".
          </p>
          <p>
            ❌ <strong>Error: "Could not load background script"</strong><br />
            ✅ <em>Solution:</em> TrustCart AI uses Manifest V3 Service Worker (<code className="font-mono font-bold">background/service-worker.js</code>). Ensure all subdirectories (<code className="font-mono">popup</code>, <code className="font-mono">content</code>, <code className="font-mono">utils</code>, <code className="font-mono">assets</code>) are extracted alongside <code className="font-mono">manifest.json</code>.
          </p>
        </div>
      </div>
    </div>
  );
};
