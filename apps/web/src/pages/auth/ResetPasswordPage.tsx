import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Key, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/common/Logo';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const queryToken = searchParams.get('token');
    if (queryToken) {
      setToken(queryToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!token.trim()) {
      setError('Reset token is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await resetPassword(token.trim(), newPassword);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The token may be expired or invalid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-950 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <Link to="/">
            <Logo size="lg" showWordmark={true} />
          </Link>
        </div>
        <h2 className="mt-6 text-center text-xl font-bold tracking-tight text-white font-mono">
          Set New Security Password
        </h2>
        <p className="mt-2 text-center text-xs text-slate-400">
          Enter your reset token and define a new secure password
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 w-full">
        <div className="bg-cyber-900/90 py-6 sm:py-8 px-5 sm:px-10 shadow-2xl rounded-xl border border-cyber-border backdrop-blur-md">
          {error && (
            <div className="mb-6 p-3.5 rounded-lg border border-rose-500/30 bg-rose-950/40 text-rose-300 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage ? (
            <div className="space-y-5">
              <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-xs flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-200">Password Successfully Updated</p>
                  <p className="text-slate-300 leading-relaxed">{successMessage}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg shadow-md text-xs font-bold font-mono text-cyber-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 transition-all cursor-pointer"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-medium text-slate-300 font-mono mb-1.5">
                  Reset Token
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste 64-character token"
                    className="block w-full pl-9 pr-3 py-2 text-xs font-mono bg-cyber-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 font-mono mb-1.5">
                  New Password (min 8 characters)
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

              <div>
                <label className="block text-xs font-medium text-slate-300 font-mono mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-9 pr-3 py-2 text-xs font-mono bg-cyber-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 px-4 mt-2 border border-transparent rounded-lg shadow-md text-xs font-bold font-mono text-cyber-950 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Updating Password...</span>
                ) : (
                  <>
                    <span>Confirm & Reset Password</span>
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>

              <div className="mt-4 text-center">
                <Link to="/login" className="text-xs text-slate-400 hover:text-slate-200 font-mono">
                  Cancel & Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
