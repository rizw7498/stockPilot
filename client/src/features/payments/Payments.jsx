import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../app/AuthContext";
import { useToast } from "../../app/ToastContext";
import { DollarSign, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function Payments() {
  const { activeOrganization } = useAuth();
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/payments");
      if (res.success) setPayments(res.data);
    } catch (err) {
      toast.error(err.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const formatCurrency = (minor = 0) => {
    const symbol = activeOrganization?.currency === "EUR" ? "€" : "$";
    return `${symbol}${(minor / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Payments History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cash receipts, bank transfers, credit card settlements, and refunds.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Payment #</th>
              <th className="py-3 px-4">Direction</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Method</th>
              <th className="py-3 px-4">Reference</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  Loading payments...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No payment transactions recorded yet.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr
                  key={p._id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-600">
                    {p.paymentNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${
                        p.direction === "INCOMING"
                          ? "text-emerald-700"
                          : "text-blue-700"
                      }`}
                    >
                      {p.direction === "INCOMING" ? (
                        <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      {p.direction}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {new Date(p.paymentDate || p.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">
                    {p.method}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                    {p.reference || "-"}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                    {formatCurrency(p.amountMinor)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {p.status}
                    </span>
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
