import React from 'react';
import { useAuth } from '../app/AuthContext';
import { Building2, LogOut, Shield, ChevronDown } from 'lucide-react';

export default function Header() {
  const { user, activeOrganization, role, memberships, switchOrganization, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-xs z-10">
      {/* Active Organization */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-sm">
              {activeOrganization?.name || 'My Organization'}
            </span>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
              {activeOrganization?.currency || 'USD'}
            </span>
          </div>
          {memberships && memberships.length > 1 && (
            <select
              value={activeOrganization?._id || ''}
              onChange={(e) => switchOrganization(e.target.value)}
              className="text-xs text-blue-600 bg-transparent cursor-pointer font-medium hover:underline outline-none"
            >
              {memberships.map((m) => (
                <option key={m.id} value={m.organization?._id}>
                  Switch to: {m.organization?.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* User profile & actions */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 justify-end">
            {user?.name}
            {user?.isSuperAdmin && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Shield className="w-3 h-3" /> SuperAdmin
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            {role || 'Staff'} • {user?.email}
          </div>
        </div>

        <div className="h-8 w-px bg-slate-200 mx-1" />

        <button
          onClick={logout}
          title="Sign out"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
