import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import {
  Boxes,
  History,
  SlidersHorizontal,
  AlertTriangle,
  Plus,
  Warehouse,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Truck,
  ArrowUpRight,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Tabs from '../../components/ui/Tabs';
import DataTable from '../../components/ui/DataTable';
import Drawer from '../../components/ui/Drawer';
import StatusPill from '../../components/ui/StatusPill';

export default function Inventory() {
  const { activeOrganization } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('balances'); // 'balances' | 'ledger' | 'lowstock'
  const [balances, setBalances] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Warehouse Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  // Adjustment Drawer
  const [adjDrawerOpen, setAdjDrawerOpen] = useState(false);
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

  // Compute Current System Stock for Selected Item in Adjustment Form
  const selectedBalanceRecord = balances.find(
    (b) =>
      (b.warehouseId?._id === adjWarehouseId || b.warehouseId === adjWarehouseId) &&
      (b.productId?._id === adjProductId || b.productId === adjProductId)
  );
  const currentSystemQty = selectedBalanceRecord?.onHand || 0;
  const countedNum = countedQty === '' ? null : parseFloat(countedQty);
  const varianceQty = countedNum !== null ? countedNum - currentSystemQty : 0;

  const handlePostAdjustment = async (e) => {
    e.preventDefault();
    if (!adjWarehouseId || !adjProductId || countedQty === '') {
      toast.error('All adjustment fields are required');
      return;
    }

    setSubmittingAdj(true);
    try {
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

      if (createRes.success && createRes.data._id) {
        await api.post(`/inventory/adjustments/${createRes.data._id}/approve`);
        toast.success('Stock adjustment approved and posted to ledger!');
        setAdjDrawerOpen(false);
        setCountedQty('');
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to post adjustment');
    } finally {
      setSubmittingAdj(false);
    }
  };

  // Filtered Balances
  const filteredBalances = balances.filter((b) => {
    const matchesWarehouse = !warehouseFilter || b.warehouseId?._id === warehouseFilter;
    const matchesSearch =
      !searchTerm ||
      b.productId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.productId?.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesWarehouse && matchesSearch;
  });

  // Table Columns for Warehouse Balances
  const balanceColumns = [
    {
      key: 'warehouse',
      header: 'Warehouse',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <span className="mono-chip font-bold text-slate-300">
            {row.warehouseId?.code || 'WH'}
          </span>
          <span className="text-xs text-slate-300 truncate">
            {row.warehouseId?.name}
          </span>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product SKU & Name',
      render: (_, row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="mono-chip text-blue-400 font-bold">
              {row.productId?.sku}
            </span>
            <span className="text-xs font-medium text-slate-100">
              {row.productId?.name}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'onHand',
      header: 'On Hand',
      align: 'right',
      tabular: true,
      render: (val, row) => (
        <span className="font-semibold text-slate-100">
          {val} {row.productId?.unit || 'pcs'}
        </span>
      ),
    },
    {
      key: 'reserved',
      header: 'Reserved',
      align: 'right',
      tabular: true,
      render: (val, row) => (
        <span className="font-semibold text-amber-400">
          {val} {row.productId?.unit || 'pcs'}
        </span>
      ),
    },
    {
      key: 'available',
      header: 'Available',
      align: 'right',
      tabular: true,
      render: (val, row) => (
        <span className="font-semibold text-emerald-400">
          {val} {row.productId?.unit || 'pcs'}
        </span>
      ),
    },
  ];

  // Table Columns for Movement Ledger
  const ledgerColumns = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (date) => (
        <span className="text-xs text-slate-400 font-mono">
          {new Date(date).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Transaction Type',
      render: (type) => {
        const isPositive =
          type.includes('RECEIPT') || type.includes('TRANSFER_IN') || type.includes('RETURN');
        return (
          <span
            className={`mono-chip text-[10px] font-bold ${
              isPositive ? 'text-emerald-300 bg-emerald-500/10' : 'text-amber-300 bg-amber-500/10'
            }`}
          >
            {type}
          </span>
        );
      },
    },
    {
      key: 'product',
      header: 'Product',
      render: (_, row) => (
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-blue-400 font-semibold">{row.productId?.sku}</span>
          <span className="text-slate-400 truncate max-w-[140px]">{row.productId?.name}</span>
        </div>
      ),
    },
    {
      key: 'warehouse',
      header: 'Warehouse',
      render: (_, row) => (
        <span className="mono-chip text-[10px] text-slate-300">
          {row.warehouseId?.code || 'WH'}
        </span>
      ),
    },
    {
      key: 'quantityDelta',
      header: 'Delta Qty',
      align: 'right',
      tabular: true,
      render: (delta) => {
        const isPositive = delta > 0;
        return (
          <span
            className={`font-mono font-bold text-xs inline-flex items-center gap-1 ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {delta}
          </span>
        );
      },
    },
    {
      key: 'referenceNumber',
      header: 'Reference',
      align: 'right',
      render: (ref) => (
        <span className="mono-chip text-[10px] text-slate-400">
          {ref || 'MANUAL'}
        </span>
      ),
    },
  ];

  // Table Columns for Low Stock Alerts
  const lowStockColumns = [
    {
      key: 'sku',
      header: 'SKU',
      render: (_, row) => (
        <span className="mono-chip font-bold text-amber-400">{row.sku}</span>
      ),
    },
    {
      key: 'name',
      header: 'Product Name',
      render: (name) => <span className="font-medium text-slate-100">{name}</span>,
    },
    {
      key: 'currentStock',
      header: 'Current Stock',
      align: 'right',
      tabular: true,
      render: (val, row) => (
        <span className="font-semibold text-rose-400">
          {val} {row.unit}
        </span>
      ),
    },
    {
      key: 'reorderLevel',
      header: 'Reorder Level',
      align: 'right',
      tabular: true,
      render: (val, row) => (
        <span className="text-slate-400 font-mono">
          {val} {row.unit}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Alert Level',
      align: 'center',
      render: () => <StatusPill status="LOW_STOCK" label="Critical Deficit" />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: () => (
        <Button
          variant="secondary"
          size="sm"
          icon={Truck}
          onClick={() => navigate('/purchases')}
        >
          Create PO
        </Button>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/5 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[20px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Inventory & Ledger Engine
            </h1>
            <span className="mono-chip text-[11px] text-emerald-500 dark:text-emerald-400">Append-Only Audit</span>
          </div>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time on-hand positions, multi-warehouse allocations, and tamper-evident transaction logs.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={SlidersHorizontal}
          onClick={() => setAdjDrawerOpen(true)}
        >
          Stock Adjustment
        </Button>
      </div>

      {/* Tabs */}
      <div className="shrink-0">
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'balances', label: 'Warehouse Balances', count: balances.length, icon: Boxes },
            { id: 'ledger', label: 'Movement Ledger', count: ledger.length, icon: History },
            { id: 'lowstock', label: 'Low Stock Alerts', count: lowStockItems.length, icon: AlertTriangle },
          ]}
        />
      </div>

      {/* Tab 1: Balances */}
      {activeTab === 'balances' && (
        <div className="flex-1 flex flex-col min-h-0 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search balances by SKU or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 px-3 text-[12px] rounded-lg glass-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200/80 dark:border-white/10 focus:border-blue-500/60 outline-none w-72"
              />

              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="h-9 px-3 text-[12px] rounded-lg glass-3 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 outline-none cursor-pointer [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-900 dark:[&>option]:text-slate-100"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DataTable
            columns={balanceColumns}
            data={filteredBalances}
            loading={loading}
            emptyTitle="No stock balances found"
            emptyDescription="No warehouse positions currently match your selected filters."
            className="flex-1"
          />
        </div>
      )}

      {/* Tab 2: Movement Ledger */}
      {activeTab === 'ledger' && (
        <DataTable
          columns={ledgerColumns}
          data={ledger}
          loading={loading}
          emptyTitle="No stock transactions recorded"
          emptyDescription="Audit records will automatically stream here when receipts, dispatches, or adjustments occur."
          className="flex-1"
        />
      )}

      {/* Tab 3: Low Stock Alerts */}
      {activeTab === 'lowstock' && (
        <DataTable
          columns={lowStockColumns}
          data={lowStockItems}
          loading={loading}
          emptyTitle="Inventory levels healthy"
          emptyDescription="All catalog products are currently operating safely above their configured reorder levels."
          className="flex-1"
        />
      )}

      {/* Stock Adjustment Drawer */}
      <Drawer
        isOpen={adjDrawerOpen}
        onClose={() => setAdjDrawerOpen(false)}
        width="max-w-md"
        title="Physical Stock Adjustment"
        subtitle="Post a verified cycle-count or variance adjustment to the audit ledger"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setAdjDrawerOpen(false)}
              disabled={submittingAdj}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePostAdjustment}
              loading={submittingAdj}
            >
              Post Adjustment
            </Button>
          </>
        }
      >
        <form onSubmit={handlePostAdjustment} className="space-y-4">
          <Select
            label="Warehouse Node"
            required
            value={adjWarehouseId}
            onChange={(e) => setAdjWarehouseId(e.target.value)}
          >
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name} ({w.code})
              </option>
            ))}
          </Select>

          <Select
            label="Product SKU"
            required
            value={adjProductId}
            onChange={(e) => setAdjProductId(e.target.value)}
          >
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.sku} - {p.name}
              </option>
            ))}
          </Select>

          {/* Variance Calculation Card */}
          <div className="p-4 rounded-xl glass-3 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Current System Stock:</span>
              <span className="font-mono text-slate-200 font-bold">
                {currentSystemQty} units
              </span>
            </div>

            <div className="flex justify-between text-xs text-slate-400">
              <span>Calculated Ledger Variance:</span>
              <span
                className={`font-mono font-bold ${
                  varianceQty > 0
                    ? 'text-emerald-400'
                    : varianceQty < 0
                    ? 'text-rose-400'
                    : 'text-slate-400'
                }`}
              >
                {varianceQty > 0 ? `+${varianceQty}` : varianceQty} units
              </span>
            </div>
          </div>

          <Input
            label="Physically Counted Quantity"
            type="number"
            required
            placeholder="e.g. 45"
            value={countedQty}
            onChange={(e) => setCountedQty(e.target.value)}
            helperText="The new total on-hand quantity verified by warehouse staff"
          />

          <Select
            label="Adjustment Reason"
            value={adjReason}
            onChange={(e) => setAdjReason(e.target.value)}
          >
            <option value="Physical Stock Count">Physical Stock Count / Cycle Audit</option>
            <option value="Damaged Goods Write-off">Damaged Goods Write-off</option>
            <option value="Shrinkage / Loss">Shrinkage / Loss</option>
            <option value="Supplier Overage">Supplier Overage Correction</option>
          </Select>
        </form>
      </Drawer>
    </div>
  );
}
