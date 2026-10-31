import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { ShieldCheck, AlertCircle, Loader2, ArrowRight, Check } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('analyst');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await signUp({
        email,
        password,
        fullName: fullName || 'Security Analyst',
        organization: organization || 'Enterprise Security',
      });
      if (res?.session) {
        navigate('/dashboard');
      } else {
        setError(
          'Account created! If email confirmation is enabled in your Supabase project, please check your inbox to confirm, or sign in now.'
        );
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 cyber-grid">
      <div className="max-w-md w-full space-y-6 bg-slate-900/90 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
            Create Security Profile
          </h2>
          <p className="mt-2 text-xs font-mono text-slate-400">
            Provision access to the AI Security & Trust Command Center
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-500/50 flex items-start gap-2.5 text-xs font-mono text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="fullName"
              className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase"
            >
              Full Name / Operator ID
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dr. Rajesh Patel"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="organization"
                className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase"
              >
                Organization
              </label>
              <input
                id="organization"
                type="text"
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="FinTech Corp"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
            <div>
              <label
                htmlFor="role"
                className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase"
              >
                Security Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              >
                <option value="analyst">Security Analyst</option>
                <option value="auditor">Privacy Auditor</option>
                <option value="admin">SecOps Admin</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-mono font-medium text-slate-300 mb-1.5 uppercase"
            >
              Enterprise Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rajesh.patel@fintech.in"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-mono font-medium text-slate-300 uppercase"
              >
                Password
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                Min 6 chars
              </span>
            </div>
            <PasswordInput
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />

            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        step <= strength
                          ? strength >= 3
                            ? 'bg-emerald-500'
                            : strength === 2
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Strength</span>
                  <span
                    className={
                      strength >= 3
                        ? 'text-emerald-400'
                        : strength === 2
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }
                  >
                    {strength >= 3 ? 'Strong' : strength === 2 ? 'Medium' : 'Weak'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-mono text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>PROVISIONING WORKSPACE...</span>
              </>
            ) : (
              <>
                <span>PROVISION SECURE ACCOUNT</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800">
          <p className="text-xs font-mono text-slate-400">
            Already have an active credential?{' '}
            <Link
              to="/login"
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 ml-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

