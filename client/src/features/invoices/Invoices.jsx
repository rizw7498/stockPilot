import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { FileText, DollarSign, CheckCircle2, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import StatusPill from '../../components/ui/StatusPill';
import Toolbar from '../../components/ui/Toolbar';

export default function Invoices() {
  const { activeOrganization } = useAuth();
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      !searchTerm ||
      inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (num) => <span className="mono-chip font-bold text-blue-400">{num}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (_, row) => (
        <span className="font-medium text-slate-100">{row.customerId?.name || 'Customer'}</span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (date) => (
        <span className="text-xs text-slate-400 font-mono">
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'totalAmountMinor',
      header: 'Total Amount',
      align: 'right',
      tabular: true,
      render: (minor) => (
        <span className="font-semibold text-slate-100">{formatCurrency(minor)}</span>
      ),
    },
    {
      key: 'paidAmountMinor',
      header: 'Paid',
      align: 'right',
      tabular: true,
      render: (minor) => (
        <span className="font-mono text-emerald-400">{formatCurrency(minor)}</span>
      ),
    },
    {
      key: 'balanceDueMinor',
      header: 'Balance Due',
      align: 'right',
      tabular: true,
      render: (minor) => (
        <span
          className={`font-semibold font-mono ${minor > 0 ? 'text-amber-400' : 'text-slate-400'}`}
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
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (_, row) => (
        <div>
          {row.balanceDueMinor > 0 && (
            <Button
              variant="primary"
              size="sm"
              icon={DollarSign}
              onClick={() => handleOpenPay(row)}
            >
              Record Payment
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/5 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[20px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Customer Invoices
            </h1>
            <span className="mono-chip text-[11px] text-blue-500 dark:text-blue-400 font-bold">
              {invoices.length} Invoices
            </span>
          </div>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
            Track receivables, outstanding customer payments, billing schedules, and settlements.
          </p>
        </div>
      </div>

      <Toolbar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filter by invoice # or customer... (Press /)"
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            options: [
              { label: 'All Statuses', value: '' },
              { label: 'Issued', value: 'ISSUED' },
              { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
              { label: 'Paid', value: 'PAID' },
              { label: 'Overdue', value: 'OVERDUE' },
            ],
            onChange: setStatusFilter,
          },
        ]}
      />

      <DataTable
        columns={columns}
        data={filteredInvoices}
        loading={loading}
        emptyTitle="No invoices found"
        emptyDescription="Invoices are automatically generated when sales orders are dispatched."
        className="flex-1"
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={payModal}
        onClose={() => setPayModal(false)}
        maxWidth="max-w-md"
        title={`Record Payment: ${activeInvoice?.invoiceNumber}`}
        subtitle={`Total balance outstanding: ${formatCurrency(activeInvoice?.balanceDueMinor)}`}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setPayModal(false)}
              disabled={submittingPay}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRecordPayment}
              loading={submittingPay}
            >
              Confirm Settlement
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <Input
            label="Payment Amount ($)"
            type="number"
            step="0.01"
            required
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
          />

          <Select
            label="Payment Method"
            value={payMethod}
            onChange={(e) => setPayMethod(e.target.value)}
          >
            <option value="CARD">Credit / Debit Card</option>
            <option value="BANK_TRANSFER">Direct Wire Transfer (ACH)</option>
            <option value="CASH">Cash Deposit</option>
            <option value="CHEQUE">Business Cheque</option>
          </Select>

          <Input
            label="Reference / Transaction ID"
            value={payRef}
            onChange={(e) => setPayRef(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
