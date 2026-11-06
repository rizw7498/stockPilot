import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import {
  Truck,
  Plus,
  CheckCircle,
  Inbox,
  X,
  FileText,
  Building2,
  Trash2,
} from 'lucide-react';

export default function Purchasing() {
  const { activeOrganization } = useAuth();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New PO Modal
  const [newPoModal, setNewPoModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [poLines, setPoLines] = useState([{ productId: '', orderedQty: 1, unitCost: 0 }]);
  const [submittingPo, setSubmittingPo] = useState(false);

  // Receive Goods Modal
  const [receiveModal, setReceiveModal] = useState(false);
  const [activePo, setActivePo] = useState(null);
  const [receiptLines, setReceiptLines] = useState([]);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [poRes, supRes, whRes, prodRes] = await Promise.all([
        api.get('/purchase-orders'),
        api.get('/suppliers'),
        api.get('/warehouses'),
        api.get('/products'),
      ]);

      if (poRes.success) setOrders(poRes.data);
      if (supRes.success) setSuppliers(supRes.data);
      if (whRes.success) {
        setWarehouses(whRes.data);
        if (whRes.data.length > 0) setSelectedWarehouse(whRes.data[0]._id);
      }
      if (prodRes.success) {
        setProducts(prodRes.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenNewPo = () => {
    if (suppliers.length === 0) {
      toast.error('Please create at least one supplier first');
      return;
    }
    if (products.length === 0) {
      toast.error('Please create at least one product first');
      return;
    }

    setSelectedSupplier(suppliers[0]._id);
    setSelectedWarehouse(warehouses.find((w) => w.isDefault)?._id || warehouses[0]?._id);
    setPoLines([{ productId: products[0]._id, orderedQty: 10, unitCost: (products[0].costMinor || 0) / 100 }]);
    setNewPoModal(true);
  };

  const handleAddLine = () => {
    const defaultProd = products[0];
    setPoLines([
      ...poLines,
      {
        productId: defaultProd?._id || '',
        orderedQty: 1,
        unitCost: (defaultProd?.costMinor || 0) / 100,
      },
    ]);
  };

  const handleRemoveLine = (idx) => {
    if (poLines.length === 1) return;
    setPoLines(poLines.filter((_, i) => i !== idx));
  };

  const handleLineProductChange = (idx, prodId) => {
    const prod = products.find((p) => p._id === prodId);
    const updated = [...poLines];
    updated[idx].productId = prodId;
    if (prod) {
      updated[idx].unitCost = (prod.costMinor || 0) / 100;
    }
    setPoLines(updated);
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    setSubmittingPo(true);
    try {
      const payload = {
        supplierId: selectedSupplier,
        warehouseId: selectedWarehouse,
        lines: poLines.map((l) => ({
          productId: l.productId,
          orderedQty: parseInt(l.orderedQty, 10),
          unitCostMinor: Math.round(parseFloat(l.unitCost) * 100),
        })),
      };

      const res = await api.post('/purchase-orders', payload);
      if (res.success && res.data._id) {
        // Automatically submit and approve for seamless operational speed
        await api.post(`/purchase-orders/${res.data._id}/approve`);
        toast.success(`Purchase Order ${res.data.poNumber} created and ordered!`);
        setNewPoModal(false);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create purchase order');
    } finally {
      setSubmittingPo(false);
    }
  };

  const handleOpenReceive = (order) => {
    setActivePo(order);
    const initLines = order.lines.map((l) => ({
      productId: l.productId?._id || l.productId,
      name: l.productId?.name,
      orderedQty: l.orderedQty,
      alreadyReceived: l.receivedQty,
      remaining: l.orderedQty - l.receivedQty,
      receiveQty: l.orderedQty - l.receivedQty,
      damagedQty: 0,
    }));
    setReceiptLines(initLines);
    setReceiveModal(true);
  };

  const handlePostReceipt = async (e) => {
    e.preventDefault();
    setSubmittingReceipt(true);
    try {
      await api.post(`/purchase-orders/${activePo._id}/receipts`, {
        lines: receiptLines.map((l) => ({
          productId: l.productId,
          receivedQty: parseInt(l.receiveQty, 10) || 0,
          damagedQty: parseInt(l.damagedQty, 10) || 0,
        })),
        notes: 'Goods received at warehouse inspection bay',
      });

      toast.success('Goods received! Inventory onHand increased.');
      setReceiveModal(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Failed to receive goods');
    } finally {
      setSubmittingReceipt(false);
    }
  };

  const formatCurrency = (minor = 0) => {
    const symbol = activeOrganization?.currency === 'EUR' ? '€' : '$';
    return `${symbol}${(minor / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-slate-500 mt-1">
            Supplier procurement lifecycle, ordering, and physical goods receiving into stock.
          </p>
        </div>

        <button
          onClick={handleOpenNewPo}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Purchase Order
        </button>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4 text-right">Order Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No purchase orders created yet.
                  </td>
                </tr>
              ) : (
                orders.map((po) => {
                  const canReceive =
                    po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED';

                  return (
                    <tr key={po._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-600">
                        {po.poNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {po.supplierId?.name}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {po.warehouseId?.name}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {po.lines?.map((l) => `${l.productId?.name} (${l.receivedQty}/${l.orderedQty})`).join(', ')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(po.totalAmountMinor)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            po.status === 'RECEIVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : po.status === 'PARTIALLY_RECEIVED'
                              ? 'bg-blue-100 text-blue-800'
                              : po.status === 'ORDERED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canReceive && (
                          <button
                            onClick={() => handleOpenReceive(po)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer shadow-xs"
                          >
                            <Inbox className="w-3.5 h-3.5" />
                            Receive Goods
                          </button>
                        )}
                        {po.status === 'RECEIVED' && (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center justify-end gap-1">
                            <CheckCircle className="w-4 h-4" /> Stocked
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Purchase Order Modal */}
      {newPoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create Purchase Order</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Order stock from registered suppliers.
                </p>
              </div>
              <button onClick={() => setNewPoModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Supplier
                  </label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.companyName || 'Supplier'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Destination Warehouse
                  </label>
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Order Lines */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                    Order Lines
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line
                  </button>
                </div>

                {poLines.map((line, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Product
                      </label>
                      <select
                        value={line.productId}
                        onChange={(e) => handleLineProductChange(idx, e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} [{p.sku}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={line.orderedQty}
                        onChange={(e) => {
                          const updated = [...poLines];
                          updated[idx].orderedQty = e.target.value;
                          setPoLines(updated);
                        }}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-center focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="w-28">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Unit Cost ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={line.unitCost}
                        onChange={(e) => {
                          const updated = [...poLines];
                          updated[idx].unitCost = e.target.value;
                          setPoLines(updated);
                        }}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-right focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    {poLines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="mt-4 text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewPoModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPo}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm shadow-blue-500/20 disabled:opacity-50"
                >
                  {submittingPo ? 'Submitting PO...' : 'Submit & Order PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Goods Modal */}
      {receiveModal && activePo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Receive Goods into Warehouse</h3>
                <span className="text-xs font-mono text-blue-600 font-bold">
                  {activePo.poNumber} • {activePo.supplierId?.name}
                </span>
              </div>
              <button onClick={() => setReceiveModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostReceipt} className="space-y-4">
              <p className="text-xs text-slate-500">
                Enter accepted items to increase sellable onHand inventory in{' '}
                <span className="font-semibold text-slate-700">{activePo.warehouseId?.name}</span>.
              </p>

              <div className="space-y-3">
                {receiptLines.map((line, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-800">{line.name}</span>
                      <span className="text-[11px] text-slate-500">
                        Remaining: <span className="font-bold text-blue-600">{line.remaining}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Received Qty
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={line.remaining}
                          required
                          value={line.receiveQty}
                          onChange={(e) => {
                            const updated = [...receiptLines];
                            updated[idx].receiveQty = e.target.value;
                            setReceiptLines(updated);
                          }}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-white text-center focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Damaged / Short Qty
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={line.receiveQty}
                          value={line.damagedQty}
                          onChange={(e) => {
                            const updated = [...receiptLines];
                            updated[idx].damagedQty = e.target.value;
                            setReceiptLines(updated);
                          }}
                          className="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-white text-center focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReceiveModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReceipt}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm shadow-emerald-500/20 disabled:opacity-50"
                >
                  {submittingReceipt ? 'Posting Goods Receipt...' : 'Confirm & Post Goods Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

