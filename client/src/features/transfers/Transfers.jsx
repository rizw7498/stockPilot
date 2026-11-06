import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../app/ToastContext';
import { ArrowLeftRight, Plus, Truck, CheckCircle, X } from 'lucide-react';

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
        // Approve transfer
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inter-Warehouse Transfers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Dispatch items from source warehouses and confirm receipts with in-transit tracking.
          </p>
        </div>

        <button
          onClick={() => {
            if (warehouses.length < 2) {
              toast.error('You need at least 2 warehouses to initiate transfers');
              return;
            }
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Transfer Stock
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Transfer #</th>
              <th className="py-3 px-4">From Warehouse</th>
              <th className="py-3 px-4">To Destination</th>
              <th className="py-3 px-4">Items</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  Loading transfers...
                </td>
              </tr>
            ) : transfers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No warehouse transfers logged yet.
                </td>
              </tr>
            ) : (
              transfers.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-600">
                    {t.transferNumber}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {t.fromWarehouseId?.name}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {t.toWarehouseId?.name}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {t.lines?.map((l) => `${l.productId?.name} (${l.requestedQty})`).join(', ')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.status === 'RECEIVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'IN_TRANSIT'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {t.status === 'APPROVED' && (
                      <button
                        onClick={() => handleDispatch(t._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-xs cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" /> Dispatch
                      </button>
                    )}
                    {t.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => handleReceive(t._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Receive
                      </button>
                    )}
                    {t.status === 'RECEIVED' && (
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-slate-900 text-base">New Inter-Warehouse Transfer</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                  Source Warehouse (From)
                </label>
                <select
                  value={fromWh}
                  onChange={(e) => setFromWh(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                  Destination Warehouse (To)
                </label>
                <select
                  value={toWh}
                  onChange={(e) => setToWh(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Product
                  </label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} [{p.sku}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm shadow-blue-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create & Approve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

