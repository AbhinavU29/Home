import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Gem, Lock, User, RefreshCw, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login, token, role } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (token) {
      navigate('/dashboard');
    }
    
    if (searchParams.get('expired')) {
      setInfoMessage('Your session has timed out. Please sign in again.');
    }
  }, [token, navigate, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      setError('Please fill in all fields.');
      return;
    }
    
    setError('');
    setInfoMessage('');
    setLoading(true);
    
    const result = await login(usernameInput, passwordInput);
    setLoading(false);
    
    if (!result.success) {
      setError(result.error);
    }
  };

  // Helper shortcut for testing/reviewing
  const selectStaffShortcut = (user, pass) => {
    setUsernameInput(user);
    setPasswordInput(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col justify-center items-center px-4 relative overflow-hidden transition-colors duration-200">
      {/* Decorative background grid and gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-650/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-650/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-md w-full space-y-6 relative z-10">
        
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
            <img src="/pj_logo.png" alt="PJ Logo" className="w-16 h-16 object-contain" />
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-widest text-slate-800 dark:text-white">
            PRASANTH JEWELLERY
          </h2>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 tracking-widest uppercase font-bold">
            Billing & Invoicing Ledger
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl p-8 shadow-xl blue-glow">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 text-center">
            Staff Authentication
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {infoMessage && (
              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 p-3 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{infoMessage}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input 
                  type="text" 
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Enter employee username" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter security password" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500/50 text-white font-bold py-3 rounded-lg text-xs uppercase tracking-widest transition-all duration-150 flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : 'Authenticate Session'}
            </button>
          </form>

          {/* Tester Helper shortcuts */}
          <div className="mt-8 border-t border-slate-150 dark:border-slate-850 pt-5 space-y-3">
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
              Select Demo Staff Account
            </p>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <button 
                onClick={() => selectStaffShortcut('admin', 'admin123')}
                className="bg-slate-50 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-250 dark:border-slate-800 py-2.5 rounded-lg transition-colors text-left px-3.5"
              >
                <b className="text-slate-700 dark:text-slate-200">Admin Account</b> <br/>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">admin / admin123</span>
              </button>
              <button 
                onClick={() => selectStaffShortcut('operator', 'operator123')}
                className="bg-slate-50 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-250 dark:border-slate-800 py-2.5 rounded-lg transition-colors text-left px-3.5"
              >
                <b className="text-slate-700 dark:text-slate-200">Operator Cashier</b> <br/>
                <span className="text-[9px] text-slate-400 dark:text-slate-500">operator / operator123</span>
              </button>
            </div>
          </div>

        </div>

        {/* Showroom homepage */}
        <div className="text-center">
          <a href="/" className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            &larr; Back to Showroom Homepage
          </a>
        </div>

      </div>
    </div>
  );
}
