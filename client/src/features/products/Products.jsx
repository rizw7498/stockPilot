import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../app/AuthContext';
import { useToast } from '../../app/ToastContext';
import {
  Package,
  Plus,
  Search,
  Filter,
  Warehouse,
  Boxes,
  AlertCircle,
  X,
  ChevronRight,
} from 'lucide-react';

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

  // Stock Detail Modal
  const [stockModalProduct, setStockModalProduct] = useState(null);
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

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
    setStockModalProduct(product);
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

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage product items, SKU records, selling prices, and live stock positions.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add New Product
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, SKU, or barcode..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            Category:
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Sale Price</th>
                <th className="py-3 px-4 text-center">Available Stock</th>
                <th className="py-3 px-4 text-center">Stock Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No products found. Click "Add New Product" to create your first item.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const stock = p.stock || { onHand: 0, reserved: 0, available: 0 };
                  const isLow = stock.available <= (p.reorderLevel || 10);

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-blue-600">
                        {p.sku}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {p.name}
                        {p.barcode && (
                          <span className="block text-[11px] text-slate-400 font-normal">
                            Barcode: {p.barcode}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {p.categoryId?.name || 'General'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                        {formatCurrency(p.costMinor)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(p.priceMinor)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-full ${
                            isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {stock.available} {p.unit || 'pcs'}
                          {isLow && <AlertCircle className="w-3 h-3 text-amber-600" />}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleInspectStock(p)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          <Boxes className="w-3.5 h-3.5" />
                          <span>OnHand: {stock.onHand}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add New Catalog Product</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define SKU details, pricing, and initial opening stock.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. SKU-PROD-101"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm uppercase font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Barcode (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="e.g. 789123456789"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Smart Wireless Earbuds Pro"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Unassigned</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Unit of Measure
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="pcs, box, kg..."
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Cost Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Selling Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 tracking-wider mb-1">
                    Reorder Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                    placeholder="10"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Initial Opening Stock Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-xs font-bold uppercase text-slate-800 tracking-wider block">
                  Initial Opening Stock (Optional)
                </span>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Opening Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.initialStock}
                      onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                      placeholder="e.g. 50"
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Target Warehouse
                    </label>
                    <select
                      value={formData.initialWarehouseId}
                      onChange={(e) =>
                        setFormData({ ...formData, initialWarehouseId: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      {warehouses.map((w) => (
                        <option key={w._id} value={w._id}>
                          {w.name} {w.isDefault ? '(Default)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Creating Product...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Breakdown Modal */}
      {stockModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{stockModalProduct.name}</h3>
                <span className="text-xs font-mono text-blue-600 font-bold">
                  SKU: {stockModalProduct.sku}
                </span>
              </div>
              <button
                onClick={() => setStockModalProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {stockLoading ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Loading warehouse balances...
              </div>
            ) : warehouseStock.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No warehouse stock recorded for this product.
              </div>
            ) : (
              <div className="space-y-3">
                {warehouseStock.map((b) => (
                  <div
                    key={b._id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-800">
                        {b.warehouseId?.name}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Code: {b.warehouseId?.code}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900 block">
                        {b.onHand} onHand
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {b.reserved} reserved • {b.available} available
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

