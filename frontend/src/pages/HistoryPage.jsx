import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/apiClient.js';
import {
  History,
  ScanSearch,
  BotMessageSquare,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Lock,
  AlertCircle,
  Eye,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scans'); // 'scans' | 'conversations'
  const [scans, setScans] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected scan for detail view modal
  const [detailScan, setDetailScan] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [scansData, convData] = await Promise.all([
        api.get('/api/scans'),
        api.get('/api/conversations'),
      ]);
      setScans(scansData.scans || []);
      setConversations(convData.conversations || []);
    } catch (err) {
      console.error('Failed to load history items:', err);
      setError(err.message || 'Could not retrieve audit history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteScan = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this security scan from the audit log?')) {
      return;
    }
    try {
      await api.delete(`/api/scans/${id}`);
      setScans((prev) => prev.filter((s) => s.id !== id));
      if (detailScan?.id === id) setDetailScan(null);
    } catch (err) {
      console.error('Delete scan failed:', err);
      alert('Failed to delete scan record.');
    }
  };

  const handleDeleteConversation = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this Copilot conversation?')) {
      return;
    }
    try {
      await api.delete(`/api/conversations/${id}`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Delete conversation failed:', err);
      alert('Failed to delete conversation.');
    }
  };

  // Filter scans
  const filteredScans = scans.filter((s) => {
    const matchesSearch =
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.redacted_output?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      selectedSeverity === 'ALL' || s.severity === selectedSeverity;

    return matchesSearch && matchesSeverity;
  });

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    return (
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.domain?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl font-extrabold font-mono tracking-tight text-slate-100">
              Audit Trail & Conversation History
            </h1>
          </div>
          <p className="mt-1 text-xs font-mono text-slate-400">
            Immutable log of security inspections, DLP redactions & Copilot sessions
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setActiveTab('scans')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'scans'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ScanSearch className="w-4 h-4" />
            <span>Security Scans ({scans.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'conversations'
                ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BotMessageSquare className="w-4 h-4" />
            <span>Copilot Chats ({conversations.length})</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center gap-2 text-xs font-mono text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keyword, domain, or payload..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {activeTab === 'scans' && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Severities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Security Scans List */}
      {activeTab === 'scans' && (
        <div className="space-y-3">
          {filteredScans.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-xs font-mono text-slate-500">
              <ScanSearch className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <span>No matching security scans found in audit trail.</span>
            </div>
          ) : (
            filteredScans.map((scan) => (
              <div
                key={scan.id}
                onClick={() => setDetailScan(scan)}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900 hover:border-emerald-500/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                        scan.severity === 'CRITICAL'
                          ? 'bg-rose-950/80 text-rose-400 border-rose-500/40'
                          : scan.severity === 'HIGH'
                          ? 'bg-orange-950/80 text-orange-400 border-orange-500/40'
                          : scan.severity === 'MEDIUM'
                          ? 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                          : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                      }`}
                    >
                      {scan.severity}
                    </span>
                    <h3 className="text-sm font-mono font-bold text-slate-100 group-hover:text-emerald-400 transition-colors truncate">
                      {scan.title}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
                    <span>Domain: {scan.domain}</span>
                    <span>•</span>
                    <span>Framework: {scan.compliance_framework}</span>
                    <span>•</span>
                    <span className="text-slate-400">
                      {new Date(scan.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase">Risk</div>
                      <div
                        className={`font-bold ${
                          scan.risk_score >= 60 ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {scan.risk_score} / 100
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase">Trust</div>
                      <div className="font-bold text-teal-400">{scan.trust_score} / 100</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailScan(scan);
                      }}
                      className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteScan(e, scan.id)}
                      className="p-2 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Copilot Conversations List */}
      {activeTab === 'conversations' && (
        <div className="space-y-3">
          {filteredConversations.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-xs font-mono text-slate-500">
              <BotMessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <span>No Copilot conversations found.</span>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => navigate(`/copilot/${conv.id}`)}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-900 hover:border-purple-500/30 transition-all cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div className="space-y-1 min-w-0">
                  <h3 className="text-sm font-mono font-bold text-slate-100 group-hover:text-purple-400 transition-colors truncate">
                    {conv.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span>Domain: {conv.domain}</span>
                    <span>•</span>
                    <span>Status: {conv.status}</span>
                    <span>•</span>
                    <span className="text-slate-400">
                      {new Date(conv.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate(`/copilot/${conv.id}`)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-500/30 hover:bg-purple-900/60 text-xs font-mono transition-colors"
                  >
                    <span>Open Chat</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="p-2 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 transition-colors"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Scan Detail Modal */}
      {detailScan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2">
                <ScanSearch className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 truncate">{detailScan.title}</h3>
              </div>
              <button
                onClick={() => setDetailScan(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500">DOMAIN</span>
                  <div className="font-bold text-slate-200 truncate">{detailScan.domain}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">FRAMEWORK</span>
                  <div className="font-bold text-slate-200">{detailScan.compliance_framework}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">RISK SCORE</span>
                  <div className="font-bold text-rose-400">{detailScan.risk_score} / 100</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">TRUST INDEX</span>
                  <div className="font-bold text-emerald-400">{detailScan.trust_score} / 100</div>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">
                  Redacted & Sanitized Output:
                </label>
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                  {detailScan.redacted_output}
                </pre>
              </div>

              {detailScan.analysis_report?.executiveSummary && (
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Executive Summary:</label>
                  <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
                    {detailScan.analysis_report.executiveSummary}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center">
              <span className="text-slate-500 text-[11px]">
                Audited on {new Date(detailScan.created_at).toLocaleString()}
              </span>
              <button
                onClick={() => setDetailScan(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

