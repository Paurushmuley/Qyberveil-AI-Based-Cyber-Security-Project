import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle, Copy, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await forgotPassword(email);
      setResultMessage(res.message);
      if (res.resetToken) {
        setGeneratedToken(res.resetToken);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process password reset request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <Link to="/">
            <Logo size="lg" showWordmark={true} />
          </Link>
        </div>
        <h2 className="mt-6 text-center text-xl font-bold tracking-tight text-white font-mono">
          Recover Platform Access
        </h2>
        <p className="mt-2 text-center text-xs text-slate-400">
          Enter your registered email address to receive secure reset instructions
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

          {resultMessage ? (
            <div className="space-y-5">
              <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-200">Reset Instructions Generated</p>
                  <p className="text-slate-300 leading-relaxed">{resultMessage}</p>
                </div>
              </div>

              {generatedToken && (
                <div className="p-3.5 rounded-lg border border-cyan-500/30 bg-cyan-950/40 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-cyan-300 font-mono">
                    <span className="flex items-center space-x-1.5">
                      <Key className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Security Reset Token:</span>
                    </span>
                    <button
                      type="button"
                      onClick={copyToken}
                      className="flex items-center space-x-1 text-[11px] text-cyan-400 hover:text-cyan-200 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] font-mono break-all bg-cyber-950 p-2 rounded border border-slate-700 text-slate-300">
                    {generatedToken}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/reset-password?token=${generatedToken}`)}
                    className="w-full flex items-center justify-center py-2 px-3 text-xs font-mono font-bold text-cyber-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors cursor-pointer"
                  >
                    <span>Proceed to Reset Password</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </button>
                </div>
              )}

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full flex justify-center items-center py-2 px-4 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-mono text-slate-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium text-slate-300 font-mono mb-1.5">
                  Registered Email Address
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-xs font-bold font-mono text-cyber-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Generating Token...</span>
                ) : (
                  <>
                    <span>Generate Reset Instructions</span>
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors font-mono"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
