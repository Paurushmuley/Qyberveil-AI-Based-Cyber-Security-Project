import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  Radar,
  Sliders,
  Menu,
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMore: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMore }) => {
  const quickLinks = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Projects', to: '/projects', icon: FolderGit2 },
    { name: 'Scans', to: '/scans', icon: Radar },
    { name: 'AI Settings', to: '/settings/ai', icon: Sliders },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-cyber-950/95 backdrop-blur-md border-t border-cyber-border px-2 py-1.5 flex items-center justify-around safe-area-bottom shadow-lg">
      {quickLinks.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-mono transition-colors ${
                isActive
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-md ${isActive ? 'bg-cyan-500/10' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="mt-0.5">{item.name}</span>
              </>
            )}
          </NavLink>
        );
      })}

      {/* Menu / More button */}
      <button
        type="button"
        onClick={onOpenMore}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-mono text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        aria-label="Open full menu"
      >
        <div className="p-1 rounded-md">
          <Menu className="w-5 h-5 text-slate-400" />
        </div>
        <span className="mt-0.5">More</span>
      </button>
    </nav>
  );
};
