import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import {
  Package,
  Plus,
  Warehouse,
  Boxes,
  Layers,
  ChevronRight,
  TrendingUp,
  Tag,
  Barcode,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import DataTable from '../../components/ui/DataTable';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import Toolbar from '../../components/ui/Toolbar';
import StatusPill from '../../components/ui/StatusPill';

export default function Products() {
  const { activeOrganization } = useAuth();
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Add Product Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    barcode: '',
    categoryId: '',
    unit: 'pcs',
    cost: '',
    price: '',
    reorderLevel: 10,
    initialStock: '',
    initialWarehouseId: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Stock Detail Drawer
  const [stockDrawerProduct, setStockDrawerProduct] = useState(null);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter) params.categoryId = categoryFilter;

      const [prodRes, catRes, whRes] = await Promise.all([
        api.get('/products', { params }),
        api.get('/categories'),
        api.get('/warehouses'),
      ]);

      if (prodRes.success) setProducts(prodRes.data);
      if (catRes.success) setCategories(catRes.data);
      if (whRes.success) setWarehouses(whRes.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter]);

  const handleOpenAddModal = () => {
    setFormData({
      sku: '',
      name: '',
      barcode: '',
      categoryId: categories[0]?._id || '',
      unit: 'pcs',
      cost: '',
      price: '',
      reorderLevel: 10,
      initialStock: '',
      initialWarehouseId: warehouses.find((w) => w.isDefault)?._id || warehouses[0]?._id || '',
      description: '',
    });
    setModalOpen(true);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!formData.sku || !formData.name) {
      toast.error('SKU and Product Name are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        barcode: formData.barcode.trim(),
        categoryId: formData.categoryId || null,
        unit: formData.unit,
        costMinor: Math.round(parseFloat(formData.cost || '0') * 100),
        priceMinor: Math.round(parseFloat(formData.price || '0') * 100),
        reorderLevel: parseInt(formData.reorderLevel, 10) || 10,
        description: formData.description,
      };

      if (formData.initialStock && parseFloat(formData.initialStock) > 0) {
        payload.initialStock = parseFloat(formData.initialStock);
        payload.initialWarehouseId = formData.initialWarehouseId;
      }

      await api.post('/products', payload);
      toast.success(`Product "${formData.name}" created successfully!`);
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspectStock = async (product) => {
    setStockDrawerProduct(product);
    setStockLoading(true);
    try {
      const res = await api.get(`/products/${product._id}/stock`);
      if (res.success) {
        setWarehouseStock(res.data);
      }
    } catch (err) {
      toast.error('Failed to load warehouse stock balances');
    } finally {
      setStockLoading(false);
    }
  };

  const formatCurrency = (minor = 0) => {
    const symbol = activeOrganization?.currency === 'EUR' ? '€' : '$';
    return `${symbol}${(minor / 100).toFixed(2)}`;
  };

  // Calculate Margin Preview in Modal
  const costNum = parseFloat(formData.cost || '0');
  const priceNum = parseFloat(formData.price || '0');
  const calculatedMargin =
    priceNum > 0 && priceNum >= costNum
      ? Math.round(((priceNum - costNum) / priceNum) * 100)
      : 0;

  // Table Columns
  const columns = [
    {
      key: 'sku',
      header: 'SKU / Barcode',
      render: (sku, row) => (
        <div className="flex flex-col">
          <span className="mono-chip w-fit text-blue-400 font-bold">{sku}</span>
          {row.barcode && (
            <span className="text-[10px] text-slate-500 font-mono mt-0.5">
              {row.barcode}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Product Name',
      render: (name, row) => (
        <div>
          <div className="font-medium text-slate-800 dark:text-slate-100">{name}</div>
          {row.description && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
              {row.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'categoryId',
      header: 'Category',
      render: (cat) => (
        <span className="text-slate-600 dark:text-slate-300 text-xs">
          {cat?.name || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'priceMinor',
      header: 'Price / Cost',
      align: 'right',
      tabular: true,
      render: (price, row) => {
        const margin =
          row.priceMinor > 0 && row.costMinor
            ? Math.round(((row.priceMinor - row.costMinor) / row.priceMinor) * 100)
            : 0;
        return (
          <div className="text-right">
            <div className="font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(price)}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-end gap-1">
              <span>{formatCurrency(row.costMinor)}</span>
              {margin > 0 && <span className="text-emerald-500 dark:text-emerald-400">({margin}%)</span>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'stock',
      header: 'Stock Status',
      align: 'center',
      render: (_, row) => {
        const total = (row.totalOnHand || 0) + (row.initialStock || 0);
        const reorder = row.reorderLevel || 10;
        if (total === 0) return <StatusPill status="OUT_OF_STOCK" label="0 in stock" />;
        if (total <= reorder) return <StatusPill status="LOW_STOCK" label={`${total} ${row.unit}`} />;
        return <StatusPill status="ACTIVE" label={`${total} ${row.unit}`} />;
      },
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleInspectStock(row);
          }}
          className="text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400"
        >
          Balances <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
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
              Product Catalog
            </h1>
            <span className="mono-chip text-[11px] text-slate-500 dark:text-slate-400">
              {products.length} SKUs
            </span>
          </div>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
            Manage SKU records, barcode identifiers, pricing formulas, and warehouse allocations.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={handleOpenAddModal}
        >
          Add Product
        </Button>
      </div>

      {/* Toolbar */}
      <Toolbar
        searchQuery={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          // Trigger search after state update
        }}
        searchPlaceholder="Filter by name, SKU, or barcode... (Press /)"
        filters={[
          {
            id: 'category',
            label: 'Category',
            value: categoryFilter,
            options: [
              { label: 'All Categories', value: '' },
              ...categories.map((c) => ({ label: c.name, value: c._id })),
            ],
            onChange: setCategoryFilter,
          },
        ]}
        activeFilters={
          categoryFilter
            ? [
                {
                  id: 'cat',
                  label: 'Category',
                  value: categories.find((c) => c._id === categoryFilter)?.name || categoryFilter,
                  onRemove: () => setCategoryFilter(''),
                },
              ]
            : []
        }
        onClearAllFilters={() => {
          setSearchTerm('');
          setCategoryFilter('');
        }}
      />

      {/* Products DataTable */}
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        onRowClick={(row) => handleInspectStock(row)}
        emptyTitle="No products found"
        emptyDescription="Get started by creating your first catalog product or adjust your filter search."
        className="flex-1"
      />

      {/* Slide-over Stock Details Drawer */}
      <Drawer
        isOpen={Boolean(stockDrawerProduct)}
        onClose={() => setStockDrawerProduct(null)}
        width="max-w-md"
        title={stockDrawerProduct?.name || 'Stock Balances'}
        subtitle={`SKU: ${stockDrawerProduct?.sku} • Unit: ${stockDrawerProduct?.unit || 'pcs'}`}
        footer={
          <Button
            variant="secondary"
            size="md"
            onClick={() => setStockDrawerProduct(null)}
            className="w-full"
          >
            Close Drawer
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Key Product Metadata */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl glass-3 border border-white/5">
            <div>
              <div className="text-[11px] text-slate-400 font-mono uppercase">Cost Basis</div>
              <div className="text-[15px] font-semibold text-slate-100 font-mono mt-0.5">
                {formatCurrency(stockDrawerProduct?.costMinor)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-mono uppercase">Selling Price</div>
              <div className="text-[15px] font-semibold text-blue-400 font-mono mt-0.5">
                {formatCurrency(stockDrawerProduct?.priceMinor)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-mono uppercase">Reorder Level</div>
              <div className="text-[13px] font-medium text-slate-200 font-mono mt-0.5">
                {stockDrawerProduct?.reorderLevel || 10} {stockDrawerProduct?.unit}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-mono uppercase">Barcode</div>
              <div className="text-[13px] font-medium text-slate-200 font-mono mt-0.5">
                {stockDrawerProduct?.barcode || 'N/A'}
              </div>
            </div>
          </div>

          {/* Warehouse Balances Breakdown */}
          <div className="space-y-3">
            <div className="text-[12px] font-semibold text-slate-200 flex items-center justify-between">
              <span>Warehouse Distribution</span>
              <Warehouse className="w-4 h-4 text-slate-400" />
            </div>

            {stockLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading stock balances...</div>
            ) : warehouseStock.length === 0 ? (
              <div className="p-6 rounded-xl glass-3 border border-white/5 text-center text-xs text-slate-400">
                No active inventory positions recorded across warehouses.
              </div>
            ) : (
              <div className="space-y-2.5">
                {warehouseStock.map((ws) => (
                  <div
                    key={ws.warehouseId?._id || ws._id}
                    className="p-3.5 rounded-xl glass-3 border border-white/5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 text-xs">
                        {ws.warehouseId?.name || 'Warehouse'}
                      </span>
                      <span className="mono-chip text-[10px] text-slate-400">
                        {ws.warehouseId?.code || 'WH'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center font-mono">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase">On Hand</div>
                        <div className="text-[13px] font-semibold text-slate-100">
                          {ws.onHand}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-amber-500/80 uppercase">Reserved</div>
                        <div className="text-[13px] font-semibold text-amber-300">
                          {ws.reserved}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-500/80 uppercase">Available</div>
                        <div className="text-[13px] font-semibold text-emerald-300">
                          {ws.available}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Drawer>

      {/* Add New Product Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-2xl"
        title="Add Catalog Product"
        subtitle="Define SKU codes, pricing, units of measure, and opening inventory"
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
              onClick={handleCreateProduct}
              loading={submitting}
            >
              Create Product
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="SKU Code"
              required
              placeholder="e.g. ELEC-001"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />

            <Input
              label="Product Name"
              required
              placeholder="e.g. Wireless Ergonomic Mouse"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Category"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Input
              label="Barcode / UPC"
              placeholder="e.g. 890123456789"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            />

            <Select
              label="Unit of Measure"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            >
              <option value="pcs">Pieces (pcs)</option>
              <option value="kg">Kilograms (kg)</option>
              <option value="m">Meters (m)</option>
              <option value="box">Boxes (box)</option>
              <option value="set">Sets (set)</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Cost Price ($)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            />

            <Input
              label="Selling Price ($)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />

            <Input
              label="Reorder Level"
              type="number"
              value={formData.reorderLevel}
              onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
              helperText={`Margin: ${calculatedMargin}%`}
            />
          </div>

          {/* Initial Opening Stock Section */}
          <div className="p-4 rounded-xl glass-3 border border-white/5 space-y-3">
            <div className="text-[12px] font-semibold text-slate-200">
              Opening Stock Position (Optional)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Initial Quantity"
                type="number"
                placeholder="0"
                value={formData.initialStock}
                onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
              />

              <Select
                label="Target Warehouse"
                value={formData.initialWarehouseId}
                onChange={(e) => setFormData({ ...formData, initialWarehouseId: e.target.value })}
              >
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <Input
            label="Product Description"
            placeholder="Specifications, supplier notes, or packing details..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
