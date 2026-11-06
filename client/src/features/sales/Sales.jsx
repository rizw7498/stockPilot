import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import {
  ShoppingCart,
  Plus,
  CheckCircle,
  Truck,
  FileText,
  X,
  Trash2,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

export default function Sales() {
  const { activeOrganization } = useAuth();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New SO Modal
  const [newSoModal, setNewSoModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [soLines, setSoLines] = useState([{ productId: '', orderedQty: 1, unitPrice: 0 }]);
  const [submittingSo, setSubmittingSo] = useState(false);

  // Fulfill Modal
  const [fulfillModal, setFulfillModal] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [carrier, setCarrier] = useState('DHL Express');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [fulfillLines, setFulfillLines] = useState([]);
  const [submittingFulfillment, setSubmittingFulfillment] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [soRes, custRes, whRes, prodRes] = await Promise.all([
        api.get('/sales-orders'),
        api.get('/customers'),
        api.get('/warehouses'),
        api.get('/products'),
      ]);

      if (soRes.success) setOrders(soRes.data);
      if (custRes.success) setCustomers(custRes.data);
      if (whRes.success) {
        setWarehouses(whRes.data);
        if (whRes.data.length > 0) setSelectedWarehouse(whRes.data[0]._id);
      }
      if (prodRes.success) setProducts(prodRes.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenNewSo = () => {
    if (customers.length === 0) {
      toast.error('Please add at least one customer first');
      return;
    }
    if (products.length === 0) {
      toast.error('Please create at least one product first');
      return;
    }

    setSelectedCustomer(customers[0]._id);
    setSelectedWarehouse(warehouses.find((w) => w.isDefault)?._id || warehouses[0]?._id);
    setSoLines([{ productId: products[0]._id, orderedQty: 1, unitPrice: (products[0].priceMinor || 0) / 100 }]);
    setNewSoModal(true);
  };

  const handleAddLine = () => {
    const defaultProd = products[0];
    setSoLines([
      ...soLines,
      {
        productId: defaultProd?._id || '',
        orderedQty: 1,
        unitPrice: (defaultProd?.priceMinor || 0) / 100,
      },
    ]);
  };

  const handleRemoveLine = (idx) => {
    if (soLines.length === 1) return;
    setSoLines(soLines.filter((_, i) => i !== idx));
  };

  const handleLineProductChange = (idx, prodId) => {
    const prod = products.find((p) => p._id === prodId);
    const updated = [...soLines];
    updated[idx].productId = prodId;
    if (prod) {
      updated[idx].unitPrice = (prod.priceMinor || 0) / 100;
    }
    setSoLines(updated);
  };

  const handleCreateSo = async (e) => {
    e.preventDefault();
    setSubmittingSo(true);
    try {
      const payload = {
        customerId: selectedCustomer,
        warehouseId: selectedWarehouse,
        lines: soLines.map((l) => ({
          productId: l.productId,
          orderedQty: parseInt(l.orderedQty, 10),
          unitPriceMinor: Math.round(parseFloat(l.unitPrice) * 100),
        })),
      };

      const res = await api.post('/sales-orders', payload);
      if (res.success && res.data._id) {
        // Automatically confirm and reserve stock
        await api.post(`/sales-orders/${res.data._id}/confirm`);
        toast.success(`Sales Order ${res.data.orderNumber} confirmed & stock reserved!`);
        setNewSoModal(false);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create sales order');
    } finally {
      setSubmittingSo(false);
    }
  };

  const handleConfirmAndReserve = async (orderId) => {
    try {
      await api.post(`/sales-orders/${orderId}/confirm`);
      toast.success('Stock reserved for order!');
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Reservation failed - insufficient available stock');
    }
  };

  const handleOpenFulfill = (order) => {
    setActiveOrder(order);
    const initLines = order.lines.map((l) => ({
      productId: l.productId?._id || l.productId,
      name: l.productId?.name,
      orderedQty: l.orderedQty,
      fulfilledQty: l.fulfilledQty,
      remaining: l.orderedQty - l.fulfilledQty,
      fulfillAmount: l.orderedQty - l.fulfilledQty,
    }));
    setFulfillLines(initLines);
    setTrackingNumber(`TRK-${Date.now().toString().slice(-6)}`);
    setFulfillModal(true);
  };

  const handlePostFulfillment = async (e) => {
    e.preventDefault();
    setSubmittingFulfillment(true);
    try {
      await api.post(`/sales-orders/${activeOrder._id}/fulfillments`, {
        carrier,
        trackingNumber,
        lines: fulfillLines.map((l) => ({
          productId: l.productId,
          fulfilledQty: parseInt(l.fulfillAmount, 10),
        })),
      });

      // Also generate invoice if not yet issued
      try {
        await api.post('/invoices', { salesOrderId: activeOrder._id });
      } catch (e) {
        // Invoice may already exist
      }

      toast.success('Order dispatched & stock fulfilled!');
      setFulfillModal(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Fulfillment dispatch failed');
    } finally {
      setSubmittingFulfillment(false);
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Orders</h1>
          <p className="text-sm text-slate-500 mt-1">
            Order-to-cash workflows, inventory reservations, picking/packing, and shipment dispatch.
          </p>
        </div>

        <button
          onClick={handleOpenNewSo}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Sales Order
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
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
                    Loading sales orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No sales orders created yet.
                  </td>
                </tr>
              ) : (
                orders.map((so) => {
                  const canFulfill =
                    so.status === 'RESERVED' || so.status === 'PARTIALLY_FULFILLED';
                  const needsReserve = so.status === 'DRAFT' || so.status === 'CONFIRMED';

                  return (
                    <tr key={so._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-600">
                        {so.orderNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {so.customerId?.name}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {so.warehouseId?.name}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {so.lines?.map((l) => `${l.productId?.name} (${l.fulfilledQty}/${l.orderedQty})`).join(', ')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(so.totalAmountMinor)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            so.status === 'FULFILLED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : so.status === 'RESERVED'
                              ? 'bg-blue-100 text-blue-800'
                              : so.status === 'PARTIALLY_FULFILLED'
                              ? 'bg-indigo-100 text-indigo-800'
                              : so.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {so.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {needsReserve && (
                          <button
                            onClick={() => handleConfirmAndReserve(so._id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-xs"
                          >
                            Reserve Stock
                          </button>
                        )}
                        {canFulfill && (
                          <button
                            onClick={() => handleOpenFulfill(so)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors cursor-pointer shadow-xs"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            Dispatch Fulfillment
                          </button>
                        )}
                        {so.status === 'FULFILLED' && (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center justify-end gap-1">
                            <CheckCircle className="w-4 h-4" /> Dispatched
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

      {/* New SO Modal */}
      {newSoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create New Sales Order</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select customer, warehouse, and products to sell.
                </p>
              </div>
              <button onClick={() => setNewSoModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSo} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Customer
                  </label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.email || 'Customer'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Fulfilling Warehouse
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
                    Order Items
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                {soLines.map((line, idx) => (
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
                          const updated = [...soLines];
                          updated[idx].orderedQty = e.target.value;
                          setSoLines(updated);
                        }}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-center focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="w-28">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Sale Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={line.unitPrice}
                        onChange={(e) => {
                          const updated = [...soLines];
                          updated[idx].unitPrice = e.target.value;
                          setSoLines(updated);
                        }}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white text-right focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    {soLines.length > 1 && (
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
                  onClick={() => setNewSoModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSo}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm shadow-blue-500/20 disabled:opacity-50"
                >
                  {submittingSo ? 'Creating Order...' : 'Confirm Order & Reserve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fulfill Modal */}
      {fulfillModal && activeOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Dispatch Order Fulfillment</h3>
                <span className="text-xs font-mono text-blue-600 font-bold">
                  {activeOrder.orderNumber} • {activeOrder.customerId?.name}
                </span>
              </div>
              <button onClick={() => setFulfillModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostFulfillment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Carrier / Logistics
                  </label>
                  <input
                    type="text"
                    required
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    required
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-xs bg-white font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold uppercase text-slate-700 tracking-wider block">
                  Items to Dispatch
                </span>
                {fulfillLines.map((line, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">{line.name}</span>
                      <span className="text-[11px] text-slate-500">
                        Remaining: {line.remaining}
                      </span>
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        max={line.remaining}
                        required
                        value={line.fulfillAmount}
                        onChange={(e) => {
                          const updated = [...fulfillLines];
                          updated[idx].fulfillAmount = e.target.value;
                          setFulfillLines(updated);
                        }}
                        className="w-full border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-white text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFulfillModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFulfillment}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm shadow-emerald-500/20 disabled:opacity-50"
                >
                  {submittingFulfillment ? 'Fulfilling...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

