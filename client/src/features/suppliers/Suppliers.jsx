import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import { Building2, Plus, Mail, Phone } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import Toolbar from '../../components/ui/Toolbar';

export default function Suppliers() {
  const { activeOrganization } = useAuth();
  const toast = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    paymentTerms: 'NET_30',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/suppliers');
      if (res.success) setSuppliers(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/suppliers', formData);
      toast.success(`Supplier "${formData.name}" added!`);
      setModalOpen(false);
      setFormData({ name: '', companyName: '', email: '', phone: '', paymentTerms: 'NET_30' });
      fetchSuppliers();
    } catch (err) {
      toast.error(err.message || 'Failed to add supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (minor = 0) => {
    const symbol = activeOrganization?.currency === 'EUR' ? '€' : '$';
    return `${symbol}${(minor / 100).toFixed(2)}`;
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      !searchTerm ||
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'name',
      header: 'Vendor Name',
      render: (name, row) => (
        <div>
          <span className="font-semibold text-slate-100">{name}</span>
          {row.companyName && (
            <div className="text-[11px] text-slate-400">{row.companyName}</div>
          )}
        </div>
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
      key: 'paymentTerms',
      header: 'Terms',
      render: (terms) => (
        <span className="mono-chip text-slate-300 font-bold">{terms || 'NET_30'}</span>
      ),
    },
    {
      key: 'outstandingMinor',
      header: 'Accounts Payable',
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
              Vendor & Supplier Directory
            </h1>
            <span className="mono-chip text-[11px] text-blue-500 dark:text-blue-400 font-bold">
              {suppliers.length} Vendors
            </span>
          </div>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
            Procurement vendor profiles, payment credit terms, and accounts payable ledgers.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setModalOpen(true)}
        >
          Add Supplier
        </Button>
      </div>

      <Toolbar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filter suppliers by name or company... (Press /)"
      />

      <DataTable
        columns={columns}
        data={filteredSuppliers}
        loading={loading}
        emptyTitle="No suppliers registered"
        emptyDescription="Add supplier profiles to issue purchase orders and receive inventory."
        className="flex-1"
      />

      {/* Add Supplier Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-md"
        title="Add Vendor Profile"
        subtitle="Contact details and settlement terms"
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
              Save Supplier
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Supplier / Contact Person"
            required
            placeholder="e.g. Acme Tech Distributors"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="Company Legal Name"
            placeholder="e.g. Acme International LLC"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="sales@acme.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              label="Phone"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <Select
            label="Payment Terms"
            value={formData.paymentTerms}
            onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
          >
            <option value="NET_15">Net 15 Days</option>
            <option value="NET_30">Net 30 Days</option>
            <option value="NET_60">Net 60 Days</option>
            <option value="DUE_ON_RECEIPT">Due on Receipt (COD)</option>
            <option value="PREPAID">Prepaid / Advance</option>
          </Select>
        </form>
      </Modal>
    </div>
  );
}
