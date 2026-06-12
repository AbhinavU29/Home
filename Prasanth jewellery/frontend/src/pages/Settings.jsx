import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Settings as SettingsIcon, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  Save,
  RotateCw,
  Coins
} from 'lucide-react';

export default function Settings() {
  const [rates, setRates] = useState({
    gold_24k: 0.0,
    gold_22k: 0.0,
    gold_18k: 0.0,
    silver: 0.0,
    platinum: 0.0
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRates = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await api.get('/metal-rates');
      setRates({
        gold_24k: response.data.gold_24k || 0.0,
        gold_22k: response.data.gold_22k || 0.0,
        gold_18k: response.data.gold_18k || 0.0,
        silver: response.data.silver || 0.0,
        platinum: response.data.platinum || 0.0
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to fetch latest metal rates from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRates(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0.0
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    
    // Quick validation
    if (rates.gold_24k <= 0 || rates.gold_22k <= 0 || rates.silver <= 0) {
      setErrorMsg('Gold and Silver rates must be greater than zero.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/metal-rates', rates);
      setSuccessMsg('Bullion metal rates updated successfully in the system database!');
      
      // Auto dismiss success message
      setTimeout(() => {
        setSuccessMsg('');
      }, 5000);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to update bullion rates.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !rates.gold_24k) {
    return (
      <div className="py-24 text-center text-blue-600 space-y-2">
        <RotateCw className="w-8 h-8 animate-spin mx-auto" />
        <p className="text-xs font-semibold tracking-wider">Loading System Configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-205 dark:border-slate-850 pb-4 flex justify-between items-center">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-slate-850 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-8 h-8 text-slate-500" />
            System Configurations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Maintain live metal values, billing rates, HUID, and global settings.
          </p>
        </div>
        <button
          onClick={fetchRates}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-slate-500"
          title="Refresh Current Rates"
        >
          <RotateCw className="w-4.5 h-4.5" />
        </button>
      </div>

      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-4 rounded-xl text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-750 p-4 rounded-xl text-xs flex items-center gap-2 shadow-sm">
          <XCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left column: Quick Summary Cards */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 mb-4 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-gold" />
              Active Rates Summary
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850">
                <span className="text-xs text-slate-500">Gold 24K</span>
                <span className="font-mono text-sm font-bold text-gold">₹{rates.gold_24k.toLocaleString('en-IN')}/g</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850">
                <span className="text-xs text-slate-500">Gold 22K</span>
                <span className="font-mono text-sm font-bold text-gold">₹{rates.gold_22k.toLocaleString('en-IN')}/g</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850">
                <span className="text-xs text-slate-500">Gold 18K</span>
                <span className="font-mono text-sm font-bold text-gold">₹{rates.gold_18k.toLocaleString('en-IN')}/g</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850">
                <span className="text-xs text-slate-500">Silver 999</span>
                <span className="font-mono text-sm font-bold text-silver">₹{rates.silver.toLocaleString('en-IN')}/g</span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850">
                <span className="text-xs text-slate-500">Platinum</span>
                <span className="font-mono text-sm font-bold text-slate-400">₹{rates.platinum.toLocaleString('en-IN')}/g</span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-xl text-[10px] text-slate-450 leading-relaxed flex gap-2">
            <Coins className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong>Bullion Rate Compliance:</strong> Metal rates configured here will render inside the POS Billing itemized autocomplete panels and ticker widgets. Changing the rate here does not alter historic invoices.
            </div>
          </div>
        </div>

        {/* Right column: Edit Form */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-850 pb-3 mb-6">
            Update Live Bullion Metal Rates (Per Gram in INR)
          </h3>

          <form onSubmit={handleSave} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-650 dark:text-slate-350">
                  Gold 24K Rate (₹ / Gram)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    name="gold_24k"
                    value={rates.gold_24k}
                    onChange={handleChange}
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:border-blue-500 font-mono font-bold"
                    placeholder="7200.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-650 dark:text-slate-350">
                  Gold 22K Rate (₹ / Gram)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    name="gold_22k"
                    value={rates.gold_22k}
                    onChange={handleChange}
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:border-blue-500 font-mono font-bold"
                    placeholder="6600.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-650 dark:text-slate-350">
                  Gold 18K Rate (₹ / Gram)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    name="gold_18k"
                    value={rates.gold_18k}
                    onChange={handleChange}
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:border-blue-500 font-mono font-bold"
                    placeholder="5400.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-650 dark:text-slate-350">
                  Silver 999 Rate (₹ / Gram)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    name="silver"
                    value={rates.silver}
                    onChange={handleChange}
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:border-blue-500 font-mono font-bold"
                    placeholder="90.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-650 dark:text-slate-350">
                  Platinum Rate (₹ / Gram)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    name="platinum"
                    value={rates.platinum}
                    onChange={handleChange}
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:border-blue-500 font-mono font-bold"
                    placeholder="3200.00"
                    required
                  />
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-850">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 shadow transition-colors uppercase tracking-wider text-[10px]"
              >
                {saving ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    Saving Rates...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Configuration
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
