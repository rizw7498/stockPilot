import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Shield,
  Package,
  Layers,
  ShoppingCart,
  Receipt,
  RotateCcw,
  Building2,
  Boxes,
  Truck,
  Users,
  FileSpreadsheet,
  History,
  X,
  CreditCard,
  Settings,
} from 'lucide-react';

const NAVIGATION_ITEMS = [
  { name: 'Dashboard', path: '/', group: 'Overview', icon: LayoutDashboard },
  { name: 'Roles & Permissions', path: '/roles', group: 'Administration', icon: Shield },
  { name: 'Products & Catalog', path: '/products', group: 'Inventory', icon: Package },
  { name: 'Stock Balances & Ledger', path: '/inventory', group: 'Inventory', icon: Layers },
  { name: 'Purchase Orders', path: '/purchasing', group: 'Procurement', icon: ShoppingCart },
  { name: 'Suppliers', path: '/suppliers', group: 'Procurement', icon: Truck },
  { name: 'Sales Orders', path: '/sales', group: 'Sales & Fulfillment', icon: ShoppingCart },
  { name: 'Customers', path: '/customers', group: 'Sales & Fulfillment', icon: Users },
  { name: 'Invoices', path: '/invoices', group: 'Finance', icon: Receipt },
  { name: 'Payments', path: '/payments', group: 'Finance', icon: CreditCard },
  { name: 'Warehouse Transfers', path: '/transfers', group: 'Fulfillment & Logistics', icon: Boxes },
  { name: 'Returns Management', path: '/returns', group: 'Fulfillment & Logistics', icon: RotateCcw },
  { name: 'Warehouses', path: '/warehouses', group: 'Master Data', icon: Building2 },
  { name: 'Categories', path: '/categories', group: 'Master Data', icon: Boxes },
  { name: 'Team Members', path: '/team', group: 'Administration', icon: Users },
  { name: 'Workspace Settings', path: '/settings', group: 'Administration', icon: Settings },
  { name: 'Reports & Analytics', path: '/reports', group: 'Analytics', icon: FileSpreadsheet },
  { name: 'Audit Logs', path: '/audit', group: 'Analytics', icon: History },
];

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const filteredItems = query.trim()
    ? NAVIGATION_ITEMS.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.group.toLowerCase().includes(query.toLowerCase())
      )
    : NAVIGATION_ITEMS;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          navigate(filteredItems[selectedIndex].path);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Scrim */}
      <div
        className="fixed inset-0 glass-scrim transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette Box */}
      <div className="relative w-full max-w-xl glass-overlay rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Search header */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to page..."
            className="w-full bg-transparent text-[14px] text-slate-100 placeholder-slate-500 outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-2 overflow-y-auto max-h-96 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching pages or actions found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-500/20 text-blue-300' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 opacity-70" />
                    <span className="font-medium text-[13px]">{item.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                    {item.group}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-slate-500">StockPilot Jump</span>
        </div>
      </div>
    </div>
  );
}

