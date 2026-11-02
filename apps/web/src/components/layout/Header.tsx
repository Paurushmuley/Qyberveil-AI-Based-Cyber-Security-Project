import React, { useState } from 'react';
import { Activity, Terminal, ExternalLink, LogOut, LogIn, UserPlus, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data: health } = useQuery({
    queryKey: ['system-health'],
    queryFn: api.getHealth,
    refetchInterval: 15000,
  });

  const isHealthy = health?.status === 'healthy';
  const isDegraded = health?.status === 'degraded';

  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'SEC';

  return (
    <header className="h-16 border-b border-cyber-border bg-cyber-950/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Mobile Hamburger Menu Toggle (< md) */}
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-cyber-900 border border-transparent hover:border-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5 text-cyan-400" />
          </button>
        )}

        <Link to="/" className="flex items-center">
          <Logo size="sm" showWordmark={true} />
        </Link>
        <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/60 text-slate-300 font-mono ml-2">
          v0.1.0-alpha
        </span>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* System Health Status Indicator */}
        <div className="flex items-center space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-cyber-border bg-cyber-900/60 text-xs font-mono">
          <Activity className="w-3.5 h-3.5 text-slate-400 hidden xs:inline-block" />
          <span className="text-slate-400 hidden sm:inline">Engine:</span>
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                isHealthy
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : isDegraded
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
              }`}
            />
            <span
              className={`text-[11px] sm:text-xs ${
                isHealthy
                  ? 'text-emerald-400 font-medium'
                  : isDegraded
                  ? 'text-amber-400 font-medium'
                  : 'text-rose-400 font-medium'
              }`}
            >
              {health?.status ? health.status.toUpperCase() : '...'}
            </span>
          </div>
        </div>

        {/* Documentation / Health link */}
        <a
          href="/health"
          target="_blank"
          rel="noreferrer"
          title="Core Engine Health Status"
          className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-cyber-border hover:border-slate-600 bg-cyber-900/40 hover:bg-cyber-800/50 text-xs text-slate-300 transition-colors font-mono"
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">API</span>
          <ExternalLink className="w-3 h-3 text-slate-500 hidden sm:inline" />
        </a>

        {/* User Account Controls */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1 rounded-lg hover:bg-cyber-900/70 transition-colors cursor-pointer border border-transparent hover:border-cyber-border"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 border border-cyan-500/50 flex items-center justify-center text-xs font-bold text-cyan-300 font-mono shadow-sm">
                {userInitials}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-medium text-slate-200 font-mono leading-none">
                  {user.name || user.email.split('@')[0]}
                </p>
                <p className="text-[10px] text-cyan-400 font-mono leading-tight mt-0.5">
                  {user.role}
                </p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-52 sm:w-56 rounded-xl border border-cyber-border bg-cyber-900/95 backdrop-blur-md shadow-2xl py-2 z-50 font-mono"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="px-4 py-2 border-b border-slate-800 text-xs space-y-0.5">
                  <p className="text-slate-400 text-[10px]">Signed in as</p>
                  <p className="font-semibold text-white truncate text-xs">{user.email}</p>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                    {user.role}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <Link
              to="/login"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-cyber-900/40 hover:bg-cyber-800/60 text-xs text-slate-300 hover:text-white transition-colors font-mono"
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xs:inline">Sign In</span>
            </Link>
            <Link
              to="/register"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-xs font-bold font-mono text-cyber-950 shadow-sm transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Register</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
