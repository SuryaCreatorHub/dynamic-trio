import React, { useState } from 'react';
import { Copy, Check, Eye, Columns, SplitSquareVertical } from 'lucide-react';

export default function RedactionDiffViewer({
  rawInput = '',
  redactedOutput = '',
  piiFound = [],
}) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'tabs'
  const [activeTab, setActiveTab] = useState('redacted'); // 'raw' | 'redacted'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(redactedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy payload:', err);
    }
  };

  // Function to render text with highlighted [REDACTED_*] tokens
  const renderHighlightedText = (text) => {
    if (!text) return <span className="text-slate-500 italic">No output generated.</span>;

    const regex = /(\[REDACTED_[A-Z0-9_]+\]|\[PROMPT_INJECTION_[A-Z0-9_]+\])/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        const isInjection = part.includes('INJECTION');
        return (
          <span
            key={index}
            className={`inline-block px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono font-bold tracking-tight border ${
              isInjection
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
            }`}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 px-4 py-2.5 bg-slate-950/70 gap-2">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200">
            DLP Redaction Shield & Diff Viewer
          </h3>
          {piiFound.length > 0 && (
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {piiFound.length} Tokens Sanitized
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="hidden sm:flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1 transition-all ${
                viewMode === 'split'
                  ? 'bg-slate-700 text-slate-100 font-medium shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Side-by-side view"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('tabs')}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1 transition-all ${
                viewMode === 'tabs'
                  ? 'bg-slate-700 text-slate-100 font-medium shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Tabbed view"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Tabs</span>
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            disabled={!redactedOutput}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-medium rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-colors disabled:opacity-40"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Safe Payload</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile tabs header */}
      {(viewMode === 'tabs' || true) && (
        <div className="sm:hidden flex border-b border-slate-800 bg-slate-900 text-xs font-mono">
          <button
            onClick={() => setActiveTab('raw')}
            className={`flex-1 py-2 text-center border-b-2 transition-all ${
              activeTab === 'raw'
                ? 'border-rose-500 text-rose-400 font-bold bg-slate-800/40'
                : 'border-transparent text-slate-400'
            }`}
          >
            Raw Untrusted Input
          </button>
          <button
            onClick={() => setActiveTab('redacted')}
            className={`flex-1 py-2 text-center border-b-2 transition-all ${
              activeTab === 'redacted'
                ? 'border-emerald-500 text-emerald-400 font-bold bg-slate-800/40'
                : 'border-transparent text-slate-400'
            }`}
          >
            Sanitized Output
          </button>
        </div>
      )}

      {/* Content Area */}
      <div className="p-4">
        {/* Split View on Desktop */}
        <div
          className={`${
            viewMode === 'split' ? 'hidden sm:grid sm:grid-cols-2' : 'hidden'
          } gap-4`}
        >
          {/* Raw Input Column */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-rose-400/90 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Raw Untrusted Payload
              </span>
              <span>{rawInput.length} chars</span>
            </div>
            <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-words overflow-y-auto max-h-72 leading-relaxed">
              {rawInput || 'No input data'}
            </pre>
          </div>

          {/* Redacted Output Column */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                Privacy Sanitized & Redacted
              </span>
              <span className="text-emerald-400/80">Safe for LLM</span>
            </div>
            <div className="text-xs font-mono text-slate-200 whitespace-pre-wrap break-words overflow-y-auto max-h-72 leading-relaxed">
              {renderHighlightedText(redactedOutput)}
            </div>
          </div>
        </div>

        {/* Tabbed View (active on mobile or when toggled) */}
        <div
          className={`${
            viewMode === 'tabs' ? 'block' : 'sm:hidden block'
          }`}
        >
          {activeTab === 'raw' ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span className="text-rose-400 font-medium">Raw Untrusted Payload</span>
                <span>{rawInput.length} chars</span>
              </div>
              <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-words overflow-y-auto max-h-72">
                {rawInput || 'No input data'}
              </pre>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3.5">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-mono text-slate-400">
                <span className="text-emerald-400 font-medium">Privacy Sanitized & Redacted</span>
                <span className="text-emerald-400/80">Safe for LLM</span>
              </div>
              <div className="text-xs font-mono text-slate-200 whitespace-pre-wrap break-words overflow-y-auto max-h-72 leading-relaxed">
                {renderHighlightedText(redactedOutput)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

