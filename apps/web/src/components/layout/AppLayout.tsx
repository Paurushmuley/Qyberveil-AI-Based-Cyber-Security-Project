import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileNavDrawer } from './MobileNavDrawer';
import { MobileBottomNav } from './MobileBottomNav';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-cyber-900 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

      {/* Slide-over Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Persistent Desktop Sidebar */}
        <div className="hidden md:flex shrink-0">
          <Sidebar />
        </div>

        {/* Responsive Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Persistent Bottom Bar on Small Screens */}
      <MobileBottomNav onOpenMore={() => setMobileMenuOpen(true)} />
    </div>
  );
};
