import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  Truck,
  Users,
  Building2,
  FileText,
  DollarSign,
  RotateCcw,
  BarChart3,
  ShieldCheck,
  UserPlus,
  History,
  Warehouse,
  ArrowLeftRight,
  PanelLeftClose,
  PanelLeft,
  Settings,
} from 'lucide-react';
import { useAuth } from '../app/AuthContext';
import Tooltip from './ui/Tooltip';

export default function Sidebar() {
  const { role, user, activeOrganization } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin || role === 'Super Admin';

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('stockpilot_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('stockpilot_sidebar_collapsed', isCollapsed);
  }, [isCollapsed]);

  const navGroups = [
    {
      title: 'Overview',
      items: [{ label: 'Dashboard', path: '/', icon: LayoutDashboard }],
    },
    {
      title: 'Catalog',
      items: [
        { label: 'Products', path: '/products', icon: Package },
        { label: 'Categories', path: '/categories', icon: Layers },
        { label: 'Warehouses', path: '/warehouses', icon: Warehouse },
      ],
    },
    {
      title: 'Inventory',
      items: [
        { label: 'Stock Overview', path: '/inventory', icon: Boxes },
        { label: 'Stock Transfers', path: '/transfers', icon: ArrowLeftRight },
      ],
    },
    {
      title: 'Purchasing',
      items: [
        { label: 'Purchase Orders', path: '/purchases', icon: Truck },
        { label: 'Suppliers', path: '/suppliers', icon: Building2 },
      ],
    },
    {
      title: 'Sales & Finance',
      items: [
        { label: 'Sales Orders', path: '/sales', icon: FileText },
        { label: 'Customers', path: '/customers', icon: Users },
        { label: 'Invoices', path: '/invoices', icon: FileText },
        { label: 'Payments', path: '/payments', icon: DollarSign },
      ],
    },
    {
      title: 'Returns',
      items: [{ label: 'Returns & RMAs', path: '/returns', icon: RotateCcw }],
    },
    {
      title: 'Analytics',
      items: [{ label: 'Valuation & Reports', path: '/reports', icon: BarChart3 }],
    },
    {
      title: 'Administration',
      items: [
        { label: 'Roles & Permissions', path: '/roles', icon: ShieldCheck },
        { label: 'Team Members', path: '/team', icon: UserPlus },
        { label: 'Workspace Settings', path: '/settings', icon: Settings },
        { label: 'Audit Logs', path: '/audit', icon: History },
      ],
    },
  ];

  return (
    <aside
      className={`glass-1 text-slate-300 flex flex-col shrink-0 select-none transition-all duration-200 border-r border-white/10 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-white/10 bg-slate-950/40 shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-100 flex items-center justify-center font-bold text-xs shadow-inner shrink-0">
            <Boxes className="w-4 h-4 text-blue-400" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-100 text-[13px] tracking-tight truncate">
                  StockPilot
                </span>
                <span className="mono-chip text-[9px] text-slate-400 py-0 px-1">
                  SaaS
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                {activeOrganization?.name || 'Workspace'}
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2.5 mb-1 font-mono">
                {group.title}
              </div>
            )}

            <div className="space-y-0.5">
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;

                const linkContent = (
                  <NavLink
                    key={iIdx}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                        isCollapsed ? 'justify-center p-2' : 'px-2.5 py-1.5'
                      } ${
                        isActive
                          ? 'nav-item-active'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );

                if (isCollapsed) {
                  return (
                    <Tooltip key={iIdx} content={item.label} position="right" className="z-50">
                      {linkContent}
                    </Tooltip>
                  );
                }

                return linkContent;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* System Status Footer */}
      <div className="p-3 border-t border-white/10 bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-xs shadow-emerald-400" />
          {!isCollapsed && <span className="truncate text-xs">All systems nominal</span>}
        </div>
        {!isCollapsed && <span className="font-mono text-[10px] text-slate-500">v2.4</span>}
      </div>
    </aside>
  );
}
