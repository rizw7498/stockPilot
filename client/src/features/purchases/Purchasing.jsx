import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import {
  Truck,
  Plus,
  CheckCircle,
  Inbox,
  Trash2,
  ChevronRight,
  Package,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import DataTable from '../../components/ui/DataTable';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import StatusPill from '../../components/ui/StatusPill';
import Toolbar from '../../components/ui/Toolbar';

export default function Purchasing() {
  const { activeOrganization } = useAuth();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // New PO Drawer
  const [newPoDrawer, setNewPoDrawer] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [poLines, setPoLines] = useState([{ productId: '', orderedQty: 10, unitCost: 0 }]);
  const [submittingPo, setSubmittingPo] = useState(false);

  // Receive Goods Modal
  const [receiveModal, setReceiveModal] = useState(false);
  const [activePo, setActivePo] = useState(null);
  const [receiptLines, setReceiptLines] = useState([]);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  // Viewing PO Detail Drawer
  const [viewingPo, setViewingPo] = useState(null);

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
      if (prodRes.success) setProducts(prodRes.data);
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
      toast.error('Please add at least one supplier first');
      return;
    }
    if (products.length === 0) {
      toast.error('Please create at least one product first');
      return;
    }

    setSelectedSupplier(suppliers[0]._id);
    setSelectedWarehouse(warehouses.find((w) => w.isDefault)?._id || warehouses[0]?._id);
    setPoLines([
      {
        productId: products[0]._id,
        orderedQty: 10,
        unitCost: (products[0].costMinor || 0) / 100,
      },
    ]);
    setNewPoDrawer(true);
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

  const calculatedTotal = poLines.reduce(
    (acc, line) => acc + (parseFloat(line.orderedQty) || 0) * (parseFloat(line.unitCost) || 0),
    0
  );

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
        await api.post(`/purchase-orders/${res.data._id}/confirm`);
        toast.success(`Purchase Order ${res.data.poNumber} created and confirmed!`);
        setNewPoDrawer(false);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create purchase order');
    } finally {
      setSubmittingPo(false);
    }
  };

  const handleOpenReceive = (po) => {
    setActivePo(po);
    const initLines = po.lines.map((l) => ({
      productId: l.productId?._id || l.productId,
      name: l.productId?.name,
      orderedQty: l.orderedQty,
      receivedQty: l.receivedQty || 0,
      remaining: l.orderedQty - (l.receivedQty || 0),
      receiveAmount: l.orderedQty - (l.receivedQty || 0),
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
          receivedQty: parseInt(l.receiveAmount, 10),
        })),
      });

      toast.success('Goods received & stock balances credited to warehouse!');
      setReceiveModal(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Failed to post goods receipt');
    } finally {
      setSubmittingReceipt(false);
    }
  };

  const formatCurrency = (minor = 0) => {
    const symbol = activeOrganization?.currency === 'EUR' ? '€' : '$';
    return `${symbol}${(minor / 100).toFixed(2)}`;
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !searchTerm ||
      o.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.supplierId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'poNumber',
      header: 'PO Number',
      render: (num) => (
        <span className="mono-chip font-bold text-blue-400">{num}</span>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (_, row) => (
        <div>
          <div className="font-medium text-slate-100">{row.supplierId?.name || 'Supplier'}</div>
          {row.supplierId?.contactPerson && (
            <div className="text-[11px] text-slate-500 font-mono">{row.supplierId?.contactPerson}</div>
          )}
        </div>
      ),
    },
    {
      key: 'warehouseId',
      header: 'Destination WH',
      render: (wh) => (
        <span className="mono-chip text-slate-300">
          {wh?.code || 'DEFAULT'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Issue Date',
      render: (date) => (
        <span className="text-xs text-slate-400 font-mono">
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'totalAmountMinor',
      header: 'Total Cost',
      align: 'right',
      tabular: true,
      render: (minor) => (
        <span className="font-semibold text-slate-100">
          {formatCurrency(minor)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Receipt Status',
      align: 'center',
      render: (status) => <StatusPill status={status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {(row.status === 'ORDERED' || row.status === 'PARTIALLY_RECEIVED') && (
            <Button
              variant="primary"
              size="sm"
              icon={Inbox}
              onClick={() => handleOpenReceive(row)}
            >
              Receive Goods
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewingPo(row)}
          >
            Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-semibold tracking-tight text-slate-100">
              Purchase Orders
            </h1>
            <span className="mono-chip text-[11px] text-blue-400">
              {orders.length} Orders
            </span>
          </div>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Procure stock inventory, track vendor purchase orders, and record warehouse dock receipts.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={handleOpenNewPo}
        >
          Create PO
        </Button>
      </div>

      {/* Toolbar */}
      <Toolbar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filter by PO # or supplier name... (Press /)"
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            options: [
              { label: 'All Statuses', value: '' },
              { label: 'Ordered', value: 'ORDERED' },
              { label: 'Partially Received', value: 'PARTIALLY_RECEIVED' },
              { label: 'Received', value: 'RECEIVED' },
              { label: 'Cancelled', value: 'CANCELLED' },
            ],
            onChange: setStatusFilter,
          },
        ]}
      />

      {/* PO DataTable */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        loading={loading}
        onRowClick={(row) => setViewingPo(row)}
        emptyTitle="No purchase orders found"
        emptyDescription="Create your first vendor purchase order to replenish stock across warehouses."
      />

      {/* Create Purchase Order Drawer */}
      <Drawer
        isOpen={newPoDrawer}
        onClose={() => setNewPoDrawer(false)}
        width="max-w-2xl"
        title="Create Purchase Order"
        subtitle="Vendor procurement, line item costs, and target dock"
        footer={
          <div className="w-full flex items-center justify-between">
            <div className="text-xs">
              <span className="text-slate-400">Total Purchase Commitment: </span>
              <span className="font-mono text-base font-semibold text-slate-100 ml-1">
                {activeOrganization?.currency === 'EUR' ? '€' : '$'}
                {calculatedTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setNewPoDrawer(false)}
                disabled={submittingPo}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreatePo}
                loading={submittingPo}
              >
                Issue Purchase Order
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleCreatePo} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Vendor / Supplier"
              required
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.contactPerson || 'Vendor'})
                </option>
              ))}
            </Select>

            <Select
              label="Receiving Warehouse"
              required
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
            >
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </Select>
          </div>

          {/* Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-slate-200">PO Items</span>
              <Button variant="ghost" size="sm" icon={Plus} onClick={handleAddLine}>
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {poLines.map((line, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl glass-3 border border-white/5 flex items-center gap-3"
                >
                  <div className="flex-1">
                    <Select
                      value={line.productId}
                      onChange={(e) => handleLineProductChange(idx, e.target.value)}
                    >
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.sku} - {p.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="w-24">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={line.orderedQty}
                      onChange={(e) => {
                        const updated = [...poLines];
                        updated[idx].orderedQty = e.target.value;
                        setPoLines(updated);
                      }}
                    />
                  </div>

                  <div className="w-28">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Unit Cost"
                      value={line.unitCost}
                      onChange={(e) => {
                        const updated = [...poLines];
                        updated[idx].unitCost = e.target.value;
                        setPoLines(updated);
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    disabled={poLines.length === 1}
                    className="p-2 text-slate-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Drawer>

      {/* Receive Goods Modal */}
      <Modal
        isOpen={receiveModal}
        onClose={() => setReceiveModal(false)}
        maxWidth="max-w-xl"
        title={`Receive Goods: ${activePo?.poNumber}`}
        subtitle="Record warehouse dock intake and increment inventory ledger"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setReceiveModal(false)}
              disabled={submittingReceipt}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePostReceipt}
              loading={submittingReceipt}
            >
              Confirm Dock Receipt
            </Button>
          </>
        }
      >
        <form onSubmit={handlePostReceipt} className="space-y-4">
          <div className="space-y-2">
            <div className="text-[12px] font-semibold text-slate-200">
              Receiving Item Quantities
            </div>
            {receiptLines.map((line, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg glass-3 border border-white/5 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-xs font-medium text-slate-200">{line.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Ordered: {line.orderedQty} | Remaining: {line.remaining}
                  </div>
                </div>

                <div className="w-24">
                  <Input
                    type="number"
                    max={line.remaining}
                    min="1"
                    value={line.receiveAmount}
                    onChange={(e) => {
                      const updated = [...receiptLines];
                      updated[idx].receiveAmount = e.target.value;
                      setReceiptLines(updated);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </form>
      </Modal>

      {/* Purchase Order Details Drawer */}
      <Drawer
        isOpen={Boolean(viewingPo)}
        onClose={() => setViewingPo(null)}
        width="max-w-md"
        title={`Purchase Order ${viewingPo?.poNumber}`}
        subtitle={`Issued on ${new Date(viewingPo?.createdAt || Date.now()).toLocaleDateString()}`}
        footer={
          <Button
            variant="secondary"
            size="md"
            onClick={() => setViewingPo(null)}
            className="w-full"
          >
            Close
          </Button>
        }
      >
        <div className="space-y-6">
          <div className="p-4 rounded-xl glass-3 border border-white/5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Supplier:</span>
              <span className="font-semibold text-slate-200">
                {viewingPo?.supplierId?.name || 'Vendor'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Dock Warehouse:</span>
              <span className="mono-chip text-slate-300">
                {viewingPo?.warehouseId?.name}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Total PO Value:</span>
              <span className="font-mono font-semibold text-slate-100 text-sm">
                {formatCurrency(viewingPo?.totalAmountMinor)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Status:</span>
              <StatusPill status={viewingPo?.status} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-[12px] font-semibold text-slate-200">PO Line Items</div>
            <div className="space-y-2">
              {viewingPo?.lines?.map((line, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg glass-3 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-medium text-slate-200">
                      {line.productId?.name || 'Product'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {line.orderedQty} ordered • {line.receivedQty || 0} received
                    </div>
                  </div>
                  <div className="font-mono font-semibold text-slate-100">
                    {formatCurrency(line.orderedQty * line.unitCostMinor)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
