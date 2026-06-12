import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Plus, Search, Edit2, Trash2, CheckCircle, RefreshCw, X, ShieldAlert, Barcode 
} from 'lucide-react';

export default function Inventory() {
  const [catalog, setCatalog] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals status
  const [addModal, setAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [productId, setProductId] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [huidNumber, setHuidNumber] = useState('');
  const [purity, setPurity] = useState('22K');
  const [grossWeight, setGrossWeight] = useState('');
  const [stoneWeight, setStoneWeight] = useState('0');
  const [beadWeight, setBeadWeight] = useState('0');
  const [makingCharges, setMakingCharges] = useState('180');
  const [makingChargeType, setMakingChargeType] = useState('fixed_per_gram');
  const [wastagePercent, setWastagePercent] = useState('2.5');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [sellingCost, setSellingCost] = useState('');
  const [status, setStatus] = useState('Available');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadInventory = async () => {
    try {
      const stockRes = await api.get('/inventory');
      setStock(stockRes.data);
      
      const catalogRes = await api.get('/products');
      setCatalog(catalogRes.data);
      
      if (catalogRes.data.length > 0) {
        setProductId(catalogRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load stock inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setItemCode(`PJ-G-${Math.floor(1000 + Math.random() * 9000)}`);
    setHuidNumber(`H${Math.floor(10000 + Math.random() * 90000)}`);
    setGrossWeight('');
    setStoneWeight('0');
    setBeadWeight('0');
    setPurchaseCost('');
    setSellingCost('');
    setErrorMsg('');
    setSuccessMsg('');
    setAddModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setProductId(item.product_id || '');
    setItemCode(item.item_code);
    setHuidNumber(item.huid_number || '');
    setPurity(item.purity);
    setGrossWeight(item.gross_weight);
    setStoneWeight(item.stone_weight);
    setBeadWeight(item.bead_weight);
    setMakingCharges(item.making_charges);
    setMakingChargeType(item.making_charge_type);
    setWastagePercent(item.wastage_percent);
    setPurchaseCost(item.purchase_cost);
    setSellingCost(item.selling_cost);
    setStatus(item.status);
    setErrorMsg('');
    setSuccessMsg('');
    setAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const payload = {
      product_id: parseInt(productId) || undefined,
      item_code: itemCode,
      huid_number: huidNumber || undefined,
      purity,
      gross_weight: parseFloat(grossWeight),
      stone_weight: parseFloat(stoneWeight) || 0.0,
      bead_weight: parseFloat(beadWeight) || 0.0,
      making_charges: parseFloat(makingCharges) || 0.0,
      making_charge_type: makingChargeType,
      wastage_percent: parseFloat(wastagePercent) || 0.0,
      purchase_cost: parseFloat(purchaseCost),
      selling_cost: parseFloat(sellingCost),
      status
    };

    if (payload.gross_weight <= (payload.stone_weight + payload.bead_weight)) {
      setErrorMsg('Gross weight must exceed stone + bead weight.');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/inventory/${editingId}`, payload);
        setSuccessMsg('Ornaments details updated in stock.');
      } else {
        await api.post('/inventory', payload);
        setSuccessMsg('Ornaments successfully added to stock inventory.');
      }
      setTimeout(() => {
        setAddModal(false);
        loadInventory();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit inventory item.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this ornament from database?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      loadInventory();
    } catch (err) {
      alert('Failed to delete stock item.');
    }
  };

  const filteredStock = stock.filter(item => 
    item.item_code.toLowerCase().includes(search.toLowerCase()) ||
    (item.product?.name && item.product.name.toLowerCase().includes(search.toLowerCase())) ||
    (item.huid_number && item.huid_number.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gold/15 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-gold">Inventory Stock Registry</h1>
          <p className="text-xs text-cream-light/60">CRUD actions, hallmarked HUID weight calculations, and purchase accounting.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-gold hover:bg-gold-hover text-charcoal-dark px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4.5 h-4.5" />
          Add Ornaments Item
        </button>
      </div>

      {/* Search and counters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-charcoal-dark/50 border border-gold/10 p-4 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gold/60" />
          <input 
            type="text" 
            placeholder="Search stock code, name, HUID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-charcoal-dark border border-gold/20 rounded pl-9 pr-4 py-2 text-xs text-cream-light focus:outline-none focus:border-gold"
          />
        </div>
        
        <div className="text-xs text-cream-light/60 flex gap-6">
          <span>In Showroom: <strong className="text-gold">{stock.filter(s => s.status === 'Available').length}</strong></span>
          <span>Sold Items: <strong className="text-cream-light">{stock.filter(s => s.status === 'Sold').length}</strong></span>
          <span>Total Catalog Items: <strong className="text-cream-light">{stock.length}</strong></span>
        </div>
      </div>

      {/* Grid Ornaments table */}
      {loading ? (
        <div className="py-24 text-center text-gold space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-xs">Loading stock registers...</p>
        </div>
      ) : (
        <div className="bg-charcoal-dark/30 border border-gold/10 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gold/10 text-gold border-b border-gold/20">
                <th className="p-3">Barcode Code</th>
                <th className="p-3">Design Name</th>
                <th className="p-3">HUID</th>
                <th className="p-3">Purity</th>
                <th className="p-3 text-right">Gross Wt</th>
                <th className="p-3 text-right">Net Wt</th>
                <th className="p-3 text-right">Cost price</th>
                <th className="p-3 text-right">Selling Price</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 text-center text-cream-light/40 italic">
                    No matching stock items found. Add items to inventory to get started.
                  </td>
                </tr>
              ) : (
                filteredStock.map((item) => (
                  <tr key={item.id} className="border-b border-gold/5 hover:bg-charcoal-light/10">
                    <td className="p-3 font-mono font-bold text-gold flex items-center gap-1">
                      <Barcode className="w-4 h-4 shrink-0" />
                      {item.item_code}
                    </td>
                    <td className="p-3 font-semibold text-cream-light">
                      {item.product?.name || 'Gold Bullion'}
                    </td>
                    <td className="p-3 font-mono text-cream-light/60">{item.huid_number || 'N/A'}</td>
                    <td className="p-3">{item.purity}</td>
                    <td className="p-3 text-right font-mono">{item.gross_weight.toFixed(3)}g</td>
                    <td className="p-3 text-right font-mono font-bold text-cream-light">{item.net_weight.toFixed(3)}g</td>
                    <td className="p-3 text-right font-mono text-cream-light/65">₹{item.purchase_cost.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono font-bold text-gold">₹{item.selling_cost.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        item.status === 'Available' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/20' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => openEditModal(item)} 
                          className="text-gold hover:text-gold-light p-1"
                          title="Edit Item details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)} 
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete Item"
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
      )}

      {/* Add / Edit Inventory Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-charcoal-dark/80 backdrop-blur-sm" onClick={() => setAddModal(false)} />
          
          <div className="bg-charcoal-dark border border-gold/30 rounded-xl max-w-lg w-full p-6 relative z-10 space-y-4 shadow-2xl gold-glow">
            <button 
              onClick={() => setAddModal(false)}
              className="absolute right-4 top-4 text-cream-light/50 hover:text-gold"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl text-gold font-bold">
              {editingId ? 'Edit Stock Ornament' : 'Add Stock Ornament'}
            </h3>
            
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded text-xs flex items-center gap-2">
                <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded text-xs flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 col-span-2">
                <label className="text-cream-light/60">Choose Product Template Design *</label>
                <select 
                  value={productId} 
                  onChange={(e) => setProductId(e.target.value)} 
                  required
                  className="w-full bg-charcoal border border-gold/20 rounded px-3 py-2 text-cream-light focus:outline-none focus:border-gold"
                >
                  <option value="">-- Choose Template --</option>
                  {catalog.map(catItem => (
                    <option key={catItem.id} value={catItem.id}>
                      {catItem.name} ({catItem.sku_code} - {catItem.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-cream-light/60">Stock Item Code (Barcode) *</label>
                <input type="text" value={itemCode} onChange={(e) => setItemCode(e.target.value)} required className="w-full bg-charcoal border border-gold/20 rounded px-3 py-2 text-cream-light focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-cream-light/60">HUID Number (6 alphanumeric)</label>
                <input type="text" value={huidNumber} onChange={(e) => setHuidNumber(e.target.value)} className="w-full bg-charcoal border border-gold/20 rounded px-3 py-2 text-cream-light focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-cream-light/60">Bullion Purity *</label>
                <select value={purity} onChange={(e) => setPurity(e.target.value)} className="w-full bg-charcoal border border-gold/20 rounded px-3 py-2 text-cream-light focus:outline-none">
                  <option value="24K">24K Gold</option>
                  <option value="22K">22K Gold</option>
                  <option value="18K">18K Gold</option>
                  <option value="92.5%">92.5% Silver</option>
                  <option value="Pt950">Pt950 Platinum</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-cream-light/60">Gross Weight (grams) *</label>
                <input type="number" step="0.001" value={grossWeight} onChange={(e) => setGrossWeight(e.target.value)} required className="w-full bg-charcoal border border-gold/20 rounded px-3 py-2 text-cream-light focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-cream-light/60">Stone Weight (grams)</label>
                <input type="number" step="0.001" value={stoneWeight} onChange={(e) => setStoneWeight(e.target.value)} className="w-full bg-charcoal border border-gold/20 rounded px-3 py-2 text-cream-light focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-cream-light/60">Beads Weight (grams)</label>
                <input type="number" step="0.001" value={beadWeight} onChange={(e) => setBeadWeight(e.target.value)} className="w-full bg-charcoal border border-gold/20 rounded px-3 py-2 text-cream-light focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-cream-light/60">Making Charges (₹/g)</label>
                <input type="number" value={makingCharges} onChange={(e) => setMakingCharges(e.target.value)} className="w-full bg-charcoal border border-gold/20 rounded px-3 py-2 text-cream-light focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-cream-light/60">Wastage Percent (%)</label>
                <input type="number" step="0.1" value={wastagePercent} onChange={(e) => setWastagePercent(e.target.value)} className="w-full bg-charcoal border border-gold/20 rounded px-3 py-2 text-cream-light focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-cream-light/60">Purchase Cost (₹) *</label>
                <input type="number" value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} required className="w-full bg-charcoal border border-gold/20 rounded px-3 py-2 text-cream-light focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-cream-light/60">Selling Value Cost (₹) *</label>
                <input type="number" value={sellingCost} onChange={(e) => setSellingCost(e.target.value)} required className="w-full bg-charcoal border border-gold/20 rounded px-3 py-2 text-cream-light focus:outline-none" />
              </div>
              
              {editingId && (
                <div className="space-y-1 col-span-2">
                  <label className="text-cream-light/60">Stock Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-charcoal border border-gold/20 rounded px-3 py-2 text-cream-light focus:outline-none">
                    <option value="Available">Available (In Showroom)</option>
                    <option value="Sold">Sold (Invoiced)</option>
                  </select>
                </div>
              )}

              <div className="flex gap-4 pt-4 col-span-2">
                <button type="button" onClick={() => setAddModal(false)} className="flex-1 border border-gold/30 hover:border-gold py-2.5 rounded text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-gold hover:bg-gold-hover text-charcoal-dark font-bold py-2.5 rounded text-xs shadow">
                  Save Stock Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
