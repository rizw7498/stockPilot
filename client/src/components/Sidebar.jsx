import React from 'react';
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
} from 'lucide-react';
import { useAuth } from '../app/AuthContext';

export default function Sidebar() {
  const { role, user, activeOrganization } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin || role === 'Super Admin';

  const navGroups = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard },
      ],
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
      items: [
        { label: 'Returns & Refunds', path: '/returns', icon: RotateCcw },
      ],
    },
    {
      title: 'Analytics',
      items: [
        { label: 'Reports & Valuation', path: '/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Administration',
      items: [
        { label: 'Roles & Permissions', path: '/roles', icon: ShieldCheck },
        { label: 'Team Members', path: '/team', icon: UserPlus },
        { label: 'Audit Logs', path: '/audit', icon: History },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-800/80 select-none">
      {/* Brand & Organization Identity */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20 border border-blue-400/30">
            SP
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-tight block leading-tight">
              StockPilot
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {activeOrganization?.name ? activeOrganization.name.slice(0, 16) : 'Inventory'}
            </span>
          </div>
        </div>

        {isSuperAdmin && (
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase">
            Admin
          </span>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={iIdx}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* System Status Footer */}
      <div className="p-3.5 border-t border-slate-900 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Ledger Operational</span>
        </div>
        <span className="font-mono text-[10px] text-slate-400 font-bold">v1.0.0</span>
      </div>
    </aside>
  );
}
