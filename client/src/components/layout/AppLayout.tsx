import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header.js';
import { Sidebar } from './Sidebar.js';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
