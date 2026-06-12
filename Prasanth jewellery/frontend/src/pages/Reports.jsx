import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  History, 
  Search, 
  RefreshCw, 
  FileText, 
  Calendar,
  Phone,
  User,
  Hash,
  X,
  Edit2,
  MessageCircle,
  Printer,
  FileDown,
  Trash2,
  Eye
} from 'lucide-react';

export default function Reports() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search filter states
  const [purchaseIdFilter, setPurchaseIdFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [productNameFilter, setProductNameFilter] = useState('');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');

  // Selected Bill for details modal
  const [selectedBill, setSelectedBill] = useState(null);
  const [detailModal, setDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      let cleanStr = dateStr;
      if (typeof dateStr === 'string') {
        if (!dateStr.includes('Z') && !dateStr.includes('+') && !/-\d{2}:\d{2}/.test(dateStr)) {
          cleanStr = dateStr.replace('T', ' ');
          if (cleanStr.length === 16) {
            cleanStr += ':00+05:30';
          } else if (cleanStr.length === 19) {
            cleanStr += '+05:30';
          }
        }
      }
      const d = new Date(cleanStr);
      if (isNaN(d.getTime())) return dateStr;
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      const parts = formatter.formatToParts(d);
      const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
      const day = partMap.day;
      const month = partMap.month;
      const year = partMap.year;
      const hour = partMap.hour;
      const minute = partMap.minute;
      const ampm = partMap.dayPeriod ? partMap.dayPeriod.toUpperCase() : 'AM';
      return `${day}-${month}-${year} ${hour}:${minute} ${ampm} (IST)`;
    } catch (e) {
      return dateStr;
    }
  };

  const fetchBills = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (purchaseIdFilter) params.purchase_id = purchaseIdFilter;
      if (phoneFilter) params.phone_number = phoneFilter;
      if (nameFilter) params.customer_name = nameFilter;
      if (productNameFilter) params.product_name = productNameFilter;
      if (fromDateFilter) params.from_date = fromDateFilter;
      if (toDateFilter) params.to_date = toDateFilter;

      const res = await api.get('/bills', { params });
      setBills(res.data);
    } catch (err) {
      console.error('Error fetching bills:', err);
      setError('Could not retrieve transaction history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [purchaseIdFilter, phoneFilter, nameFilter, productNameFilter, fromDateFilter, toDateFilter]);

  const handleDeleteBill = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice record?')) return;
    try {
      await api.delete(`/bills/${id}`);
      alert('Invoice deleted successfully.');
      fetchBills();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to delete invoice.');
    }
  };

  const handleExportExcel = async () => {
    try {
      const params = {};
      if (purchaseIdFilter) params.purchase_id = purchaseIdFilter;
      if (phoneFilter) params.phone_number = phoneFilter;
      if (nameFilter) params.customer_name = nameFilter;
      if (productNameFilter) params.product_name = productNameFilter;
      if (fromDateFilter) params.from_date = fromDateFilter;
      if (toDateFilter) params.to_date = toDateFilter;

      const response = await api.get('/reports/export/excel', { params, responseType: 'blob' });
      const file = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', 'Prasanth_Jewellery_Sales_Report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Error exporting Excel:', err);
      alert('Failed to export sales report to Excel.');
    }
  };

  const clearFilters = () => {
    setPurchaseIdFilter('');
    setPhoneFilter('');
    setNameFilter('');
    setProductNameFilter('');
    setFromDateFilter('');
    setToDateFilter('');
  };

  const handleDownloadPDF = async (billId, purchaseId, customerName) => {
    try {
      const response = await api.get(`/bills/${billId}/pdf`, { responseType: 'blob' });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      const firstName = customerName ? customerName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') : 'Customer';
      link.setAttribute('download', `${purchaseId}_${firstName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download invoice PDF.');
    }
  };

  const handleViewDetails = async (billId) => {
    setDetailLoading(true);
    setDetailModal(true);
    try {
      const res = await api.get(`/bills/${billId}`);
      setSelectedBill(res.data);
    } catch (err) {
      console.error('Error fetching bill details:', err);
      alert('Failed to load bill details.');
      setDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 no-print">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-slate-800 dark:text-white">
            Transactions Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Query invoice records, view detailed item listings, and download signed ReportLab PDF statements.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-4 rounded-xl text-xs no-print">
          {error}
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-xl shadow-sm space-y-4 blue-glow no-print">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Search Ledger Filters
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-4 text-xs">
          {/* Purchase ID Filter */}
          <div className="relative">
            <Hash className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Purchase ID..." 
              value={purchaseIdFilter}
              onChange={(e) => setPurchaseIdFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-850 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          {/* Phone filter */}
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Phone..." 
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-850 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Customer name filter */}
          <div className="relative">
            <User className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Customer Name..." 
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Product Name filter */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Product Name..." 
              value={productNameFilter}
              onChange={(e) => setProductNameFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* From Date filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="date" 
              value={fromDateFilter}
              onChange={(e) => setFromDateFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* To Date filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="date" 
              value={toDateFilter}
              onChange={(e) => setToDateFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          {(purchaseIdFilter || phoneFilter || nameFilter || productNameFilter || fromDateFilter || toDateFilter) && (
            <button 
              onClick={clearFilters}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-250 flex items-center gap-1 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
          <button 
            onClick={handleExportExcel}
            className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 flex items-center gap-1.5 px-4 py-2 rounded-lg shadow transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export to Excel
          </button>
          <button 
            onClick={fetchBills}
            className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 px-4 py-2 rounded-lg shadow transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Registry
          </button>
        </div>
      </div>

      {/* Bill Ledger Table */}
      {loading ? (
        <div className="py-24 text-center text-blue-600 dark:text-blue-400 space-y-2 no-print">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-sm font-semibold">Running ledger search filters...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl shadow-sm overflow-hidden blue-glow no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/50">
                  <th className="py-3 px-5">Purchase ID</th>
                  <th className="py-3 px-5">Customer Name</th>
                  <th className="py-3 px-5">Phone Number</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Created By</th>
                  <th className="py-3 px-5 text-right">Subtotal</th>
                  <th className="py-3 px-5 text-right">Discount</th>
                  <th className="py-3 px-5 text-right">Grand Total</th>
                  <th className="py-3 px-5 text-center">Action Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {bills.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-450 italic">
                      No invoices found in history database.
                    </td>
                  </tr>
                ) : (
                  bills.map((bill) => (
                    <tr key={bill.bill_id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {bill.purchase_id}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-800 dark:text-white">
                        {bill.customer_name}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-500 dark:text-slate-400">
                        {bill.phone_number}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400">
                        {formatDateTime(bill.date)}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                        <div>{bill.creator_username || 'Staff'}</div>
                        <div className="text-[9px] text-slate-400">{bill.creator_name || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-5 text-right text-slate-600 dark:text-slate-300 font-mono">
                        ₹{bill.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-5 text-right font-medium text-red-500 font-mono">
                        ₹{bill.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-5 text-right font-extrabold text-slate-800 dark:text-white font-mono">
                        ₹{bill.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button 
                            onClick={() => handleViewDetails(bill.bill_id)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-blue-450 dark:hover:bg-slate-900 rounded-full transition-all"
                            title="View Invoice Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {role === 'Admin' && (
                            <button 
                              onClick={() => navigate(`/billing?edit=${bill.bill_id}`)}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-blue-450 dark:hover:bg-slate-900 rounded-full transition-all"
                              title="Edit Invoice"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {role === 'Admin' && (
                            <button 
                              onClick={() => handleDeleteBill(bill.bill_id)}
                              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-slate-900 rounded-full transition-all"
                              title="Delete Invoice"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Bill Items Detail Modal (Cleanly formatted for print consistency) */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs no-print" onClick={() => setDetailModal(false)} />
          
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 relative z-10 space-y-5 shadow-2xl blue-glow max-h-[85vh] overflow-y-auto">
            <button 
              onClick={() => setDetailModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 no-print"
            >
              <X className="w-5 h-5" />
            </button>
            
            {detailLoading || !selectedBill ? (
              <div className="py-12 text-center no-print">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 no-print">
                  <h3 className="font-serif text-lg font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Invoice Record Details
                  </h3>
                </div>

                {/* ================= INVOICE DETAILS PRINT AREA (ALWAYS WHITE) ================= */}
                {/* Matches ReportLab PDF styling exactly in spacing, font sizing, alternating colors, and logos */}
                <div className="print-area bg-white text-slate-950 p-6 space-y-5 text-xs text-left select-none border border-slate-300 rounded-xl relative font-sans">
                  <div className="absolute top-2 right-3 font-semibold text-[8px] uppercase tracking-widest text-slate-400 no-print">
                    Active Invoice Statement
                  </div>
                  
                  {/* Header info */}
                  <div className="flex justify-between items-start border-b-2 border-blue-900 pb-3">
                    <div className="flex gap-3 items-center">
                      {/* Logo image matching ReportLab PDF exactly */}
                      <img src="/pj_logo.png" alt="PJ Logo" className="w-10 h-10 object-contain rounded-lg border border-slate-100" />
                      <div>
                        <h3 className="font-sans text-md font-bold text-blue-950 tracking-wider">PRASANTH JEWELLERY</h3>
                        <p className="text-[9px] text-slate-500 leading-normal">
                          M M Road, Thalassery<br/>
                          Phone: 9846936111
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-[9px] text-slate-600 space-y-0.5 mt-1 leading-normal">
                      <span className="font-bold text-blue-950 block text-xs tracking-wider">TAX INVOICE</span>
                      <div>Purchase ID: <strong className="font-mono text-slate-900">{selectedBill.purchase_id}</strong></div>
                      <div>Date: <strong className="font-mono">{formatDateTime(selectedBill.date)}</strong></div>
                    </div>
                  </div>

                  {/* Customer Details Row */}
                  <div className="bg-slate-50 p-3 rounded border border-slate-200 flex flex-col gap-1 text-[10px] leading-relaxed">
                    <div className="font-bold text-blue-950 text-[10px] uppercase tracking-wider mb-0.5">CUSTOMER RECORD</div>
                    <div>Name: <strong className="text-slate-900">{selectedBill.customer_name}</strong></div>
                    <div>Phone Number: <span className="font-mono text-slate-900">{selectedBill.phone_number}</span></div>
                    {selectedBill.address && <div>Address: <span className="text-slate-800">{selectedBill.address}</span></div>}
                  </div>

                  {/* Itemized Table with matching alternation and grid borders */}
                  <div className="border border-slate-300 rounded overflow-hidden">
                    <table className="w-full border-collapse text-[10px] border border-slate-300 table-fixed">
                      <thead>
                        <tr className="bg-blue-900 text-white font-bold text-[9px] uppercase">
                          <th className="p-2 border border-slate-300 text-left w-[24%]">Ornament</th>
                          <th className="p-2 border border-slate-300 text-center w-[6%]">Qty</th>
                          <th className="p-2 border border-slate-300 text-right w-[11%]">Gold Wt</th>
                          <th className="p-2 border border-slate-300 text-right w-[12%]">Rate/g</th>
                          <th className="p-2 border border-slate-300 text-right w-[12%]">MRP</th>
                          <th className="p-2 border border-slate-300 text-right w-[11%]">Discount</th>
                          <th className="p-2 border border-slate-300 text-right w-[10%]">GST %</th>
                          <th className="p-2 border border-slate-300 text-right w-[14%]">Total</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono divide-y divide-slate-300">
                        {selectedBill.items.map((item, index) => (
                          <tr key={index} className="text-slate-800 odd:bg-white even:bg-slate-50/70">
                            <td className="p-2 border border-slate-300 font-sans text-slate-900">
                              <div className="font-semibold">{item.product_name}</div>
                              {item.ornament_type && (
                                <div className="text-[8px] text-slate-500 mt-0.5">{item.ornament_type}</div>
                              )}
                            </td>
                            <td className="p-2 border border-slate-300 text-center">{item.quantity}</td>
                            <td className="p-2 border border-slate-300 text-right">{item.weight_gold_g > 0 ? `${item.weight_gold_g.toFixed(3)}g` : '-'}</td>
                            <td className="p-2 border border-slate-300 text-right">{item.rate_per_gram > 0 ? `₹${Math.round(item.rate_per_gram)}` : '-'}</td>
                            <td className="p-2 border border-slate-300 text-right">{item.MRP > 0 ? `₹${Math.round(item.MRP)}` : '-'}</td>
                            <td className="p-2 border border-slate-300 text-right text-red-500">{item.discount > 0 ? `₹${Math.round(item.discount)}` : '-'}</td>
                            <td className="p-2 border border-slate-300 text-right">{item.GST}%</td>
                            <td className="p-2 border border-slate-300 text-right font-bold text-slate-900">₹{Math.round(item.item_total).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Calculations summaries and cashier signatory details */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded border border-slate-200 text-[10px]">
                    <div className="space-y-3">
                      <div className="leading-relaxed">
                        Created By: <strong className="font-sans font-bold">{selectedBill.creator_username || 'Staff'} ({selectedBill.creator_name || 'N/A'})</strong>
                        <span className="block text-[8px] text-slate-450">{formatDateTime(selectedBill.date)}</span>
                      </div>
                      <div className="pt-2 leading-relaxed">
                        <span>Authorized Signatory Signature:</span>
                        <div className="pt-8 border-b border-slate-400 w-32"></div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-center space-y-1 font-mono">
                      <div className="flex justify-between w-full text-slate-500">
                        <span>Subtotal:</span>
                        <span>₹{Math.round(selectedBill.subtotal).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between w-full text-red-500">
                        <span>Global Discount:</span>
                        <span>-₹{Math.round(selectedBill.discount).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between w-full font-bold border-t border-slate-300 pt-1.5 text-[11px] text-blue-900">
                        <span>Grand Total Paid:</span>
                        <span>₹{Math.round(selectedBill.total_amount).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Compliant Invoicing Footer */}
                  <div className="text-center pt-2 border-t border-slate-100 text-[10px] font-bold text-blue-950 italic">
                    "Thank you for choosing Prasanth Jewellery. Visit Again."
                  </div>
                </div>

                {/* Button Actions */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-850 no-print">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase font-sans">Compliant Invoicing</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 px-4 py-2 rounded-lg transition-colors shadow-md shadow-slate-500/10"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                    <button 
                      onClick={() => {
                        const text = `Dear ${selectedBill.customer_name}, your Prasanth Jewellery invoice is ready.\nPurchase ID: ${selectedBill.purchase_id}\nTotal amount paid: ₹${selectedBill.total_amount.toLocaleString('en-IN')}.\nThank you for your visit!`;
                        const encoded = encodeURIComponent(text);
                        window.open(`https://api.whatsapp.com/send?phone=${selectedBill.phone_number}&text=${encoded}`, '_blank');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors shadow-md shadow-green-500/10"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Share to WhatsApp
                    </button>
                    <button 
                      onClick={() => handleDownloadPDF(selectedBill.bill_id, selectedBill.purchase_id, selectedBill.customer_name)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors shadow-md shadow-blue-500/10"
                    >
                      <FileDown className="w-4 h-4" />
                      Download PDF Invoice
                    </button>
                    <button 
                      onClick={() => setDetailModal(false)}
                      className="border border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 py-2 px-4 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
