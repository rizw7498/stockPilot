import React, { useState } from "react";
import { NavLink } from "react-router-dom";
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
  ChevronDown,
  Warehouse,
  ArrowLeftRight,
} from "lucide-react";
import { useAuth } from "../app/AuthContext";

export default function Sidebar() {
  const { role, user } = useAuth();
  const isSuperAdmin = user?.isSuperAdmin || role === "Super Admin";

  const navGroups = [
    {
      title: "Overview",
      items: [{ label: "Dashboard", path: "/", icon: LayoutDashboard }],
    },
    {
      title: "Catalog",
      items: [
        { label: "Products", path: "/products", icon: Package },
        { label: "Categories", path: "/categories", icon: Layers },
        { label: "Warehouses", path: "/warehouses", icon: Warehouse },
      ],
    },
    {
      title: "Inventory",
      items: [
        { label: "Stock Overview", path: "/inventory", icon: Boxes },
        { label: "Stock Transfers", path: "/transfers", icon: ArrowLeftRight },
      ],
    },
    {
      title: "Purchasing",
      items: [
        { label: "Purchase Orders", path: "/purchases", icon: Truck },
        { label: "Suppliers", path: "/suppliers", icon: Building2 },
      ],
    },
    {
      title: "Sales & Finance",
      items: [
        { label: "Sales Orders", path: "/sales", icon: FileText },
        { label: "Customers", path: "/customers", icon: Users },
        { label: "Invoices", path: "/invoices", icon: FileText },
        { label: "Payments", path: "/payments", icon: DollarSign },
      ],
    },
    {
      title: "Returns",
      items: [
        { label: "Returns & Refunds", path: "/returns", icon: RotateCcw },
      ],
    },
    {
      title: "Analytics",
      items: [
        { label: "Reports & Valuation", path: "/reports", icon: BarChart3 },
      ],
    },
    {
      title: "Administration",
      items: [
        { label: "Roles & Permissions", path: "/roles", icon: ShieldCheck },
        { label: "Team Members", path: "/team", icon: UserPlus },
        { label: "Audit Logs", path: "/audit", icon: History },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
          SP
        </div>
        <div>
          <span className="font-bold text-white text-base tracking-tight block">
            StockPilot
          </span>
          <span className="text-[10px] uppercase font-semibold text-blue-400 tracking-wider">
            {isSuperAdmin ? "Super Admin" : "SaaS Edition"}
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={iIdx}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
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

      {/* Version badge */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        StockPilot v1.0.0 Enterprise
      </div>
    </aside>
  );
}
