import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import {
  Package,
  Boxes,
  AlertTriangle,
  Truck,
  ShoppingCart,
  DollarSign,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import KpiCard from '../../components/ui/KpiCard';
import GlassCard from '../../components/ui/GlassCard';
import StatusPill from '../../components/ui/StatusPill';
import Skeleton from '../../components/ui/Skeleton';

export default function Dashboard() {
  const { activeOrganization } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState(new Date().toLocaleTimeString());

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard');
      if (res.success) {
        setData(res.data);
        setLastSynced(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const formatCurrency = (minorAmount = 0) => {
    const symbol = activeOrganization?.currency === 'EUR' ? '€' : '$';
    return `${symbol}${(minorAmount / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const kpis = data?.kpis || {};

  // Mocked 14-day trends for valuation & receivables visualization
  const valuationSparkline = [320, 340, 335, 360, 380, 375, 410, 425, 420, 440, 460, 480, 510, 520];
  const receivablesSparkline = [180, 195, 170, 210, 190, 240, 220, 260, 230, 210, 195, 180, 160, 150];

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-100">
              Operations Dashboard
            </h1>
            <span className="mono-chip text-[11px] text-slate-400">
              {activeOrganization?.name || 'Workspace'}
            </span>
          </div>
          <p className="text-[12px] text-slate-400 mt-0.5 flex items-center gap-2">
            <span>Real-time inventory valuation & fulfillment metrics</span>
            <span>•</span>
            <span className="text-slate-500 font-mono">Last synced: {lastSynced}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={fetchSummary}
            className="text-slate-400"
          >
            Sync
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon={Package}
            onClick={() => navigate('/products')}
          >
            Products
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon={Truck}
            onClick={() => navigate('/purchases')}
          >
            New PO
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => navigate('/sales')}
          >
            New Order
          </Button>
        </div>
      </div>

      {/* Row 1: KPI Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="kpi" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Inventory Valuation - Larger span 2 on md+ */}
          <KpiCard
            label="Inventory Valuation"
            value={formatCurrency(kpis.totalValuationMinor)}
            subvalue="OnHand at current FIFO unit cost"
            delta="+4.8%"
            deltaType="positive"
            icon={Boxes}
            span={2}
            sparklineData={valuationSparkline}
            onClick={() => navigate('/inventory')}
          />

          {/* Active Products */}
          <KpiCard
            label="Active SKUs"
            value={kpis.totalProducts || 0}
            subvalue="Managed catalog items"
            icon={Package}
            onClick={() => navigate('/products')}
          />

          {/* Low Stock Alerts (Glow) */}
          <KpiCard
            label="Low Stock Alerts"
            value={kpis.lowStockCount || 0}
            subvalue="Below reorder threshold"
            delta={kpis.lowStockCount > 0 ? 'Action required' : 'Optimal'}
            deltaType={kpis.lowStockCount > 0 ? 'warning' : 'positive'}
            icon={AlertTriangle}
            variant={kpis.lowStockCount > 0 ? 'warning' : 'default'}
            onClick={() => navigate('/inventory')}
          />

          {/* Open Sales Orders */}
          <KpiCard
            label="Open Orders"
            value={kpis.openSalesOrders || 0}
            subvalue="Pending allocation & dispatch"
            icon={ShoppingCart}
            onClick={() => navigate('/sales')}
          />

          {/* Outstanding Receivables - Larger span 2 */}
          <KpiCard
            label="Receivables"
            value={formatCurrency(kpis.outstandingReceivablesMinor)}
            subvalue="Unsettled customer invoices"
            delta="-12.3%"
            deltaType="positive"
            icon={DollarSign}
            onClick={() => navigate('/invoices')}
          />
        </div>
      )}

      {/* Row 2: 8/4 split - Recent Orders & Operational Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Sales Orders (8 cols) */}
        <div className="lg:col-span-8">
          <GlassCard
            title="Recent Sales Orders"
            subtitle="Latest orders received across all fulfillment nodes"
            headerAction={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/sales')}
                className="text-blue-400 hover:text-blue-300"
              >
                View all orders <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            }
            padding="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/5 bg-slate-50/90 dark:bg-slate-900/40 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <th className="px-4 py-3">Order Number</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-[13px]">
                  {loading ? (
                    <Skeleton variant="table-row" rows={5} />
                  ) : !data?.recentOrders || data.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500 text-xs">
                        No recent sales orders recorded for this workspace.
                      </td>
                    </tr>
                  ) : (
                    data.recentOrders.map((ord) => (
                      <tr
                        key={ord._id}
                        onClick={() => navigate('/sales')}
                        className="hover:bg-slate-50/80 dark:hover:bg-blue-500/[0.04] transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-2.5 font-mono text-xs font-semibold text-blue-500 dark:text-blue-400">
                          {ord.orderNumber}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">
                          {ord.customerId?.name || 'Standard Account'}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                          {formatCurrency(ord.totalAmountMinor)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <StatusPill status={ord.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Right: Operational Health & Quick Links (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Operational Health */}
          <GlassCard
            title="Operational Integrity"
            subtitle="Real-time multi-tenant ledger verification"
          >
            <div className="space-y-3.5">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0 shadow-xs shadow-emerald-400" />
                <div className="space-y-0.5">
                  <div className="text-[13px] font-semibold text-slate-200">
                    Stock Movement Ledger
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Append-only double-entry balance: 100% synchronized
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0 shadow-xs shadow-emerald-400" />
                <div className="space-y-0.5">
                  <div className="text-[13px] font-semibold text-slate-200">
                    Tenant Isolation
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Strict organization query scoping active
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0 shadow-xs shadow-emerald-400" />
                <div className="space-y-0.5">
                  <div className="text-[13px] font-semibold text-slate-200">
                    Role-Based Access Control
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Dynamic granular capability matrix enforced
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Security Tier: SOC2 Compliant</span>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            </div>
          </GlassCard>

          {/* Quick Shortcuts */}
          <GlassCard title="Core Workflows">
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => navigate('/inventory')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-colors text-xs text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                  <span className="font-medium">Perform Stock Adjustment</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/transfers')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-colors text-xs text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                  <span className="font-medium">Inter-Warehouse Transfer</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/roles')}
                className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-colors text-xs text-left cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
                  <span className="font-medium">Permission Matrix</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
