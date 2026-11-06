import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import {
  Package,
  Boxes,
  AlertTriangle,
  Truck,
  ShoppingCart,
  DollarSign,
  PlusCircle,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

export default function Dashboard() {
  const { activeOrganization } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard');
      if (res.success) {
        setData(res.data);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time stock valuation, open orders, and operational KPIs for{' '}
            <span className="font-semibold text-slate-700">{activeOrganization?.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Package className="w-4 h-4 text-slate-500" />
            Add Product
          </Link>
          <Link
            to="/purchases"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Truck className="w-4 h-4 text-slate-500" />
            New PO
          </Link>
          <Link
            to="/sales"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-500/20 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Create Sales Order
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Stock Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Inventory Value</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatCurrency(kpis.totalValuationMinor)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">OnHand Cost Basis</span>
        </div>

        {/* Active Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Products</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{kpis.totalProducts || 0}</div>
          <span className="text-xs text-slate-400 mt-1 block">Active SKU catalog</span>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-extrabold ${
              kpis.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'
            }`}
          >
            {kpis.lowStockCount || 0}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Below reorder level</span>
        </div>

        {/* Open Sales Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Open Sales</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{kpis.openSalesOrders || 0}</div>
          <span className="text-xs text-slate-400 mt-1 block">Pending fulfillment</span>
        </div>

        {/* Open Purchase Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Open POs</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{kpis.openPurchaseOrders || 0}</div>
          <span className="text-xs text-slate-400 mt-1 block">Awaiting receipt</span>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Receivables</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {formatCurrency(kpis.outstandingReceivablesMinor)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Unpaid invoices</span>
        </div>
      </div>

      {/* Recent Orders & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Sales Orders</h2>
              <p className="text-xs text-slate-500">Latest orders submitted across warehouses</p>
            </div>
            <Link to="/sales" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400">
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Total Amount</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data?.recentOrders && data.recentOrders.length > 0 ? (
                  data.recentOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-semibold text-blue-600">{ord.orderNumber}</td>
                      <td className="py-3">{ord.customerId?.name || 'Walk-in'}</td>
                      <td className="py-3 text-xs text-slate-500">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        {formatCurrency(ord.totalAmountMinor)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ord.status === 'FULFILLED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'RESERVED'
                              ? 'bg-blue-100 text-blue-800'
                              : ord.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No sales orders created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links & Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">System Health & Ledger</h2>
            <p className="text-xs text-slate-500 mb-4">
              Real-time auditability and double-entry style stock ledger status.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Stock Movement Ledger</span>
                  <span className="text-[11px] text-slate-500">Append-only audit trail</span>
                </div>
                <Link to="/inventory" className="text-xs font-bold text-blue-600 hover:underline">
                  Inspect
                </Link>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Dynamic Roles & Access</span>
                  <span className="text-[11px] text-slate-500">Role-based permission matrix</span>
                </div>
                <Link to="/roles" className="text-xs font-bold text-blue-600 hover:underline">
                  Configure
                </Link>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Warehouse Stocktakes</span>
                  <span className="text-[11px] text-slate-500">Variance adjustments</span>
                </div>
                <Link to="/inventory" className="text-xs font-bold text-blue-600 hover:underline">
                  Adjust
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Strict Tenant Isolation active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

