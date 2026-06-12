import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Database, 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  X, 
  Search, 
  AlertCircle, 
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Tag,
  FileSpreadsheet
} from 'lucide-react';

export default function ProductMaster() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [productModal, setProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Form fields
  const [productNameInput, setProductNameInput] = useState('');
  const [ornamentTypeInput, setOrnamentTypeInput] = useState('Ring');
  const [goldWeightInput, setGoldWeightInput] = useState('');
  const [makingChargeInput, setMakingChargeInput] = useState('');
  const [gstPercentInput, setGstPercentInput] = useState('3.0');
  const [statusInput, setStatusInput] = useState('Active');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const PREDEFINED_ORNAMENTS = [
    "Necklace", "Bangle", "Ring", "Chain", "Earrings", "Bracelet", 
    "Pendant", "Coin", "Anklet", "Haram", "Nose Pin", "Bridal Set", 
    "Mangalsutra", "Kada", "Custom Item"
  ];

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch products registry from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setSelectedProduct(null);
    setProductNameInput('');
    setOrnamentTypeInput('Ring');
    setGoldWeightInput('');
    setMakingChargeInput('');
    setGstPercentInput('3.0');
    setStatusInput('Active');
    setError('');
    setProductModal(true);
  };

  const openEditModal = (prod) => {
    setSelectedProduct(prod);
    setProductNameInput(prod.product_name);
    setOrnamentTypeInput(prod.ornament_type);
    setGoldWeightInput(prod.default_gold_weight.toString());
    setMakingChargeInput(prod.default_making_charge.toString());
    setGstPercentInput(prod.gst_percent.toString());
    setStatusInput(prod.status);
    setError('');
    setProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!productNameInput.trim()) {
      setError('Product Name is required.');
      return;
    }

    const payload = {
      product_name: productNameInput.trim(),
      ornament_type: ornamentTypeInput,
      default_gold_weight: parseFloat(goldWeightInput) || 0.0,
      default_making_charge: parseFloat(makingChargeInput) || 0.0,
      gst_percent: parseFloat(gstPercentInput) || 3.0,
      status: statusInput
    };

    try {
      if (selectedProduct) {
        await api.put(`/products/${selectedProduct.product_id}`, payload);
        setSuccess(`Product '${payload.product_name}' updated successfully.`);
      } else {
        await api.post('/products', payload);
        setSuccess(`Product '${payload.product_name}' added to registry.`);
      }
      setProductModal(false);
      fetchProducts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to save product details.');
    }
  };

  const handleDeleteProduct = async (prod) => {
    if (!window.confirm(`Are you sure you want to permanently delete product '${prod.product_name}'?`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await api.delete(`/products/${prod.product_id}`);
      setSuccess(`Product '${prod.product_name}' deleted successfully.`);
      fetchProducts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to delete product.');
    }
  };

  const handleToggleStatus = async (prod) => {
    setError('');
    setSuccess('');
    const newStatus = prod.status === 'Active' ? 'Disabled' : 'Active';
    try {
      await api.put(`/products/${prod.product_id}`, {
        status: newStatus
      });
      setSuccess(`Product '${prod.product_name}' status updated to ${newStatus}.`);
      fetchProducts();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to update product status.');
    }
  };

  const filteredProducts = products.filter(p => 
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.ornament_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-205 dark:border-slate-850 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-slate-850 dark:text-white flex items-center gap-2">
            <Database className="w-8 h-8 text-blue-650 dark:text-blue-400" />
            Product Master Catalog
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define standard showroom products, configure default weights, gold standards, making charges, and compliance tax parameters.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            to="/import-data" 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-green-500/15"
          >
            <FileSpreadsheet className="w-4 h-4" /> 
            Bulk Upload Excel
          </Link>
          <button 
            onClick={openAddModal} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-blue-500/15"
          >
            <Plus className="w-4 h-4" /> 
            Add Product
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 p-3.5 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-755 dark:text-red-400 p-3.5 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Statistics dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold block">Total Products</span>
            <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white">{products.length}</h3>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400">
            <Tag className="w-5 h-5" />
          </div>
        </div>
        <div className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold block">Active Designs</span>
            <h3 className="text-2xl font-extrabold text-green-600 dark:text-green-400">
              {products.filter(p => p.status === 'Active').length}
            </h3>
          </div>
          <div className="p-2.5 bg-green-50 dark:bg-green-950/40 rounded-lg text-green-600 dark:text-green-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold block">Unique Categories</span>
            <h3 className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
              {new Set(products.map(p => p.ornament_type)).size}
            </h3>
          </div>
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 rounded-lg text-purple-600 dark:text-purple-400">
            <Database className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and search toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by product name or ornament type..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-850 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>
        <button 
          onClick={fetchProducts}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-350 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh List
        </button>
      </div>

      {/* Product table */}
      {loading ? (
        <div className="py-24 text-center text-blue-600 dark:text-blue-400 space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-sm font-semibold">Loading product master registry...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-xl shadow-xs overflow-hidden blue-glow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/50">
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-5">Product Name</th>
                  <th className="py-3 px-5">Ornament Type</th>
                  <th className="py-3 px-5 text-right">Default Weight (g)</th>
                  <th className="py-3 px-5 text-right">Default Making Charge</th>
                  <th className="py-3 px-5 text-right">GST %</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-center">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-450 italic">
                      No products found matching search filters.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.product_id} className={`hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors ${p.status === 'Disabled' ? 'opacity-60 bg-slate-50/20' : ''}`}>
                      <td className="py-3.5 px-5 font-mono text-slate-450">
                        #{p.product_id}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-800 dark:text-white">
                        {p.product_name}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="bg-blue-50 text-blue-750 dark:bg-blue-950/40 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          {p.ornament_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-semibold">
                        {p.default_gold_weight > 0 ? `${p.default_gold_weight.toFixed(3)}g` : '-'}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-semibold">
                        {p.default_making_charge > 0 ? `₹${p.default_making_charge.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-semibold">
                        {p.gst_percent}%
                      </td>
                      <td className="py-3.5 px-5">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                            p.status === 'Active'
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900'
                              : 'bg-red-50 text-red-750 border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900'
                          }`}
                          title="Click to toggle product availability status"
                        >
                          {p.status === 'Active' ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <div className="flex justify-center items-center gap-3">
                          <button 
                            onClick={() => openEditModal(p)} 
                            className="p-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                            title="Edit Product Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p)} 
                            className="p-1 text-slate-550 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {productModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setProductModal(false)} />
          
          <div className="bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 relative z-10 space-y-5 shadow-2xl blue-glow">
            <button 
              onClick={() => setProductModal(false)} 
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-650"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="font-serif text-xl text-slate-850 dark:text-white font-bold border-b border-slate-100 dark:border-slate-850 pb-3">
              {selectedProduct ? 'Edit Product Details' : 'Add New Showroom Product'}
            </h3>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-750 dark:text-red-400 p-3 rounded-lg text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Product Name *
                </label>
                <input 
                  type="text" 
                  value={productNameInput} 
                  onChange={(e) => setProductNameInput(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-855 dark:text-slate-100 focus:outline-none focus:border-blue-500" 
                  placeholder="e.g. Gold Ring Diamond Accent 22K"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                    Ornament Type *
                  </label>
                  <select 
                    value={ornamentTypeInput}
                    onChange={(e) => setOrnamentTypeInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    {PREDEFINED_ORNAMENTS.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                    Product Status *
                  </label>
                  <select 
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none"
                  >
                    <option value="Active">Active (Available)</option>
                    <option value="Disabled">Disabled (Inactive)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                    Default Weight (g)
                  </label>
                  <input 
                    type="number" 
                    step="0.001"
                    value={goldWeightInput} 
                    onChange={(e) => setGoldWeightInput(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono" 
                    placeholder="0.000"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                    Making Charge (₹)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={makingChargeInput} 
                    onChange={(e) => setMakingChargeInput(e.target.value)} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono" 
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                    GST Rate (%) *
                  </label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={gstPercentInput} 
                    onChange={(e) => setGstPercentInput(e.target.value)} 
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono" 
                    placeholder="3.0"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setProductModal(false)} 
                  className="flex-1 border border-slate-205 dark:border-slate-800 text-slate-550 dark:text-slate-400 py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs shadow-md shadow-blue-500/15"
                >
                  {selectedProduct ? 'Update Product' : 'Register Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
