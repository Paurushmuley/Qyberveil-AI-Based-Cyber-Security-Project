import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('security-lead@qyberveil.local');
    setPassword('Qyberveil2026!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-cyber-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <ShieldCheck className="w-7 h-7 text-cyber-950 stroke-[2.5]" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-white font-mono">
              Qyber<span className="text-cyan-400">veil</span>
            </span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-xl font-bold tracking-tight text-white font-mono">
          Security Platform Sign In
        </h2>
        <p className="mt-2 text-center text-xs text-slate-400">
          Discover vulnerabilities. Understand risk. Secure with confidence.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-cyber-900/90 py-8 px-6 shadow-2xl rounded-xl border border-cyber-border sm:px-10 backdrop-blur-md">
          {error && (
            <div className="mb-6 p-3.5 rounded-lg border border-rose-500/30 bg-rose-950/40 text-rose-300 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 font-mono mb-1.5">
                Work Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@organization.com"
                  className="block w-full pl-9 pr-3 py-2 text-xs font-mono bg-cyber-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300 font-mono">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-10 py-2 text-xs font-mono bg-cyber-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-xs font-bold font-mono text-cyber-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Platform</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Account Quick-Fill Card */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="p-3 rounded-lg border border-cyber-border bg-cyber-950/80 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Demo Environment</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  security-lead@qyberveil.local
                </p>
              </div>
              <button
                type="button"
                onClick={fillDemoAccount}
                className="px-2.5 py-1 text-[11px] font-mono rounded border border-cyan-500/40 text-cyan-400 hover:bg-cyan-950/60 transition-colors cursor-pointer"
              >
                Auto-Fill
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-semibold text-cyan-400 hover:text-cyan-300 font-mono">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
