import React, { useState } from 'react';
import { Download, FileCode, Check, Copy, Folder, File, ExternalLink, Shield, HelpCircle } from 'lucide-react';
import { generateExtensionZip } from '../services/zipExporter';

interface ExtensionFile {
  path: string;
  name: string;
  category: string;
  url: string;
}

const EXTENSION_FILES: ExtensionFile[] = [
  { path: 'manifest.json', name: 'manifest.json', category: 'Root', url: '/trustcart-ai/manifest.json' },
  { path: 'content/extractor.js', name: 'extractor.js', category: 'Content Script', url: '/trustcart-ai/content/extractor.js' },
  { path: 'content/content.js', name: 'content.js', category: 'Content Script', url: '/trustcart-ai/content/content.js' },
  { path: 'background/service-worker.js', name: 'service-worker.js', category: 'Background', url: '/trustcart-ai/background/service-worker.js' },
  { path: 'utils/scoring.js', name: 'scoring.js', category: 'Utils', url: '/trustcart-ai/utils/scoring.js' },
  { path: 'utils/validation.js', name: 'validation.js', category: 'Utils', url: '/trustcart-ai/utils/validation.js' },
  { path: 'utils/storage.js', name: 'storage.js', category: 'Utils', url: '/trustcart-ai/utils/storage.js' },
  { path: 'ai/analyzer.js', name: 'analyzer.js', category: 'AI', url: '/trustcart-ai/ai/analyzer.js' },
  { path: 'popup/popup.html', name: 'popup.html', category: 'Popup UI', url: '/trustcart-ai/popup/popup.html' },
  { path: 'popup/popup.css', name: 'popup.css', category: 'Popup UI', url: '/trustcart-ai/popup/popup.css' },
  { path: 'popup/popup.js', name: 'popup.js', category: 'Popup UI', url: '/trustcart-ai/popup/popup.js' },
  { path: 'sidepanel/sidepanel.html', name: 'sidepanel.html', category: 'Side Panel', url: '/trustcart-ai/sidepanel/sidepanel.html' },
  { path: 'dashboard/dashboard.html', name: 'dashboard.html', category: 'Dashboard', url: '/trustcart-ai/dashboard/dashboard.html' },
  { path: 'README.md', name: 'README.md', category: 'Docs', url: '/trustcart-ai/README.md' }
];

export const ExtensionPackager: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<ExtensionFile>(EXTENSION_FILES[0]);
  const [fileContent, setFileContent] = useState<string>('Loading file content...');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  React.useEffect(() => {
    let isMounted = true;
    fetch(selectedFile.url)
      .then((res) => res.text())
      .then((text) => {
        if (isMounted) setFileContent(text);
      })
      .catch((err) => {
        if (isMounted) setFileContent(`// Error loading file: ${err.message}`);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedFile]);

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const blob = await generateExtensionZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trustcart-ai-extension.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Failed to generate ZIP bundle.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
            <Shield className="w-3.5 h-3.5" /> Manifest V3 Ready
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Download TrustCart AI Extension
          </h2>
          <p className="text-sm text-indigo-200">
            Export the complete standalone Chrome Extension bundle ready to be loaded via <code>chrome://extensions/</code>.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={downloading}
          className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-indigo-900 font-extrabold text-sm shadow-lg transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-75 cursor-pointer"
        >
          {downloading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-indigo-900 border-t-transparent animate-spin"></div>
              Packaging ZIP...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download Extension (.zip)
            </>
          )}
        </button>
      </div>

      {/* Upload Instructions Callout Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-indigo-950">
        <div className="space-y-1">
          <div className="font-extrabold text-sm text-indigo-900 flex items-center gap-1.5">
            <Folder className="w-4 h-4 text-indigo-600" />
            Which folder should you upload to chrome://extensions/?
          </div>
          <p className="text-indigo-800 leading-relaxed">
            • If you download the <strong>Extension ZIP</strong> above: Unzip it and select the unzipped <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-indigo-700">trustcart-ai-extension</code> folder.<br />
            • If you download the <strong>full project source</strong> (from AI Studio/GitHub): Select the <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-indigo-700">trustcart-ai</code> subfolder inside it.
          </p>
        </div>
      </div>

      {/* Code Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[560px]">
        {/* Left file tree */}
        <div className="lg:col-span-4 border-r border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Extension Files</span>
            <span className="text-[11px] font-bold text-slate-400">14 Files</span>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[480px]">
            {EXTENSION_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{file.path}</span>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {file.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Code Viewer */}
        <div className="lg:col-span-8 flex flex-col h-full">
          {/* Header */}
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <File className="w-4 h-4 text-indigo-400" />
              <span className="font-mono text-slate-200 font-semibold">{selectedFile.path}</span>
            </div>

            <button
              onClick={handleCopyCode}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Code
                </>
              )}
            </button>
          </div>

          {/* Code Body */}
          <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-auto flex-1 max-h-[500px] leading-relaxed selection:bg-indigo-600 selection:text-white">
            <code>{fileContent}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
