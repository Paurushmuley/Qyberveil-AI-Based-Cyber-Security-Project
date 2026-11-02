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
} from 'lucide-react';

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

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 border-r border-cyber-border bg-cyber-950 flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        <div className="px-3 pt-2">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">
            Navigation Menu
          </p>
        </div>

        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
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

      {/* Scope Safety Badge */}
      <div className="p-3 rounded-lg border border-cyber-border bg-cyber-900/50 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
          <ShieldAlert className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Active Guardrails</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          SSRF protection active. Unverified private IPs & cloud metadata endpoints are strictly blocked.
        </p>
      </div>
    </aside>
  );
};
