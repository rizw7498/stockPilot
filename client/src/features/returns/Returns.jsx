import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { RotateCcw, CheckCircle, X } from 'lucide-react';

export default function Returns() {
  const { activeOrganization } = useAuth();
  const toast = useToast();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/returns');
      if (res.success) setReturns(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleComplete = async (id) => {
    try {
      await api.post(`/returns/${id}/complete`);
      toast.success('Return completed and stock disposition applied!');
      fetchReturns();
    } catch (err) {
      toast.error(err.message || 'Completion failed');
    }
  };

  const formatCurrency = (minor = 0) => {
    const symbol = activeOrganization?.currency === 'EUR' ? '€' : '$';
    return `${symbol}${(minor / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Returns & Refunds</h1>
          <p className="text-sm text-slate-500 mt-1">
            Customer sales returns and supplier purchase returns with disposition tracking (restock vs scrap).
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Return #</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Warehouse</th>
              <th className="py-3 px-4">Disposition</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  Loading returns...
                </td>
              </tr>
            ) : returns.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No returns registered.
                </td>
              </tr>
            ) : (
              returns.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-600">
                    {r.returnNumber}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs">
                    {r.returnType}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs">
                    {r.warehouseId?.name}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-xs text-purple-700">
                    {r.disposition}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs">
                    {r.reason}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {r.status !== 'COMPLETED' ? (
                      <button
                        onClick={() => handleComplete(r._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-xs cursor-pointer"
                      >
                        Process Return
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center justify-end gap-1">
                        <CheckCircle className="w-4 h-4" /> Completed
                      </span>
                    )}
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
