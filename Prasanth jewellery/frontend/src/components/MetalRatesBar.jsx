import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { TrendingUp, RefreshCw } from 'lucide-react';

export default function MetalRatesBar() {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRates = async () => {
    try {
      const response = await api.get('/metal-rates');
      setRates(response.data);
    } catch (error) {
      console.error('Failed to load live metal rates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 300000); // refresh every 5 mins
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-charcoal-dark border-b border-gold/10 py-1.5 px-4 text-center text-xs text-gold flex items-center justify-center gap-2">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Loading live bullion rates...</span>
      </div>
    );
  }

  return (
    <div className="bg-charcoal-dark border-b border-gold/20 py-2 overflow-hidden select-none">
      <div className="relative flex items-center">
        {/* Left Badge */}
        <div className="absolute left-0 z-10 bg-gold text-charcoal-dark px-3 py-0.5 text-xs font-semibold tracking-wider flex items-center gap-1 shadow-md rounded-r font-sans uppercase">
          <TrendingUp className="w-3.5 h-3.5" />
          Live Rates
        </div>

        {/* Ticker Text */}
        <div className="w-full overflow-hidden flex items-center">
          <div className="animate-ticker flex items-center gap-12 text-xs text-cream-light font-medium tracking-wide pl-28">
            {/* Duplicate values to ensure seamless looping */}
            {Array(3).fill(null).map((_, groupIdx) => (
              <React.Fragment key={groupIdx}>
                <span>Gold 24K: <strong className="text-gold">₹{rates?.gold_24k || '...'} / g</strong></span>
                <span>Gold 22K: <strong className="text-gold">₹{rates?.gold_22k || '...'} / g</strong></span>
                <span>Gold 18K: <strong className="text-gold">₹{rates?.gold_18k || '...'} / g</strong></span>
                <span>Silver 999: <strong className="text-silver">₹{rates?.silver || '...'} / g</strong></span>
                <span>Platinum: <strong className="text-slate-300">₹{rates?.platinum || '...'} / g</strong></span>
                <span className="text-gold/30">|</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
