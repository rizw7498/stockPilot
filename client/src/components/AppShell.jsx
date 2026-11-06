import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import CommandPalette from './ui/CommandPalette';

export default function AppShell() {
  const { user, loading } = useAuth();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    function handleGlobalKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#070B14] text-slate-500 dark:text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
          Loading StockPilot...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen text-slate-900 dark:text-slate-100 overflow-hidden font-sans relative app-atmosphere">
      {/* SVG Grain Overlay */}
      <div className="app-grain" />

      {/* Navigation Rail / Sidebar */}
      <Sidebar />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <Header onOpenCommandPalette={() => setCommandPaletteOpen(true)} />

        <main className="flex-1 overflow-y-auto lg:overflow-hidden px-6 py-4 max-w-[1440px] w-full mx-auto flex flex-col min-h-0">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
