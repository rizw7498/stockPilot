import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { FileText, DollarSign, CheckCircle2, Clock, X } from 'lucide-react';

export default function Invoices() {
  const { activeOrganization } = useAuth();
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pay Modal
  const [payModal, setPayModal] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CARD');
  const [payRef, setPayRef] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices');
      if (res.success) setInvoices(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleOpenPay = (inv) => {
    setActiveInvoice(inv);
    setPayAmount((inv.balanceDueMinor / 100).toFixed(2));
    setPayRef(`TXN-${Date.now().toString().slice(-6)}`);
    setPayModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setSubmittingPay(true);
    try {
      await api.post('/payments', {
        direction: 'INCOMING',
        partyType: 'CUSTOMER',
        partyId: activeInvoice.customerId?._id || activeInvoice.customerId,
        invoiceId: activeInvoice._id,
        amountMinor: Math.round(parseFloat(payAmount) * 100),
        method: payMethod,
        reference: payRef,
      });
      toast.success('Payment recorded successfully!');
      setPayModal(false);
      fetchInvoices();
    } catch (err) {
      toast.error(err.message || 'Payment recording failed');
    } finally {
      setSubmittingPay(false);
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">
            Accounts receivable, billing snapshots, due dates, and settlement tracking.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4 text-right">Paid Amount</th>
              <th className="py-3 px-4 text-right">Balance Due</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  Loading invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No invoices issued yet. Invoices are automatically generated when sales orders are confirmed or fulfilled.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-600">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {inv.customerId?.name}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {new Date(inv.dueDate).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    {formatCurrency(inv.totalAmountMinor)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                    {formatCurrency(inv.paidAmountMinor)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                    {formatCurrency(inv.balanceDueMinor)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'PARTIALLY_PAID'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {inv.balanceDueMinor > 0 ? (
                      <button
                        onClick={() => handleOpenPay(inv)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-xs"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Collect Payment
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Settled
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {payModal && activeInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Record Inbound Payment</h3>
                <span className="text-xs font-mono text-blue-600 font-bold">
                  {activeInvoice.invoiceNumber} • {activeInvoice.customerId?.name}
                </span>
              </div>
              <button onClick={() => setPayModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                  Payment Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={(activeInvoice.balanceDueMinor / 100).toFixed(2)}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Remaining balance due: {formatCurrency(activeInvoice.balanceDueMinor)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Method
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="BANK_TRANSFER">Bank Wire</option>
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">Online Portal</option>
                    <option value="CHECK">Check</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Reference #
                  </label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="Transaction ref"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPay}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm shadow-blue-500/20 disabled:opacity-50"
                >
                  {submittingPay ? 'Posting Payment...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

