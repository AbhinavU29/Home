import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  IndianRupee, 
  Receipt, 
  Users, 
  RefreshCw, 
  FileText, 
  ExternalLink,
  Clock,
  TrendingUp
} from 'lucide-react';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const loadDashboardData = async () => {
    setError('');
    try {
      const kpiRes = await api.get('/reports/dashboard-kpi');
      setKpis(kpiRes.data);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
      setError('Could not fetch dashboard metrics. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleDownloadPDF = async (billId, serialNumber) => {
    try {
      const response = await api.get(`/bills/${billId}/pdf`, { responseType: 'blob' });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `${serialNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download invoice PDF.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-blue-600 dark:text-blue-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
        <p className="text-sm font-medium tracking-wide">Compiling sales metrics & customer records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-slate-800 dark:text-white">
            Billing Command Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time billing analytics, customer registration tallies, and recent transaction log.
          </p>
        </div>
        <button 
          onClick={loadDashboardData}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-300 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-4 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Turnover */}
        <div className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 p-6 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all blue-glow">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold block">
              Total Revenue
            </span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">
              ₹{(kpis?.total_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3 h-3" /> System Live
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Total Bills Generated */}
        <div className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 p-6 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all blue-glow">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold block">
              Total Invoices
            </span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">
              {kpis?.bills_count || 0}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Registered transactions
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Registered Customers */}
        <div className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 p-6 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-blue-500/30 transition-all blue-glow">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold block">
              Customer Registry
            </span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight">
              {kpis?.customers_count || 0}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Unique phone records
            </p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-xl p-6 shadow-sm blue-glow">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-850 pb-4">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-serif text-lg font-bold text-slate-800 dark:text-white">
            Recent Invoices Issued
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Discount</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {!kpis?.recent_bills || kpis.recent_bills.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 italic">
                    No transactions recorded yet. Click on "POS Billing" to create one.
                  </td>
                </tr>
              ) : (
                kpis.recent_bills.map((bill) => (
                  <tr key={bill.bill_id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {bill.purchase_id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-200">
                      {bill.customer_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {bill.phone_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {formatDateTime(bill.date)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-650 dark:text-slate-350">
                      ₹{bill.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right text-red-500 font-medium">
                      ₹{bill.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-800 dark:text-white">
                      ₹{bill.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button 
                        onClick={() => handleDownloadPDF(bill.bill_id, bill.purchase_id)}
                        className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors border border-blue-200 dark:border-blue-900/60 rounded px-2 py-1 bg-blue-50/50 dark:bg-blue-950/20"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        PDF
                      </button>
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
