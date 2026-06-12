import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, Printer, Eye, X, Gem, RefreshCw } from 'lucide-react';

export default function Catalog() {
  const { role } = useAuth();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState('Available');
  
  // Barcode Tag Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [tagData, setTagData] = useState(null);
  const [tagLoading, setTagLoading] = useState(false);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory', {
        params: {
          category: category || undefined,
          status: status || undefined,
          query: search || undefined
        }
      });
      setItems(response.data);
    } catch (err) {
      console.error('Failed to fetch stock catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [category, status, search]);

  const viewBarcodeTag = async (item) => {
    setSelectedItem(item);
    setTagLoading(true);
    try {
      const res = await api.get(`/inventory/${item.id}/barcode`);
      setTagData(res.data);
    } catch (err) {
      console.error('Failed to load barcode tags:', err);
    } finally {
      setTagLoading(false);
    }
  };

  const handlePrintTag = () => {
    const printContent = document.getElementById('printable-barcode-card');
    const WinPrint = window.open('', '', 'width=600,height=400');
    WinPrint.document.write('<html><head><title>Print Tag</title>');
    WinPrint.document.write('<style>body{font-family:Arial,sans-serif;padding:20px;text-align:center;}img{max-width:180px;height:auto;margin:10px;}.box{border:1px solid #000;padding:15px;display:inline-block;}</style>');
    WinPrint.document.write('</head><body>');
    WinPrint.document.write(printContent.innerHTML);
    WinPrint.document.write('</body></html>');
    WinPrint.document.close();
    WinPrint.focus();
    WinPrint.print();
    WinPrint.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gold/15 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-gold">Showroom Catalog</h1>
          <p className="text-xs text-cream-light/60">Search, filter, and inspect certified jewelry stock items.</p>
        </div>
        {role && (
          <Link 
            to="/inventory" 
            className="bg-gold hover:bg-gold-hover text-charcoal-dark px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-all"
          >
            Manage Stock CRUD
          </Link>
        )}
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-charcoal-dark/50 border border-gold/10 p-4 rounded-lg">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gold/60" />
          <input 
            type="text" 
            placeholder="Search code, HUID, name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-charcoal-dark border border-gold/20 rounded pl-9 pr-4 py-2 text-xs text-cream-light focus:outline-none focus:border-gold"
          />
        </div>

        {/* Category */}
        <div className="relative">
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-charcoal-dark border border-gold/20 rounded px-3 py-2 text-xs text-cream-light focus:outline-none focus:border-gold appearance-none"
          >
            <option value="">All Categories</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Diamond">Diamond</option>
            <option value="Platinum">Platinum</option>
          </select>
          <Filter className="absolute right-3 top-3 w-3 h-3 text-gold/60 pointer-events-none" />
        </div>

        {/* Status (Staff Only) */}
        {role ? (
          <div className="relative">
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-charcoal-dark border border-gold/20 rounded px-3 py-2 text-xs text-cream-light focus:outline-none focus:border-gold appearance-none"
            >
              <option value="">All Stock Status</option>
              <option value="Available">Available (In Showroom)</option>
              <option value="Sold">Sold (Invoiced)</option>
            </select>
            <Filter className="absolute right-3 top-3 w-3 h-3 text-gold/60 pointer-events-none" />
          </div>
        ) : (
          <div className="text-xs flex items-center px-3 bg-charcoal-dark border border-gold/10 rounded text-gold/60">
            Showroom Availability Active
          </div>
        )}

        <button 
          onClick={() => { setSearch(''); setCategory(''); setStatus('Available'); }}
          className="border border-gold/20 hover:border-gold/50 text-gold hover:text-gold-light py-2 px-4 rounded text-xs transition-colors flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-24 text-center text-gold space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-xs">Fetching bullion catalog items...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-gold/10 rounded-lg">
          <Gem className="w-12 h-12 text-gold/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-cream-light">No items found</p>
          <p className="text-xs text-cream-light/45 mt-1">Try resetting the filters or modifying your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item) => (
            <div 
              key={item.id} 
              className={`border border-gold/10 bg-charcoal-dark/60 rounded-xl overflow-hidden hover:border-gold/30 transition-all duration-300 flex flex-col justify-between ${
                item.status === 'Sold' ? 'opacity-65' : ''
              }`}
            >
              {/* Product Info Block */}
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-gold/15 text-gold border border-gold/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                      {item.product?.category || 'Bullion'}
                    </span>
                    <span className="ml-1 text-[10px] bg-charcoal text-cream-light/60 px-2 py-0.5 rounded font-mono">
                      {item.purity}
                    </span>
                  </div>
                  {item.status === 'Sold' && (
                    <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                      Sold
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="font-serif text-lg font-bold text-cream-light">
                    {item.product?.name || 'Gold Bullion Ornament'}
                  </h4>
                  <p className="text-[10px] font-mono text-cream-light/40">
                    Code: {item.item_code} | HUID: {item.huid_number || 'N/A'}
                  </p>
                </div>

                {/* Weights specs */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-gold/5 text-center text-[10px]">
                  <div>
                    <span className="text-cream-light/45 block">Gross Wt</span>
                    <strong className="text-cream-light">{item.gross_weight.toFixed(3)}g</strong>
                  </div>
                  <div>
                    <span className="text-cream-light/45 block">Stone Wt</span>
                    <strong className="text-cream-light">{item.stone_weight.toFixed(3)}g</strong>
                  </div>
                  <div>
                    <span className="text-cream-light/45 block">Net Wt</span>
                    <strong className="text-gold">{item.net_weight.toFixed(3)}g</strong>
                  </div>
                </div>

                {/* Pricing info */}
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-[10px] text-cream-light/40">Estimated Showroom Price</span>
                  <strong className="text-gold text-lg">₹{item.selling_cost.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {/* Action bar (restricted) */}
              <div className="bg-charcoal-dark/90 border-t border-gold/10 px-5 py-3 flex justify-between gap-2">
                {role ? (
                  <button 
                    onClick={() => viewBarcodeTag(item)}
                    className="flex-1 border border-gold/25 hover:border-gold hover:text-gold text-cream-light/75 text-[11px] py-1.5 rounded flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Tag Barcode
                  </button>
                ) : (
                  <a 
                    href="#contact" 
                    className="flex-1 text-center bg-gold/10 border border-gold/25 hover:bg-gold hover:text-charcoal-dark text-gold text-[11px] py-1.5 rounded font-semibold tracking-wider uppercase transition-all duration-300"
                  >
                    Inquire Item
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Barcode Tag Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-charcoal-dark/80 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
          
          <div className="bg-charcoal-dark border border-gold/30 rounded-xl max-w-sm w-full p-6 relative z-10 space-y-6 shadow-2xl gold-glow text-center">
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute right-4 top-4 text-cream-light/50 hover:text-gold"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-lg text-gold font-bold">Printable Stock Tag</h3>
            
            {tagLoading ? (
              <div className="py-8"><RefreshCw className="w-6 h-6 animate-spin text-gold mx-auto" /></div>
            ) : (
              <div id="printable-barcode-card" className="bg-white text-black p-4 rounded border-2 border-black inline-block text-left font-sans max-w-xs mx-auto">
                <div className="text-center font-bold font-serif border-b border-black pb-1 mb-2 tracking-wide uppercase text-sm">
                  Prasanth Jewellery
                </div>
                
                {/* Barcode image (base64 svg) */}
                <div className="text-center my-2">
                  <img src={tagData?.barcode_base64} alt="Barcode" className="mx-auto max-h-12" />
                  <div className="text-[10px] font-mono tracking-widest">{selectedItem.item_code}</div>
                </div>

                <div className="grid grid-cols-2 text-[10px] border-t border-dashed border-black pt-2 space-y-0.5">
                  <div><b>Item:</b> {selectedItem.product?.subcategory || 'Bullion'}</div>
                  <div><b>Purity:</b> {selectedItem.purity}</div>
                  <div><b>Gross:</b> {selectedItem.gross_weight.toFixed(3)} g</div>
                  <div><b>Net Wt:</b> {selectedItem.net_weight.toFixed(3)} g</div>
                  {selectedItem.huid_number && (
                    <div className="col-span-2"><b>HUID:</b> {selectedItem.huid_number}</div>
                  )}
                </div>

                <div className="text-center mt-3">
                  <img src={tagData?.qrcode_base64} alt="QR Code" className="mx-auto w-24 h-24" />
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              <button 
                onClick={() => setSelectedItem(null)}
                className="flex-1 border border-gold/30 hover:border-gold text-cream-light py-2 rounded text-xs font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={handlePrintTag}
                disabled={tagLoading}
                className="flex-1 bg-gold hover:bg-gold-hover text-charcoal-dark py-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                Print Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
