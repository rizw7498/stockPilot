import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../app/ToastContext';
import { ArrowLeftRight, Plus, Truck, CheckCircle, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import StatusPill from '../../components/ui/StatusPill';

export default function Transfers() {
  const toast = useToast();
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Transfer Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [fromWh, setFromWh] = useState('');
  const [toWh, setToWh] = useState('');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('10');
  const [submitting, setSubmitting] = useState(false);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const [trfRes, whRes, prodRes] = await Promise.all([
        api.get('/transfers'),
        api.get('/warehouses'),
        api.get('/products'),
      ]);

      if (trfRes.success) setTransfers(trfRes.data);
      if (whRes.success) {
        setWarehouses(whRes.data);
        if (whRes.data.length >= 2) {
          setFromWh(whRes.data[0]._id);
          setToWh(whRes.data[1]._id);
        }
      }
      if (prodRes.success) {
        setProducts(prodRes.data);
        if (prodRes.data.length > 0) setProductId(prodRes.data[0]._id);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (fromWh === toWh) {
      toast.error('Source and destination warehouses must be different');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/transfers', {
        fromWarehouseId: fromWh,
        toWarehouseId: toWh,
        lines: [{ productId, requestedQty: parseInt(qty, 10) }],
      });
      if (res.success && res.data._id) {
        await api.post(`/transfers/${res.data._id}/approve`);
        toast.success('Transfer approved & created!');
        setModalOpen(false);
        fetchTransfers();
      }
    } catch (err) {
      toast.error(err.message || 'Transfer creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispatch = async (id) => {
    try {
      await api.post(`/transfers/${id}/dispatch`);
      toast.success('Transfer dispatched! Items now IN_TRANSIT.');
      fetchTransfers();
    } catch (err) {
      toast.error(err.message || 'Dispatch failed');
    }
  };

  const handleReceive = async (id) => {
    try {
      await api.post(`/transfers/${id}/receive`);
      toast.success('Transfer received at destination warehouse!');
      fetchTransfers();
    } catch (err) {
      toast.error(err.message || 'Receipt failed');
    }
  };

  const columns = [
    {
      key: 'transferNumber',
      header: 'Transfer #',
      render: (num) => <span className="mono-chip font-bold text-blue-400">{num}</span>,
    },
    {
      key: 'route',
      header: 'Route (Origin → Destination)',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <span className="mono-chip text-slate-300">
            {row.fromWarehouseId?.name || 'Origin'}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="mono-chip text-slate-200">
            {row.toWarehouseId?.name || 'Destination'}
          </span>
        </div>
      ),
    },
    {
      key: 'lines',
      header: 'Items & Quantity',
      render: (lines) => (
        <div className="font-mono text-xs">
          {lines?.map((l, i) => (
            <span key={i} className="text-slate-200 font-semibold">
              {l.requestedQty}x {l.productId?.sku || 'Item'}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Initiated',
      render: (date) => (
        <span className="text-xs text-slate-400 font-mono">
          {new Date(date).toLocaleDateString()}
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
        <div className="flex items-center justify-end gap-2">
          {row.status === 'APPROVED' && (
            <Button
              variant="primary"
              size="sm"
              icon={Truck}
              onClick={() => handleDispatch(row._id)}
            >
              Dispatch
            </Button>
          )}

          {row.status === 'IN_TRANSIT' && (
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              onClick={() => handleReceive(row._id)}
            >
              Receive
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-100">
              Stock Transfers
            </h1>
            <span className="mono-chip text-[11px] text-blue-400">
              Inter-Warehouse
            </span>
          </div>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Relocate inventory between fulfillment facilities with automated in-transit tracking.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setModalOpen(true)}
        >
          New Transfer
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={transfers}
        loading={loading}
        emptyTitle="No transfer orders found"
        emptyDescription="Initiate a transfer to move goods between operational warehouse locations."
      />

      {/* New Transfer Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-md"
        title="Initiate Inter-Warehouse Transfer"
        subtitle="Reserve goods from origin and dispatch to destination"
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
              Approve & Create Transfer
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Select
            label="Origin Warehouse"
            value={fromWh}
            onChange={(e) => setFromWh(e.target.value)}
          >
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name} ({w.code})
              </option>
            ))}
          </Select>

          <Select
            label="Destination Warehouse"
            value={toWh}
            onChange={(e) => setToWh(e.target.value)}
          >
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name} ({w.code})
              </option>
            ))}
          </Select>

          <Select
            label="Product SKU"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.sku} - {p.name}
              </option>
            ))}
          </Select>

          <Input
            label="Quantity to Relocate"
            type="number"
            min="1"
            required
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}
