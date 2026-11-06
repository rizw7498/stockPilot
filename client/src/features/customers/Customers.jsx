import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { Users, Plus, Mail, Phone, DollarSign } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Toolbar from '../../components/ui/Toolbar';

export default function Customers() {
  const { activeOrganization } = useAuth();
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    creditLimit: '0',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      if (res.success) setCustomers(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/customers', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        creditLimitMinor: Math.round(parseFloat(formData.creditLimit || '0') * 100),
      });
      toast.success(`Customer "${formData.name}" added!`);
      setModalOpen(false);
      setFormData({ name: '', email: '', phone: '', creditLimit: '0' });
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Failed to add customer');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (minor = 0) => {
    const symbol = activeOrganization?.currency === 'EUR' ? '€' : '$';
    return `${symbol}${(minor / 100).toFixed(2)}`;
  };

  const filteredCustomers = customers.filter(
    (c) =>
      !searchTerm ||
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'name',
      header: 'Customer Name',
      render: (name) => (
        <span className="font-semibold text-slate-100">{name}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email Address',
      render: (email) => (
        <span className="text-xs text-slate-400 font-mono">{email || '-'}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (phone) => (
        <span className="text-xs text-slate-400 font-mono">{phone || '-'}</span>
      ),
    },
    {
      key: 'creditLimitMinor',
      header: 'Credit Limit',
      align: 'right',
      tabular: true,
      render: (minor) => (
        <span className="font-mono text-slate-300">{formatCurrency(minor)}</span>
      ),
    },
    {
      key: 'outstandingMinor',
      header: 'Outstanding Balance',
      align: 'right',
      tabular: true,
      render: (minor) => (
        <span
          className={`font-mono font-semibold ${
            minor > 0 ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          {formatCurrency(minor)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/5 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[20px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Customer Accounts
            </h1>
            <span className="mono-chip text-[11px] text-blue-500 dark:text-blue-400 font-bold">
              {customers.length} Accounts
            </span>
          </div>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
            Client profiles, accounts receivable balances, billing terms, and credit lines.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setModalOpen(true)}
        >
          Add Customer
        </Button>
      </div>

      <Toolbar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filter customers by name or email... (Press /)"
      />

      <DataTable
        columns={columns}
        data={filteredCustomers}
        loading={loading}
        emptyTitle="No customer accounts registered"
        emptyDescription="Add customer accounts to issue sales orders and track receivables."
        className="flex-1"
      />

      {/* Add Customer Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-md"
        title="Add Customer Account"
        subtitle="Contact details and credit terms"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={submitting}
            >
              Save Customer
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Full Customer / Company Name"
            required
            placeholder="e.g. Acme Corp Inc."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Contact Email"
            type="email"
            placeholder="billing@acmecorp.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Input
              label="Credit Limit ($)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.creditLimit}
              onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
