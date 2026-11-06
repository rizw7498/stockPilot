import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import {
  ShoppingCart,
  Plus,
  CheckCircle,
  Truck,
  Trash2,
  AlertCircle,
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

export default function Sales() {
  const { activeOrganization } = useAuth();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // New SO Drawer
  const [newSoDrawer, setNewSoDrawer] = useState(false);
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

  // Order Details Drawer
  const [viewingOrder, setViewingOrder] = useState(null);

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
    setSoLines([
      {
        productId: products[0]._id,
        orderedQty: 1,
        unitPrice: (products[0].priceMinor || 0) / 100,
      },
    ]);
    setNewSoDrawer(true);
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

  // Live order total
  const calculatedTotal = soLines.reduce(
    (acc, line) => acc + (parseFloat(line.orderedQty) || 0) * (parseFloat(line.unitPrice) || 0),
    0
  );

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
        await api.post(`/sales-orders/${res.data._id}/confirm`);
        toast.success(`Sales Order ${res.data.orderNumber} created & stock reserved!`);
        setNewSoDrawer(false);
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
      fulfilledQty: l.fulfilledQty || 0,
      remaining: l.orderedQty - (l.fulfilledQty || 0),
      fulfillAmount: l.orderedQty - (l.fulfilledQty || 0),
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

      try {
        await api.post('/invoices', { salesOrderId: activeOrder._id });
      } catch (e) {
        // Ignore if invoice already exists
      }

      toast.success('Fulfillment dispatched & inventory updated!');
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

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      !searchTerm ||
      o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'orderNumber',
      header: 'Order #',
      render: (num) => (
        <span className="mono-chip font-bold text-blue-400">{num}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (_, row) => (
        <div>
          <div className="font-medium text-slate-100">{row.customerId?.name || 'Walk-in'}</div>
          {row.customerId?.email && (
            <div className="text-[11px] text-slate-500 font-mono">{row.customerId?.email}</div>
          )}
        </div>
      ),
    },
    {
      key: 'warehouseId',
      header: 'Warehouse',
      render: (wh) => (
        <span className="mono-chip text-slate-300">
          {wh?.code || 'DEFAULT'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Order Date',
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
        <span className="font-semibold text-slate-100">
          {formatCurrency(minor)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Fulfillment Status',
      align: 'center',
      render: (status) => <StatusPill status={status} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {row.status === 'DRAFT' && (
            <Button
              variant="secondary"
              size="sm"
              icon={CheckCircle}
              onClick={() => handleConfirmAndReserve(row._id)}
            >
              Reserve
            </Button>
          )}

          {(row.status === 'RESERVED' || row.status === 'PARTIALLY_DISPATCHED') && (
            <Button
              variant="primary"
              size="sm"
              icon={Truck}
              onClick={() => handleOpenFulfill(row)}
            >
              Dispatch
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewingOrder(row)}
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
              Sales Orders
            </h1>
            <span className="mono-chip text-[11px] text-blue-400">
              {orders.length} Orders
            </span>
          </div>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Manage customer sales orders, real-time stock reservations, and carrier shipments.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={handleOpenNewSo}
        >
          Create Sales Order
        </Button>
      </div>

      {/* Toolbar */}
      <Toolbar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Filter by order # or customer name... (Press /)"
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            options: [
              { label: 'All Statuses', value: '' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Reserved', value: 'RESERVED' },
              { label: 'Partially Dispatched', value: 'PARTIALLY_DISPATCHED' },
              { label: 'Fulfilled', value: 'FULFILLED' },
              { label: 'Cancelled', value: 'CANCELLED' },
            ],
            onChange: setStatusFilter,
          },
        ]}
      />

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        loading={loading}
        onRowClick={(row) => setViewingOrder(row)}
        emptyTitle="No sales orders found"
        emptyDescription="Create your first customer sales order to begin allocating inventory and dispatching goods."
      />

      {/* Create Sales Order Drawer (max-w-2xl) */}
      <Drawer
        isOpen={newSoDrawer}
        onClose={() => setNewSoDrawer(false)}
        width="max-w-2xl"
        title="Create Sales Order"
        subtitle="Customer details, fulfillment location, and line items"
        footer={
          <div className="w-full flex items-center justify-between">
            <div className="text-xs">
              <span className="text-slate-400">Estimated Total: </span>
              <span className="font-mono text-base font-semibold text-slate-100 ml-1">
                {activeOrganization?.currency === 'EUR' ? '€' : '$'}
                {calculatedTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setNewSoDrawer(false)}
                disabled={submittingSo}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateSo}
                loading={submittingSo}
              >
                Confirm & Reserve Stock
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleCreateSo} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Customer Account"
              required
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.email || 'No email'})
                </option>
              ))}
            </Select>

            <Select
              label="Fulfillment Warehouse"
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
              <span className="text-[12px] font-semibold text-slate-200">Order Lines</span>
              <Button variant="ghost" size="sm" icon={Plus} onClick={handleAddLine}>
                Add Line
              </Button>
            </div>

            <div className="space-y-2">
              {soLines.map((line, idx) => (
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
                        const updated = [...soLines];
                        updated[idx].orderedQty = e.target.value;
                        setSoLines(updated);
                      }}
                    />
                  </div>

                  <div className="w-28">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={line.unitPrice}
                      onChange={(e) => {
                        const updated = [...soLines];
                        updated[idx].unitPrice = e.target.value;
                        setSoLines(updated);
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    disabled={soLines.length === 1}
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

      {/* Dispatch / Fulfillment Modal */}
      <Modal
        isOpen={fulfillModal}
        onClose={() => setFulfillModal(false)}
        maxWidth="max-w-xl"
        title={`Dispatch Order: ${activeOrder?.orderNumber}`}
        subtitle="Record carrier tracking and decrement reserved warehouse inventory"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setFulfillModal(false)}
              disabled={submittingFulfillment}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePostFulfillment}
              loading={submittingFulfillment}
            >
              Confirm Dispatch
            </Button>
          </>
        }
      >
        <form onSubmit={handlePostFulfillment} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Shipping Carrier"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            >
              <option value="DHL Express">DHL Express</option>
              <option value="FedEx Ground">FedEx Ground</option>
              <option value="UPS Next Day">UPS Next Day</option>
              <option value="Local Courier">Local Delivery Fleet</option>
            </Select>

            <Input
              label="Tracking Number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2 pt-2">
            <div className="text-[12px] font-semibold text-slate-200">
              Line Dispatch Allocation
            </div>
            {fulfillLines.map((line, idx) => (
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
                    value={line.fulfillAmount}
                    onChange={(e) => {
                      const updated = [...fulfillLines];
                      updated[idx].fulfillAmount = e.target.value;
                      setFulfillLines(updated);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </form>
      </Modal>

      {/* Order Details Drawer */}
      <Drawer
        isOpen={Boolean(viewingOrder)}
        onClose={() => setViewingOrder(null)}
        width="max-w-md"
        title={`Sales Order ${viewingOrder?.orderNumber}`}
        subtitle={`Created on ${new Date(viewingOrder?.createdAt || Date.now()).toLocaleDateString()}`}
        footer={
          <Button
            variant="secondary"
            size="md"
            onClick={() => setViewingOrder(null)}
            className="w-full"
          >
            Close
          </Button>
        }
      >
        <div className="space-y-6">
          <div className="p-4 rounded-xl glass-3 border border-white/5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Customer:</span>
              <span className="font-semibold text-slate-200">
                {viewingOrder?.customerId?.name || 'Walk-in'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Warehouse:</span>
              <span className="mono-chip text-slate-300">
                {viewingOrder?.warehouseId?.name}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Total Value:</span>
              <span className="font-mono font-semibold text-slate-100 text-sm">
                {formatCurrency(viewingOrder?.totalAmountMinor)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Fulfillment Status:</span>
              <StatusPill status={viewingOrder?.status} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-[12px] font-semibold text-slate-200">Order Lines</div>
            <div className="space-y-2">
              {viewingOrder?.lines?.map((line, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg glass-3 border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-medium text-slate-200">
                      {line.productId?.name || 'Product Item'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {line.orderedQty} units @ {formatCurrency(line.unitPriceMinor)}
                    </div>
                  </div>
                  <div className="font-mono font-semibold text-slate-100">
                    {formatCurrency(line.orderedQty * line.unitPriceMinor)}
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
