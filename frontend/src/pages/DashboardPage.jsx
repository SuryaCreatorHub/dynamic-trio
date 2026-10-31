import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/apiClient.js';
import {
  ShieldAlert,
  ShieldCheck,
  BotMessageSquare,
  Lock,
  ScanSearch,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalScans: 0,
    totalPiiRedacted: 0,
    avgTrustScore: 0,
    avgRiskScore: 0,
    severityBreakdown: [
      { name: 'Low', severity: 'LOW', count: 0, color: '#10B981' },
      { name: 'Medium', severity: 'MEDIUM', count: 0, color: '#F59E0B' },
      { name: 'High', severity: 'HIGH', count: 0, color: '#F97316' },
      { name: 'Critical', severity: 'CRITICAL', count: 0, color: '#EF4444' },
    ],
    trustTrend: [],
    recentItems: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/api/dashboard/stats');
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
      setError(err.message || 'Unable to connect to telemetry backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <h1 className="text-2xl font-extrabold font-mono tracking-tight text-slate-100">
              Security & Trust Command Center
            </h1>
          </div>
          <p className="mt-1 text-xs font-mono text-slate-400">
            Real-time telemetry, threat posture & DLP redaction analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Telemetry</span>
          </button>
          <Link
            to="/scanner"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
          >
            <ScanSearch className="w-4 h-4" />
            <span>New Security Scan</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center justify-between text-xs font-mono text-rose-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={fetchStats} className="underline hover:text-white">
            Retry
          </button>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Scans */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Total Security Scans
            </span>
            <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
              <ScanSearch className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-100">
              {stats.totalScans}
            </span>
            <span className="text-xs font-mono text-slate-400">audits run</span>
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <span>Persisted in PostgreSQL</span>
          </div>
        </div>

        {/* Card 2: Active Conversations */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Copilot Conversations
            </span>
            <div className="p-2 rounded-lg bg-slate-800 text-purple-400">
              <BotMessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-100">
              {stats.totalConversations}
            </span>
            <span className="text-xs font-mono text-slate-400">threads</span>
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <span>Real-time status active</span>
          </div>
        </div>

        {/* Card 3: PII Redacted */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              PII Entities Redacted
            </span>
            <div className="p-2 rounded-lg bg-slate-800 text-emerald-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-400">
              {stats.totalPiiRedacted}
            </span>
            <span className="text-xs font-mono text-slate-400">tokens masked</span>
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <span>DPDP & GDPR DLP Shield</span>
          </div>
        </div>

        {/* Card 4: Avg Trust Score */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Avg Trust Index
            </span>
            <div className="p-2 rounded-lg bg-slate-800 text-teal-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-teal-400">
              {stats.avgTrustScore}
            </span>
            <span className="text-xs font-mono text-slate-400">/ 100</span>
          </div>
          <div className="mt-3 text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <span>Avg Risk: {stats.avgRiskScore}/100</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider">
                Threat Severity Distribution
              </h3>
              <p className="text-xs text-slate-400">Breakdown of inspected payloads by risk severity</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {stats.totalScans === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
                <ScanSearch className="w-8 h-8 mb-2 opacity-40" />
                <span>No scan data recorded yet. Run your first audit.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.severityBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats.severityBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Trust Score Trend AreaChart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider">
                Trust & Risk Score Timeline
              </h3>
              <p className="text-xs text-slate-400">Sequential trajectory across completed scans</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {stats.trustTrend.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
                <Activity className="w-8 h-8 mb-2 opacity-40" />
                <span>Timeline will populate as security audits are executed.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trustTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trustGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="trustScore"
                    name="Trust Index"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#trustGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="riskScore"
                    name="Risk Score"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#riskGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Quick Launch & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Launch Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Quick Actions
          </h3>

          <Link
            to="/scanner"
            className="block p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-emerald-500/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-mono font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                    Threat & Prompt Scan
                  </h4>
                  <p className="text-xs text-slate-400">Inspect inputs for injections & attacks</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-all transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/scanner"
            className="block p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-emerald-500/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-mono font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                    PII Redaction Shield
                  </h4>
                  <p className="text-xs text-slate-400">Mask credentials, PAN, Aadhaar & PII</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-all transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/copilot"
            className="block p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-emerald-500/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
                  <BotMessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-mono font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                    AI Security Copilot
                  </h4>
                  <p className="text-xs text-slate-400">Multi-turn defensive AI consultation</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-all transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Recent Items Activity Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Recent Telemetry Stream
            </h3>
            <Link
              to="/history"
              className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View All History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.recentItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <span>No telemetry activity logged yet.</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 overflow-hidden">
              {stats.recentItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="py-3 flex items-center justify-between gap-4 text-xs font-mono"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`p-1.5 rounded-lg ${
                        item.type === 'scan'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                          : 'bg-purple-950/60 text-purple-400 border border-purple-500/30'
                      }`}
                    >
                      {item.type === 'scan' ? (
                        <ScanSearch className="w-3.5 h-3.5" />
                      ) : (
                        <BotMessageSquare className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <div className="truncate">
                      <div className="font-semibold text-slate-200 truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-500">{item.domain}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {item.severity && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-400 border border-rose-500/40'
                            : item.severity === 'HIGH'
                            ? 'bg-orange-950 text-orange-400 border border-orange-500/40'
                            : item.severity === 'MEDIUM'
                            ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                        }`}
                      >
                        {item.severity}
                      </span>
                    )}
                    <span className="text-slate-500 text-[11px]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

