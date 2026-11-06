import React, { useState } from 'react';
import { useAuth } from '../app/AuthContext';
import { Building2, LogOut, Shield, Search, Command, ChevronDown } from 'lucide-react';

export default function Header({ onOpenCommandPalette }) {
  const { user, activeOrganization, role, memberships, switchOrganization, logout } = useAuth();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="h-16 glass-1 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 border-b border-white/10">
      {/* Left: Workspace Identity & Tenant Switcher */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div
            onClick={() => memberships && memberships.length > 1 && setShowOrgDropdown(!showOrgDropdown)}
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/[0.03] transition-colors ${
              memberships && memberships.length > 1 ? 'cursor-pointer hover:bg-white/10' : ''
            }`}
          >
            <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-200 text-xs tracking-tight">
              {activeOrganization?.name || 'Workspace'}
            </span>
            <span className="mono-chip text-[10px] text-slate-400">
              {activeOrganization?.currency || 'USD'}
            </span>
            {memberships && memberships.length > 1 && (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            )}
          </div>

          {/* Org Switcher Popover */}
          {showOrgDropdown && memberships && memberships.length > 1 && (
            <div className="absolute top-full left-0 mt-2 w-60 glass-overlay rounded-xl border border-white/10 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-2 py-1">
                Switch Organization
              </div>
              <div className="space-y-1 mt-1">
                {memberships.map((m) => {
                  const isCurrent = m.organization?._id === activeOrganization?._id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        switchOrganization(m.organization?._id);
                        setShowOrgDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-blue-500/20 text-blue-300 font-medium'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">{m.organization?.name}</span>
                      {isCurrent && <span className="text-[10px] text-blue-400 font-mono">Active</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle: Omnisearch bar trigger */}
      <div
        onClick={onOpenCommandPalette}
        className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg glass-3 border border-white/10 text-slate-400 w-80 text-xs hover:border-white/20 cursor-pointer transition-all group"
      >
        <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
        <span className="flex-1 text-slate-500 group-hover:text-slate-300 text-[12px] truncate">
          Quick search or jump to...
        </span>
        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400">
          <Command className="w-2.5 h-2.5" /> K
        </span>
      </div>

      {/* Right: User Profile & Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold text-[11px]">
            {userInitials}
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-[12px] font-semibold text-slate-200 flex items-center gap-1.5 justify-end">
              <span>{user?.name}</span>
              {user?.isSuperAdmin && (
                <span className="bg-amber-500/10 text-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-amber-500/20 flex items-center gap-0.5">
                  <Shield className="w-2.5 h-2.5" /> SuperAdmin
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              {role || 'Operator'}
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-white/10 mx-1" />

        <button
          type="button"
          onClick={logout}
          title="Sign out"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors cursor-pointer border border-transparent hover:border-rose-500/20"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
