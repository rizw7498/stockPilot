import React from "react";
import { useAuth } from "../app/AuthContext";
import { useTheme } from "../app/ThemeContext";
import {
  User,
  Shield,
  Building2,
  Mail,
  Palette,
  Check,
  LogOut,
  Boxes,
  Key,
  ShieldCheck,
  Calendar,
  Sun,
  Moon,
} from 'lucide-react';
import Drawer from "./ui/Drawer";
import Button from "./ui/Button";

export default function ProfileDrawer({ isOpen, onClose }) {
  const { user, activeOrganization, role, memberships, switchOrganization, logout } = useAuth();
  const { theme, setTheme, themes, mode, setMode } = useTheme();

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-md"
      title="User Profile & Workspace"
      subtitle="Operational identity, organization memberships, and preferences"
      footer={
        <div className="w-full flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            StockPilot v2.4
          </span>
          <Button
            variant="danger"
            size="sm"
            icon={LogOut}
            onClick={() => {
              onClose();
              logout();
            }}
          >
            Sign Out
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* User Card */}
        <div className="p-4 rounded-xl glass-3 border border-white/10 space-y-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-base shadow-inner shrink-0">
              {userInitials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 text-[15px] truncate">
                  {user?.name}
                </span>
                {user?.isSuperAdmin && (
                  <span className="bg-amber-500/10 text-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-amber-500/20 flex items-center gap-0.5 shrink-0">
                    <Shield className="w-2.5 h-2.5" /> SuperAdmin
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono truncate mt-0.5">
                {user?.email}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-mono uppercase block">
                Assigned Role
              </span>
              <span className="font-semibold text-slate-200">
                {role || "Operator"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-mono uppercase block">
                Security Status
              </span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Active Session
              </span>
            </div>
          </div>
        </div>

        {/* Current Workspace / Organization */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1">
            Current Workspace
          </div>

          <div className="p-4 rounded-xl glass-3 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-100">
                    {activeOrganization?.name || "Workspace"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Currency: {activeOrganization?.currency || "USD"}
                  </div>
                </div>
              </div>

              <span className="mono-chip text-[10px] text-blue-400 font-bold">
                {activeOrganization?.currency || "USD"}
              </span>
            </div>

            {memberships && memberships.length > 1 && (
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <div className="text-[10px] text-slate-400 font-medium">
                  Switch Tenant Workspace:
                </div>
                <div className="space-y-1">
                  {memberships.map((m) => {
                    const isCurrent =
                      m.organization?._id === activeOrganization?._id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => switchOrganization(m.organization?._id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isCurrent
                            ? "bg-blue-500/20 text-blue-300 font-medium"
                            : "text-slate-300 hover:bg-white/5"
                        }`}
                      >
                        <span className="truncate">{m.organization?.name}</span>
                        {isCurrent && (
                          <Check className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Theme Mode & Color Accent */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-slate-400" />
            <span>Theme & Atmosphere</span>
          </div>

          <div className="p-4 rounded-xl glass-3 border border-white/10 space-y-4">
            {/* Dark / Light Mode Segment */}
            <div>
              <div className="text-xs text-slate-400 mb-2">Display Mode</div>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-black/20 border border-white/5">
                <button
                  type="button"
                  onClick={() => setMode('dark')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                    mode === 'dark'
                      ? 'bg-white/15 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Dark Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('light')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                    mode === 'light'
                      ? 'bg-white/15 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span>Light Mode</span>
                </button>
              </div>
            </div>

            {/* Accent Color Swatches */}
            <div>
              <p className="text-xs text-slate-400 mb-2">Accent Palette</p>
              <div className="grid grid-cols-2 gap-2">
                {themes.map((t) => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheme(t.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-white/30 bg-white/10 text-white font-semibold shadow-xs'
                          : 'border-white/5 bg-white/[0.02] text-slate-300 hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: t.color }}
                        />
                        <span className="text-[12px]">{t.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-100" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Session Management & Logout Card */}
        <div className="p-4 rounded-xl glass-3 border border-rose-500/20 bg-rose-500/[0.03] space-y-3">
          <div>
            <div className="text-xs font-semibold text-rose-300 flex items-center gap-2">
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Session Management</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Securely end your active operator session on this device.
            </p>
          </div>

          <Button
            variant="danger"
            size="md"
            icon={LogOut}
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full"
          >
            Sign Out of Account
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
