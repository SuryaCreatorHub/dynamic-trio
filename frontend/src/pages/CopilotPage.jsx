import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/apiClient.js';
import { supabase } from '../lib/supabaseClient.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ReactMarkdown from 'react-markdown';
import {
  BotMessageSquare,
  Plus,
  Send,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Copy,
  Check,
  Sparkles,
  MessageSquare,
  Trash2,
  ChevronRight,
} from 'lucide-react';

const DOMAIN_OPTIONS = [
  { code: 'PROMPT_SECURITY', label: 'Prompt Injection & Jailbreak Defense' },
  { code: 'PII_PRIVACY_SHIELD', label: 'PII, Credentials & Data Privacy DLP' },
  { code: 'PHISHING_FRAUD', label: 'Phishing, Social Engineering & Fraud' },
  { code: 'AI_TRUST_GOVERNANCE', label: 'AI Model Trust, Bias & Governance' },
  { code: 'CODE_VULNERABILITY', label: 'Application & API Security Audit' },
  { code: 'COMPLIANCE_AUDIT', label: 'Regulatory & Privacy Compliance' },
];

export default function CopilotPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('PROMPT_SECURITY');
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'generating' | 'completed' | 'failed'
  const [loadingConv, setLoadingConv] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, status]);

  // 1. Fetch conversations list
  const loadConversations = async () => {
    try {
      const data = await api.get('/api/conversations');
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // 2. Fetch active conversation details & messages when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setActiveConv(null);
      setMessages([]);
      setStatus('idle');
      return;
    }

    const fetchActiveConversation = async () => {
      try {
        setLoadingConv(true);
        const data = await api.get(`/api/conversations/${conversationId}`);
        setActiveConv(data.conversation);
        setSelectedDomain(data.conversation.domain || 'PROMPT_SECURITY');
        setMessages(data.messages || []);
        setStatus(data.conversation.status || 'completed');
      } catch (err) {
        console.error('Failed to fetch conversation:', err);
      } finally {
        setLoadingConv(false);
      }
    };

    fetchActiveConversation();

    // 3. Set up Supabase Realtime listener on this conversation
    const channel = supabase
      .channel(`public:conversations:id=eq.${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.new) {
            setActiveConv(payload.new);
            setStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Create new conversation
  const handleCreateNewConversation = async () => {
    try {
      setStatus('sending');
      const data = await api.post('/api/conversations', {
        title: 'New Security Advisory',
        domain: selectedDomain,
      });
      await loadConversations();
      navigate(`/copilot/${data.conversation.id}`);
      setStatus('idle');
    } catch (err) {
      console.error('Failed to create new conversation:', err);
      setStatus('failed');
    }
  };

  // Send message
  const handleSendMessage = async (e, textToSend) => {
    if (e) e.preventDefault();
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim()) return;

    let targetConvId = conversationId;

    try {
      setStatus('sending');

      // If no conversation currently open, create one first
      if (!targetConvId) {
        const newConv = await api.post('/api/conversations', {
          title: prompt.slice(0, 40),
          domain: selectedDomain,
        });
        targetConvId = newConv.conversation.id;
        navigate(`/copilot/${targetConvId}`, { replace: true });
      }

      // Optimistically append user message
      const tempUserMsg = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: prompt,
        status: 'completed',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUserMsg]);
      setInputPrompt('');

      // Status transition to generating
      setTimeout(() => {
        setStatus('generating');
      }, 300);

      const res = await api.post(`/api/conversations/${targetConvId}/messages`, {
        content: prompt,
        domain: selectedDomain,
      });

      // Update state with actual assistant message
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        res.userMessage,
        res.assistantMessage,
      ]);
      setActiveConv(res.conversation);
      setStatus('completed');
      loadConversations();
    } catch (err) {
      console.error('Send message error:', err);
      setStatus('failed');
    }
  };

  const copyToClipboard = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8.5rem)]">
        {/* Left Sidebar: Saved Conversations */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BotMessageSquare className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Security Copilot Threads
              </h2>
            </div>
            <button
              onClick={handleCreateNewConversation}
              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 transition-colors"
              title="New Advisory Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-mono text-xs">
                <span>No saved conversations yet.</span>
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = c.id === conversationId;
                return (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/copilot/${c.id}`)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer text-xs font-mono flex items-center justify-between group ${
                      isSelected
                        ? 'bg-slate-800/90 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="font-semibold truncate">{c.title}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{c.domain}</span>
                        <span>•</span>
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 flex-shrink-0 transition-transform ${
                        isSelected
                          ? 'text-emerald-400 translate-x-0.5'
                          : 'text-slate-600 group-hover:text-slate-400'
                      }`}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Viewport: Chat stream */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
          {/* Top Chat Bar */}
          <div className="px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-slate-200">
                  {activeConv?.title || 'Interactive AI Security & Trust Copilot'}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[10px] font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                  >
                    {DOMAIN_OPTIONS.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={status} size="sm" />
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <BotMessageSquare className="w-7 h-7" />
                </div>
                <div className="max-w-md">
                  <h4 className="text-sm font-mono font-bold text-slate-200">
                    SentinelTrust Defensive Copilot
                  </h4>
                  <p className="mt-1 text-xs font-mono text-slate-400 leading-relaxed">
                    Ask questions on AI security architectures, sanitize suspicious prompts, or
                    audit compliance with India DPDP Act 2023 & OWASP Top 10 for LLMs.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-lg w-full pt-2">
                  {[
                    'How do I sanitize inputs to prevent indirect prompt injection?',
                    'What are the mandatory DPDP Act 2023 LLM audit requirements?',
                    'Explain OWASP LLM06 Sensitive Information Disclosure.',
                    'Provide a secure Python regex pattern for Aadhaar & PAN masking.',
                  ].map((presetPrompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(null, presetPrompt)}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-950 hover:border-emerald-500/40 text-[11px] font-mono text-slate-300 text-left transition-all"
                    >
                      "{presetPrompt}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const meta = msg.metadata || {};

                return (
                  <div
                    key={msg.id || index}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs font-mono leading-relaxed shadow-lg ${
                        isUser
                          ? 'bg-emerald-600 text-slate-950 font-medium rounded-tr-none'
                          : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none space-y-3'
                      }`}
                    >
                      {/* Message Content */}
                      {isUser ? (
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      ) : (
                        <div className="prose prose-invert prose-xs max-w-none space-y-2">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>

                          {/* Security Tags Pill List */}
                          {meta.detectedFlags && meta.detectedFlags.length > 0 && (
                            <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
                              {meta.detectedFlags.map((flag, fIdx) => (
                                <span
                                  key={fIdx}
                                  className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                                >
                                  {flag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Clickable Follow-up Chips */}
                          {meta.suggestedFollowUps && meta.suggestedFollowUps.length > 0 && (
                            <div className="pt-2 space-y-1.5">
                              <span className="text-[10px] font-mono text-slate-500 uppercase">
                                Suggested Follow-ups:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {meta.suggestedFollowUps.map((chip, cIdx) => (
                                  <button
                                    key={cIdx}
                                    onClick={() => handleSendMessage(null, chip)}
                                    className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 transition-colors text-left"
                                  >
                                    → {chip}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 px-1 text-[10px] font-mono text-slate-500">
                      <span>{isUser ? 'You' : 'SentinelTrust AI'}</span>
                      <span>•</span>
                      <span>{new Date(msg.created_at || Date.now()).toLocaleTimeString()}</span>
                      {!isUser && (
                        <button
                          onClick={() => copyToClipboard(msg.content, index)}
                          className="hover:text-emerald-400 ml-1"
                          title="Copy response"
                        >
                          {copiedIndex === index ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Input Form */}
          <form
            onSubmit={(e) => handleSendMessage(e, null)}
            className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask an AI governance question, paste suspicious logs, or audit code..."
              disabled={status === 'sending' || status === 'generating'}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={
                !inputPrompt.trim() || status === 'sending' || status === 'generating'
              }
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all disabled:opacity-40 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              {status === 'generating' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

