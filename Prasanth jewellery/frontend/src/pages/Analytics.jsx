import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  BarChart3, 
  Calendar, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Search, 
  Filter, 
  X, 
  RefreshCw, 
  Tag,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  Download
} from 'lucide-react';

export default function Analytics() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [purchaseId, setPurchaseId] = useState('');
  const [customerName, setCustomerName] = useState('');

  const fetchAllBills = async () => {
    setLoading(true);
    setError('');
    try {
      // Query with high limit to fetch historic logs for full aggregate analysis
      const res = await api.get('/bills', { params: { limit: 1000 } });
      setBills(res.data);
    } catch (err) {
      console.error('Error fetching billing data for analytics:', err);
      setError('Failed to fetch transaction logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBills();
  }, []);

  // Filter logic
  const filteredBills = bills.filter(bill => {
    if (fromDate && bill.date < fromDate) return false;
    if (toDate && bill.date > toDate) return false;
    if (purchaseId && !bill.purchase_id.toLowerCase().includes(purchaseId.toLowerCase())) return false;
    if (customerName && !bill.customer_name.toLowerCase().includes(customerName.toLowerCase())) return false;
    return true;
  });

  // KPI Calculations
  const totalSales = filteredBills.reduce((sum, b) => sum + b.total_amount, 0);
  const totalBills = filteredBills.length;
  
  const uniqueCustomerPhones = new Set(filteredBills.map(b => b.phone_number));
  const uniqueCustomersCount = uniqueCustomerPhones.size;
  const avgBillValue = totalBills > 0 ? totalSales / totalBills : 0;

  // Comparative Period calculations (Growth / Declines)
  let compSales = 0;
  let compLabel = 'vs previous comparative period';
  let hasComparison = false;

  if (fromDate && toDate) {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Previous timeframe limits
    const prevStart = new Date(start.getTime());
    prevStart.setDate(start.getDate() - diffDays);
    const prevEnd = new Date(start.getTime());
    prevEnd.setDate(start.getDate() - 1);

    const prevStartStr = prevStart.toISOString().split('T')[0];
    const prevEndStr = prevEnd.toISOString().split('T')[0];

    compLabel = `vs previous ${diffDays} days (${prevStartStr} to ${prevEndStr})`;

    const prevPeriodBills = bills.filter(b => b.date >= prevStartStr && b.date <= prevEndStr);
    compSales = prevPeriodBills.reduce((sum, b) => sum + b.total_amount, 0);
    hasComparison = true;
  } else {
    // Default to comparing current month with previous month
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth(); // 0-indexed

    const curMonthPrefix = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`;
    
    let prevYear = curYear;
    let prevMonthVal = curMonth - 1;
    if (prevMonthVal < 0) {
      prevMonthVal = 11;
      prevYear -= 1;
    }
    const prevMonthPrefix = `${prevYear}-${String(prevMonthVal + 1).padStart(2, '0')}`;
    
    compLabel = `vs previous month (${prevMonthPrefix})`;
    compSales = bills.filter(b => b.date.startsWith(prevMonthPrefix)).reduce((sum, b) => sum + b.total_amount, 0);
    hasComparison = true;
  }

  const salesGrowthPct = compSales > 0 ? ((totalSales - compSales) / compSales) * 100 : null;

  // 1. Trend analysis (daily sales aggregation)
  const salesByDateMap = {};
  filteredBills.forEach(b => {
    salesByDateMap[b.date] = (salesByDateMap[b.date] || 0) + b.total_amount;
  });
  
  // Sort dates chronologically
  const sortedDates = Object.keys(salesByDateMap).sort();
  
  // Get last 7 active dates for chart to keep it clean and readable
  const chartDates = sortedDates.slice(-7);
  const chartValues = chartDates.map(d => salesByDateMap[d]);
  const maxChartVal = chartValues.length > 0 ? Math.max(...chartValues) * 1.15 : 10000;

  // 2. Top Ornaments Analysis
  const productSalesMap = {};
  filteredBills.forEach(b => {
    if (b.items) {
      b.items.forEach(item => {
        const name = item.product_name || 'Other';
        if (!productSalesMap[name]) {
          productSalesMap[name] = { qty: 0, revenue: 0, weight: 0 };
        }
        productSalesMap[name].qty += item.quantity;
        productSalesMap[name].revenue += item.item_total;
        productSalesMap[name].weight += item.weight_gold_g || 0;
      });
    }
  });

  const productBreakdownList = Object.keys(productSalesMap).map(name => ({
    name,
    qty: productSalesMap[name].qty,
    revenue: productSalesMap[name].revenue,
    weight: productSalesMap[name].weight
  })).sort((a, b) => b.revenue - a.revenue);

  const topProducts = productBreakdownList.slice(0, 5);
  const maxProductRevenue = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.revenue)) : 1;

  // 3. Customer Purchase Frequency & Contribution
  const customerSalesMap = {};
  filteredBills.forEach(b => {
    const key = `${b.customer_name}|||${b.phone_number}`;
    if (!customerSalesMap[key]) {
      customerSalesMap[key] = { name: b.customer_name, phone: b.phone_number, billsCount: 0, totalAmount: 0 };
    }
    customerSalesMap[key].billsCount += 1;
    customerSalesMap[key].totalAmount += b.total_amount;
  });

  // Ranked by purchase frequency (invoice counts)
  const customerFrequencyList = Object.keys(customerSalesMap).map(key => ({
    name: customerSalesMap[key].name,
    phone: customerSalesMap[key].phone,
    billsCount: customerSalesMap[key].billsCount,
    totalAmount: customerSalesMap[key].totalAmount,
    avgOrderValue: customerSalesMap[key].totalAmount / customerSalesMap[key].billsCount
  })).sort((a, b) => b.billsCount - a.billsCount); // Sort by Frequency!

  // Grouped Date breakdown table data
  const dateBreakdownList = sortedDates.map(date => {
    const dayBills = filteredBills.filter(b => b.date === date);
    return {
      date,
      count: dayBills.length,
      revenue: dayBills.reduce((sum, b) => sum + b.total_amount, 0)
    };
  }).reverse(); // Latest date first

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setPurchaseId('');
    setCustomerName('');
  };

  const setQuickRange = (rangeType) => {
    const today = new Date();
    const toDateStr = today.toISOString().split('T')[0];
    let from = new Date();

    if (rangeType === 'today') {
      // today
    } else if (rangeType === 'week') {
      from.setDate(today.getDate() - 7);
    } else if (rangeType === 'month') {
      from.setMonth(today.getMonth() - 1);
    } else if (rangeType === 'year') {
      from.setFullYear(today.getFullYear() - 1);
    }
    
    const fromDateStr = from.toISOString().split('T')[0];
    setFromDate(fromDateStr);
    setToDate(toDateStr);
  };

  // Export Excel (.xlsx) using reportlab backend openpyxl endpoint
  const handleExportExcel = async () => {
    try {
      const params = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (purchaseId) params.purchase_id = purchaseId;
      if (customerName) params.customer_name = customerName;

      const response = await api.get('/reports/export/excel', { params, responseType: 'blob' });
      const file = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      
      const filterSuffix = fromDate ? `_${fromDate}_to_${toDate}` : '_All_Time';
      link.setAttribute('download', `Prasanth_Jewellery_Sales_Report${filterSuffix}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Excel Export error:', err);
      alert('Failed to generate Excel report sheet.');
    }
  };

  // Export CSV client-side
  const handleExportCSV = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM for currency formatting compatibility in Excel
    csvContent += "Purchase ID,Customer Name,Date,Created By,Product Name,Quantity,Amount,GST,Total Sales\n";
    
    filteredBills.forEach(bill => {
      if (bill.items) {
        bill.items.forEach(item => {
          // Re-calculate pricing components
          const bullion = item.weight_gold_g * item.rate_per_gram;
          const mrpVal = item.quantity * item.MRP;
          const itemSub = bullion + mrpVal + item.making_charge;
          const itemDiscount = item.discount || 0.0;
          
          const amount = Math.max(0.0, itemSub - itemDiscount);
          const gstVal = amount * (item.GST / 100.0);
          const totalSales = amount + gstVal;
          
          const creatorStr = `${bill.creator_username || 'Staff'} (${bill.creator_name || 'N/A'})`;

          const row = [
            bill.purchase_id,
            `"${bill.customer_name.replace(/"/g, '""')}"`,
            bill.date,
            `"${creatorStr.replace(/"/g, '""')}"`,
            `"${item.product_name.replace(/"/g, '""')}"`,
            item.quantity,
            amount.toFixed(2),
            gstVal.toFixed(2),
            totalSales.toFixed(2)
          ].join(",");
          csvContent += row + "\n";
        });
      }
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const fileURL = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = fileURL;
    const filterSuffix = fromDate ? `_${fromDate}_to_${toDate}` : '_All_Time';
    link.setAttribute('download', `Prasanth_Jewellery_Sales_Report${filterSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in no-print">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            Business Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time visual metrics, revenue streams, and inventory ornament distribution reports.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* CSV Export Option */}
          <button 
            onClick={handleExportCSV}
            disabled={filteredBills.length === 0}
            className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-250 dark:text-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          
          {/* Excel Export Option */}
          <button 
            onClick={handleExportExcel}
            disabled={filteredBills.length === 0}
            className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg shadow-md transition-all disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel (.xlsx)
          </button>

          <button 
            onClick={fetchAllBills}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-800 flex items-center gap-1 px-2.5 py-2.5 rounded-lg transition-all"
            title="Reload database calculations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Filter and Range Controls */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-xl shadow-sm space-y-4 blue-glow">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-blue-600" />
            Analysis Query Filters
          </h3>
          <div className="flex gap-1">
            {['today', 'week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setQuickRange(range)}
                className="text-[10px] font-bold uppercase border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1 text-slate-650 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900 transition-colors"
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">From Date</label>
            <input 
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">To Date</label>
            <input 
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Purchase ID</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search ID (PJ...)"
                value={purchaseId}
                onChange={(e) => setPurchaseId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block mb-1">Customer Name</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search name..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {(fromDate || toDate || purchaseId || customerName) && (
          <div className="flex justify-end pt-1">
            <button 
              onClick={clearFilters}
              className="text-[10px] uppercase font-bold text-red-500 hover:text-red-700 flex items-center gap-1 border border-red-500/10 hover:border-red-500/20 bg-red-500/5 px-3 py-1.5 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 - Total Revenue with dynamic growth comparison indicator */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md space-y-3 relative overflow-hidden group">
          <div className="absolute right-3 top-3 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
            <DollarSign className="w-5 h-5 text-blue-200" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-200 block">Total Revenue</span>
            <h4 className="text-lg sm:text-2xl font-extrabold tracking-tight font-mono">
              ₹{totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h4>
          </div>
          
          {/* Comparison Delta Indicator */}
          {hasComparison && (
            <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-100/90">
              {salesGrowthPct !== null ? (
                salesGrowthPct >= 0 ? (
                  <span className="text-green-400 flex items-center gap-0.5 font-bold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    +{salesGrowthPct.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center gap-0.5 font-bold">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    {salesGrowthPct.toFixed(1)}%
                  </span>
                )
              ) : (
                <span className="text-slate-300">New range baseline</span>
              )}
              <span className="text-[8px] text-blue-200/60 truncate max-w-[130px]" title={compLabel}>
                {compLabel}
              </span>
            </div>
          )}
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden group blue-glow">
          <div className="absolute right-3 top-3 w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-555 block">Total Invoices</span>
            <h4 className="text-lg sm:text-2xl font-extrabold tracking-tight font-mono text-slate-800 dark:text-white">
              {totalBills.toLocaleString()}
            </h4>
          </div>
          <span className="text-[9px] text-slate-500 block">
            Generated billing sales receipts
          </span>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden group blue-glow">
          <div className="absolute right-3 top-3 w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-555 block">Unique Clients</span>
            <h4 className="text-lg sm:text-2xl font-extrabold tracking-tight font-mono text-slate-800 dark:text-white">
              {uniqueCustomersCount.toLocaleString()}
            </h4>
          </div>
          <span className="text-[9px] text-slate-500 block">
            Customers in analysis subset
          </span>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden group blue-glow">
          <div className="absolute right-3 top-3 w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
            <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-555 block">Average Ticket</span>
            <h4 className="text-lg sm:text-2xl font-extrabold tracking-tight font-mono text-slate-800 dark:text-white">
              ₹{avgBillValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h4>
          </div>
          <span className="text-[9px] text-slate-500 block">
            Mean transaction gross revenue
          </span>
        </div>
      </div>

      {/* Visual Reports Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Sales Trend Chart (Col span 2) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-5 blue-glow">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3">
            <h3 className="font-serif text-md text-slate-800 dark:text-white font-bold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Daily Sales Trend (Last 7 Active Days)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Gross Values (₹)</span>
          </div>

          {chartDates.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 italic text-xs">
              No sales records available in the selected query window.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pure SVG Bar Chart */}
              <div className="w-full h-64 select-none">
                <svg className="w-full h-full" viewBox="0 0 500 240">
                  {/* Grid Lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                    const y = 30 + 160 * r;
                    const val = Math.round(maxChartVal * (1 - r));
                    return (
                      <g key={idx}>
                        <line x1="45" y1={y} x2="480" y2={y} stroke="#e2e8f0" strokeDasharray="4 4" className="dark:stroke-slate-800" strokeWidth="0.5" />
                        <text x="5" y={y + 4} fontSize="8" className="fill-slate-400 font-mono text-right" textAnchor="start">
                          ₹{val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Bars Drawing */}
                  {chartDates.map((date, idx) => {
                    const barCount = chartDates.length;
                    const width = 35;
                    const gap = (400 - (width * barCount)) / (barCount + 1);
                    const x = 55 + gap + idx * (width + gap);
                    
                    const val = salesByDateMap[date];
                    const height = (val / maxChartVal) * 160;
                    const y = 190 - height;
                    
                    // Simple Date label slicing (MM-DD)
                    const dateParts = date.split('-');
                    const displayLabel = dateParts.length >= 3 ? `${dateParts[1]}/${dateParts[2]}` : date;

                    return (
                      <g key={idx} className="group">
                        <defs>
                          <linearGradient id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#1e3a8a" />
                          </linearGradient>
                        </defs>
                        {/* Bar Shape */}
                        <rect x={x} y={y} width={width} height={height} rx="4" fill={`url(#grad-${idx})`} className="opacity-95 hover:opacity-100 hover:fill-blue-500 transition-all cursor-pointer" />
                        
                        {/* Interactive Tooltip value */}
                        <text x={x + width/2} y={y - 6} fontSize="8" fontWeight="bold" className="fill-blue-600 dark:fill-blue-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity" textAnchor="middle">
                          ₹{Math.round(val).toLocaleString()}
                        </text>
                        
                        {/* X Axis Label */}
                        <text x={x + width/2} y="206" fontSize="8" className="fill-slate-500 font-mono font-bold" textAnchor="middle">
                          {displayLabel}
                        </text>
                      </g>
                    );
                  })}
                  <line x1="45" y1="190" x2="480" y2="190" stroke="#cbd5e1" className="dark:stroke-slate-700" strokeWidth="1" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Top Product Categories Breakdown */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm space-y-4 blue-glow font-sans">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-3">
            <h3 className="font-serif text-md text-slate-800 dark:text-white font-bold flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-blue-600" />
              Top Selling Products
            </h3>
          </div>

          {topProducts.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 italic text-xs">
              No items sold in current filtered range.
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {topProducts.map((p, idx) => {
                const widthPct = Math.max(8, (p.revenue / maxProductRevenue) * 100);
                return (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-800 dark:text-slate-200 font-semibold">
                      <span className="flex items-center gap-1 text-[11px]">
                        <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {p.name}
                      </span>
                      <span className="font-mono text-slate-500 font-bold">
                        ₹{Math.round(p.revenue).toLocaleString()}
                      </span>
                    </div>
                    {/* Visual bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-650 h-full rounded-full transition-all duration-500"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>Qty: {p.qty} units</span>
                      <span>Weight: {p.weight > 0 ? `${p.weight.toFixed(2)}g` : '-'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Aggregate breakdown tables grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Labeled Client Purchase Frequency Table */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden blue-glow">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 flex justify-between items-center">
            <h4 className="font-serif text-sm font-bold text-slate-800 dark:text-white">Client Purchase Frequency & Contribution</h4>
            <span className="text-[10px] bg-blue-500/10 text-blue-600 font-mono px-2 py-0.5 rounded font-bold">Ranked by Visits</span>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/20">
                  <th className="py-2.5 px-4">Client Name</th>
                  <th className="py-2.5 px-4">Phone</th>
                  <th className="py-2.5 px-4 text-center">Frequency (Bills)</th>
                  <th className="py-2.5 px-4 text-right">Avg Order Value</th>
                  <th className="py-2.5 px-4 text-right">Total Revenue Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {customerFrequencyList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 italic">No customer frequencies recorded.</td>
                  </tr>
                ) : (
                  customerFrequencyList.slice(0, 10).map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        {c.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{c.phone}</td>
                      <td className="py-3 px-4 text-center font-bold font-mono text-blue-600 dark:text-blue-400">{c.billsCount}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        ₹{c.avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold font-mono text-slate-800 dark:text-white">
                        ₹{c.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Breakdown by Product */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden blue-glow">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 flex justify-between items-center">
            <h4 className="font-serif text-sm font-bold text-slate-800 dark:text-white">Revenue Contribution by Ornament</h4>
            <span className="text-[10px] bg-blue-500/10 text-blue-600 font-mono px-2 py-0.5 rounded font-bold">Ranked by Value</span>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/20">
                  <th className="py-2.5 px-4">Ornament Name</th>
                  <th className="py-2.5 px-4 text-center">Qty Sold</th>
                  <th className="py-2.5 px-4 text-right">Gold Wt</th>
                  <th className="py-2.5 px-4 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {productBreakdownList.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 italic">No products found.</td>
                  </tr>
                ) : (
                  productBreakdownList.slice(0, 10).map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        {p.name}
                      </td>
                      <td className="py-3 px-4 text-center font-bold font-mono">{p.qty}</td>
                      <td className="py-3 px-4 text-right font-mono">{p.weight > 0 ? `${p.weight.toFixed(3)}g` : '-'}</td>
                      <td className="py-3 px-4 text-right font-extrabold font-mono text-slate-800 dark:text-white">
                        ₹{p.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Aggregate Sales by Date Table */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden blue-glow">
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 flex justify-between items-center">
          <h4 className="font-serif text-sm font-bold text-slate-800 dark:text-white">Daily Summary Ledger</h4>
          <span className="text-[10px] text-slate-400 font-mono">Latest first</span>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/20">
                <th className="py-2.5 px-6">Sales Date</th>
                <th className="py-2.5 px-6 text-center">Invoices Count</th>
                <th className="py-2.5 px-6 text-right">Daily Revenue Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {dateBreakdownList.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-8 text-center text-slate-400 italic">No daily summaries.</td>
                </tr>
              ) : (
                dateBreakdownList.slice(0, 15).map((d, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-800 dark:text-white">{d.date}</td>
                    <td className="py-3.5 px-6 text-center font-mono font-bold text-slate-500">{d.count}</td>
                    <td className="py-3.5 px-6 text-right font-extrabold font-mono text-blue-600 dark:text-blue-400">
                      ₹{d.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
