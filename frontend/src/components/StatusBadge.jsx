import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle, Send, ShieldAlert } from 'lucide-react';

export default function StatusBadge({ status = 'idle', size = 'md' }) {
  const normalized = (status || 'idle').toLowerCase();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-medium',
  };

  if (normalized === 'sending') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/40 animate-pulse font-mono ${sizeClasses[size]}`}
      >
        <Send className="w-3.5 h-3.5 animate-bounce" />
        <span>SENDING PAYLOAD</span>
      </span>
    );
  }

  if (normalized === 'generating') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 font-mono shadow-[0_0_12px_rgba(6,182,212,0.3)] ${sizeClasses[size]}`}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
        <span className="tracking-wide">ANALYZING (GEMINI)</span>
      </span>
    );
  }

  if (normalized === 'completed') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 font-mono ${sizeClasses[size]}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>AUDIT COMPLETED</span>
      </span>
    );
  }

  if (normalized === 'failed') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-rose-950/60 text-rose-300 border border-rose-500/40 font-mono ${sizeClasses[size]}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
        <span>FAILED</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-slate-800/80 text-slate-300 border border-slate-700 font-mono ${sizeClasses[size]}`}
    >
      <span className="w-2 h-2 rounded-full bg-slate-400" />
      <span>READY</span>
    </span>
  );
}

