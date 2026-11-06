import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import {
  Boxes,
  History,
  SlidersHorizontal,
  AlertTriangle,
  Plus,
  X,
  Warehouse,
  CheckCircle2,
} from 'lucide-react';

export default function Inventory() {
  const { activeOrganization } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('balances'); // 'balances' | 'ledger' | 'lowstock'
  const [balances, setBalances] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Adjustment Modal
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [adjWarehouseId, setAdjWarehouseId] = useState('');
  const [adjProductId, setAdjProductId] = useState('');
  const [countedQty, setCountedQty] = useState('');
  const [adjReason, setAdjReason] = useState('Physical Stock Count');
  const [submittingAdj, setSubmittingAdj] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balRes, ledRes, lowRes, whRes, prodRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/ledger'),
        api.get('/inventory/low-stock'),
        api.get('/warehouses'),
        api.get('/products'),
      ]);

      if (balRes.success) setBalances(balRes.data);
      if (ledRes.success) setLedger(ledRes.data);
      if (lowRes.success) setLowStockItems(lowRes.data);
      if (whRes.success) {
        setWarehouses(whRes.data);
        if (whRes.data.length > 0) setAdjWarehouseId(whRes.data[0]._id);
      }
      if (prodRes.success) {
        setProducts(prodRes.data);
        if (prodRes.data.length > 0) setAdjProductId(prodRes.data[0]._id);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePostAdjustment = async (e) => {
    e.preventDefault();
    if (!adjWarehouseId || !adjProductId || countedQty === '') {
      toast.error('All adjustment fields are required');
      return;
    }

    setSubmittingAdj(true);
    try {
      // 1. Create adjustment
      const createRes = await api.post('/inventory/adjustments', {
        warehouseId: adjWarehouseId,
        reason: adjReason,
        lines: [
          {
            productId: adjProductId,
            countedQty: parseFloat(countedQty),
          },
        ],
      });

      // 2. Approve and apply adjustment immediately
      if (createRes.success && createRes.data._id) {
        await api.post(`/inventory/adjustments/${createRes.data._id}/approve`);
        toast.success('Stock adjustment approved and posted to ledger!');
        setAdjModalOpen(false);
        setCountedQty('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to post adjustment');
    } finally {
      setSubmittingAdj(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Inventory & Stock Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time warehouse balances and immutable double-entry stock movement ledger.
          </p>
        </div>

        <button
          onClick={() => setAdjModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Stock Adjustment
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('balances')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'balances'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Warehouse Balances ({balances.length})
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          Stock Movement Ledger ({ledger.length})
        </button>

        <button
          onClick={() => setActiveTab('lowstock')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'lowstock'
              ? 'border-amber-500 text-amber-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Low Stock Alerts ({lowStockItems.length})
        </button>
      </div>

      {/* Tab 1: Balances */}
      {activeTab === 'balances' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4 text-center">Physically On Hand</th>
                  <th className="py-3 px-4 text-center">Reserved for Orders</th>
                  <th className="py-3 px-4 text-center">Available for Sale</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading stock balances...
                    </td>
                  </tr>
                ) : balances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No stock balances registered yet.
                    </td>
                  </tr>
                ) : (
                  balances.map((b) => {
                    const isLow = b.available <= (b.productId?.reorderLevel || 10);
                    return (
                      <tr key={b._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {b.warehouseId?.name}
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {b.warehouseId?.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-blue-600">
                          {b.productId?.sku}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {b.productId?.name}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                          {b.onHand} {b.productId?.unit}
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-indigo-600">
                          {b.reserved} {b.productId?.unit}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-extrabold text-sm text-emerald-700">
                            {b.available} {b.productId?.unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isLow ? 'Low Stock' : 'Optimal'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Movement Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4 text-center">Quantity Delta</th>
                  <th className="py-3 px-4 text-center">Before $\rightarrow$ After OnHand</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                      Loading ledger movements...
                    </td>
                  </tr>
                ) : ledger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  ledger.map((m) => {
                    const isPositive = m.quantity > 0;
                    return (
                      <tr key={m._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(m.occurredAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-sans font-medium text-slate-800">
                          {m.warehouseId?.name}
                        </td>
                        <td className="py-3.5 px-4 font-sans font-semibold text-slate-900">
                          {m.productId?.name}
                          <span className="text-[10px] text-blue-600 block font-mono">
                            {m.productId?.sku}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            {m.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold">
                          <span
                            className={isPositive ? 'text-emerald-600' : 'text-rose-600'}
                          >
                            {isPositive ? `+${m.quantity}` : m.quantity}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                          {m.beforeOnHand} $\rightarrow$ <span className="font-bold text-slate-900">{m.afterOnHand}</span>
                        </td>
                        <td className="py-3.5 px-4 font-sans text-xs text-slate-500">
                          {m.reason || 'Standard operational transaction'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Low Stock Alerts */}
      {activeTab === 'lowstock' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-amber-50/60 border-b border-amber-100 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-900 font-medium">
              The products listed below have available inventory at or below their configured reorder
              levels. Use Purchase Orders to replenish.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4 text-center">Available Quantity</th>
                  <th className="py-3 px-4 text-center">Reorder Threshold</th>
                  <th className="py-3 px-4 text-center">Suggested Reorder Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      All products currently have healthy stock levels above reorder points!
                    </td>
                  </tr>
                ) : (
                  lowStockItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.product?.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-blue-600 font-semibold">
                        {item.product?.sku}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-rose-600 text-sm">
                        {item.totalAvailable} {item.product?.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-500">
                        {item.reorderLevel}
                      </td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-blue-600">
                        +{item.suggestedReorderQty} {item.product?.unit}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">New Stock Adjustment</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reconcile physically counted warehouse inventory.
                </p>
              </div>
              <button
                onClick={() => setAdjModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                  Warehouse
                </label>
                <select
                  value={adjWarehouseId}
                  onChange={(e) => setAdjWarehouseId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
                  Product Item
                </label>
                <select
                  value={adjProductId}
                  onChange={(e) => setAdjProductId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
                  Physically Counted Quantity *
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={countedQty}
                  onChange={(e) => setCountedQty(e.target.value)}
                  placeholder="Enter exact count in warehouse..."
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                  Adjustment Reason
                </label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Periodic stock count or damage write-off"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdj}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-colors"
                >
                  {submittingAdj ? 'Posting Adjustment...' : 'Approve & Post Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

