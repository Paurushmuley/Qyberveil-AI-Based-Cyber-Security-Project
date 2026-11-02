import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  Radar,
  GitCompare,
  Sparkles,
  FileText,
  FileCode2,
  Sliders,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Logo } from '../common/Logo';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navigationItems: NavItem[] = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Projects & Targets', to: '/projects', icon: FolderGit2 },
  { name: 'Scans & Scope', to: '/scans', icon: Radar },
  { name: 'Scan Comparison', to: '/scans/compare', icon: GitCompare },
  { name: 'AI Analyst Hub', to: '/ai-analyst', icon: Sparkles },
  { name: 'Security Reports', to: '/reports', icon: FileText },
  { name: 'OpenAPI Importer', to: '/api-importer', icon: FileCode2 },
  { name: 'AI Providers & Settings', to: '/settings/ai', icon: Sliders },
];

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-cyber-950 border-r border-cyber-border p-5 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-250">
        <div className="space-y-6">
          {/* Top Brand Header with Close Button */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <Logo size="sm" showWordmark={true} />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-cyber-900 border border-transparent hover:border-slate-700 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-2">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">
              Platform Navigation
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-cyber-800 text-cyan-400 border border-cyan-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-cyber-850/60'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800/80 text-slate-400">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Scope Safety Guardrails Notice */}
        <div className="p-3 rounded-lg border border-cyber-border bg-cyber-900/60 space-y-2 mt-6">
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
            <ShieldAlert className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Active Scope Guardrails</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
            SSRF protection active. Unverified private IPs & cloud metadata endpoints are strictly blocked.
          </p>
        </div>
      </aside>
    </div>
  );
};
