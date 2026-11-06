import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { DollarSign, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import StatusPill from '../../components/ui/StatusPill';

export default function Payments() {
  const { activeOrganization } = useAuth();
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/payments');
      if (res.success) setPayments(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const formatCurrency = (minor = 0) => {
    const symbol = activeOrganization?.currency === 'EUR' ? '€' : '$';
    return `${symbol}${(minor / 100).toFixed(2)}`;
  };

  const columns = [
    {
      key: 'paymentNumber',
      header: 'Payment #',
      render: (num) => <span className="mono-chip font-bold text-blue-400">{num}</span>,
    },
    {
      key: 'direction',
      header: 'Direction',
      render: (direction) => (
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold ${
            direction === 'INCOMING' ? 'text-emerald-400' : 'text-sky-400'
          }`}
        >
          {direction === 'INCOMING' ? (
            <ArrowDownLeft className="w-3.5 h-3.5" />
          ) : (
            <ArrowUpRight className="w-3.5 h-3.5" />
          )}
          {direction}
        </span>
      ),
    },
    {
      key: 'paymentDate',
      header: 'Date & Time',
      render: (date, row) => (
        <span className="text-xs text-slate-400 font-mono">
          {new Date(date || row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: (method) => (
        <span className="mono-chip text-slate-300 font-bold">{method}</span>
      ),
    },
    {
      key: 'reference',
      header: 'Reference',
      render: (ref) => (
        <span className="mono-chip text-slate-400">{ref || 'DIRECT'}</span>
      ),
    },
    {
      key: 'amountMinor',
      header: 'Amount Settled',
      align: 'right',
      tabular: true,
      render: (minor, row) => (
        <span
          className={`font-semibold font-mono text-sm ${
            row.direction === 'INCOMING' ? 'text-emerald-400' : 'text-slate-100'
          }`}
        >
          {formatCurrency(minor)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (status) => <StatusPill status={status} />,
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/5 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[20px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Payments History
            </h1>
            <span className="mono-chip text-[11px] text-emerald-500 dark:text-emerald-400 font-bold">
              {payments.length} Transactions
            </span>
          </div>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
            Incoming client receivables, bank settlements, wire receipts, and outgoing disbursements.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        emptyTitle="No payments recorded"
        emptyDescription="Transactions recorded against invoices or manual settlements will appear here."
        className="flex-1"
      />
    </div>
  );
}
