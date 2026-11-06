import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { BarChart3, Boxes, DollarSign, Download } from 'lucide-react';

export default function Reports() {
  const { activeOrganization } = useAuth();
  const toast = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchValuation = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/stock-valuation');
      if (res.success) setReport(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to generate valuation report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchValuation();
  }, []);

  const formatCurrency = (minor = 0) => {
    const symbol = activeOrganization?.currency === 'EUR' ? '€' : '$';
    return `${symbol}${(minor / 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Inventory Valuation Report
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Product cost-basis valuation breakdown across physical warehouses.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Total Inventory Valuation
            </span>
            <span className="text-2xl font-extrabold text-slate-900">
              {formatCurrency(report?.totalValuationMinor)}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Total Physical Units On Hand
            </span>
            <span className="text-2xl font-extrabold text-slate-900">
              {report?.totalOnHandUnits || 0} Units
            </span>
          </div>
        </div>
      </div>

      {/* Valuation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Product Name</th>
              <th className="py-3 px-4">Warehouse</th>
              <th className="py-3 px-4 text-center">OnHand</th>
              <th className="py-3 px-4 text-center">Reserved</th>
              <th className="py-3 px-4 text-center">Available</th>
              <th className="py-3 px-4 text-right">Unit Cost</th>
              <th className="py-3 px-4 text-right">Total Valuation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  Calculating valuation...
                </td>
              </tr>
            ) : !report?.items || report.items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No inventory balances recorded to value.
                </td>
              </tr>
            ) : (
              report.items.map((item) => (
                <tr key={item.balanceId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-600">
                    {item.product?.sku}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {item.product?.name}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {item.warehouse?.name}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                    {item.onHand} {item.product?.unit}
                  </td>
                  <td className="py-3.5 px-4 text-center text-indigo-600 font-medium">
                    {item.reserved}
                  </td>
                  <td className="py-3.5 px-4 text-center text-emerald-700 font-bold">
                    {item.available}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                    {formatCurrency(item.unitCostMinor)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                    {formatCurrency(item.valuationMinor)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
