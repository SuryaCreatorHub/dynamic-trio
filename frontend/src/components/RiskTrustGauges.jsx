import React from 'react';
import { ShieldAlert, ShieldCheck, AlertCircle } from 'lucide-react';

export default function RiskTrustGauges({
  riskScore = 0,
  trustScore = 100,
  severity = 'LOW',
}) {
  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-950/40',
          border: 'border-rose-500/50',
          text: 'text-rose-400',
          bar: 'bg-rose-500',
          glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-950/40',
          border: 'border-orange-500/50',
          text: 'text-orange-400',
          bar: 'bg-orange-500',
          glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-950/40',
          border: 'border-amber-500/50',
          text: 'text-amber-400',
          bar: 'bg-amber-500',
          glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
        };
      default:
        return {
          bg: 'bg-emerald-950/40',
          border: 'border-emerald-500/50',
          text: 'text-emerald-400',
          bar: 'bg-emerald-500',
          glow: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]',
        };
    }
  };

  const sevStyle = getSeverityStyle(severity);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Risk Score Card */}
      <div
        className={`rounded-xl border p-4 bg-slate-900/80 backdrop-blur-sm ${sevStyle.border} ${sevStyle.glow}`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${sevStyle.bg}`}>
              <ShieldAlert className={`w-5 h-5 ${sevStyle.text}`} />
            </div>
            <div>
              <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400">
                Threat Risk Score
              </h4>
              <p className="text-xs text-slate-400">Adversarial & DLP Vulnerability</p>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase border ${sevStyle.bg} ${sevStyle.border} ${sevStyle.text}`}
          >
            {severity}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-4xl font-extrabold font-mono tracking-tight ${sevStyle.text}`}>
            {riskScore}
          </span>
          <span className="text-xs font-mono text-slate-400">/ 100</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ease-out ${sevStyle.bar}`}
            style={{ width: `${Math.min(100, Math.max(0, riskScore))}%` }}
          />
        </div>
      </div>

      {/* Trust Score Card */}
      <div className="rounded-xl border border-slate-800 p-4 bg-slate-900/80 backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.15)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-950/50">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400">
                Trust & Safety Index
              </h4>
              <p className="text-xs text-slate-400">Explainability & Privacy Hygiene</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase border bg-emerald-950/40 border-emerald-500/40 text-emerald-400">
            {trustScore >= 75 ? 'HIGH TRUST' : trustScore >= 45 ? 'MODERATE' : 'UNVERIFIED'}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-extrabold font-mono tracking-tight text-emerald-400">
            {trustScore}
          </span>
          <span className="text-xs font-mono text-slate-400">/ 100</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, trustScore))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

