import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Receipt, 
  Users, 
  History, 
  LogOut, 
  Menu, 
  X, 
  Gem, 
  User as UserIcon, 
  Moon, 
  Sun,
  Home,
  BarChart3,
  UserCog,
  Database,
  FileSpreadsheet
} from 'lucide-react';

export default function Layout({ children }) {
  const { username, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    document.documentElement.classList.contains('dark')
  );

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    }
  }, []);

  useEffect(() => {
    if (role === 'Operator') {
      document.documentElement.classList.add('operator-theme');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('operator-theme');
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [role]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      roles: ['Admin', 'Operator'] 
    },
    { 
      name: 'POS Billing', 
      path: '/billing', 
      icon: Receipt, 
      roles: ['Admin', 'Operator'] 
    },
    { 
      name: 'Customers CRUD', 
      path: '/crm', 
      icon: Users, 
      roles: ['Admin', 'Operator'] 
    },
    { 
      name: 'Bill Registry', 
      path: '/reports', 
      icon: History, 
      roles: ['Admin', 'Operator'] 
    },
    { 
      name: 'User Management', 
      path: '/users', 
      icon: UserCog, 
      roles: ['Admin'] 
    },
    { 
      name: 'Product Master', 
      path: '/products', 
      icon: Database, 
      roles: ['Admin'] 
    },
    { 
      name: 'Import Data', 
      path: '/import-data', 
      icon: FileSpreadsheet, 
      roles: ['Admin'] 
    },
    { 
      name: 'Analytics', 
      path: '/analytics', 
      icon: BarChart3, 
      roles: ['Admin'] 
    },
  ];

  const allowedMenuItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      
      {/* HEADER BAR */}
      <header className="bg-blue-900 dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden text-white hover:text-slate-200 focus:outline-none transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <Link to="/" className="flex items-center gap-2">
            <img src="/pj_logo.png" alt="PJ Logo" className="w-8 h-8 object-contain rounded-lg border border-blue-800" />
            <span className="font-serif text-lg md:text-xl font-bold tracking-widest text-white">
              PRASANTH JEWELLERY
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle */}
          {role !== 'Operator' && (
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-blue-800 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Light/Dark Mode"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-yellow-400" /> : <Moon className="w-4.5 h-4.5 text-blue-200" />}
            </button>
          )}

          <Link 
            to="/" 
            className="text-xs text-blue-100 hover:text-white flex items-center gap-1 transition-colors px-2.5 py-1 rounded border border-blue-800 hover:border-blue-700 bg-blue-950/40"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Showroom Web</span>
          </Link>
          
          <div className="flex items-center gap-2 border-l border-blue-800 pl-4">
            <div className="w-8 h-8 rounded-full bg-blue-850 flex items-center justify-center text-white font-bold border border-blue-700">
              {username ? username[0].toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-sm font-semibold leading-tight">{username || 'User'}</span>
              <span className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">{role || 'Role'}</span>
            </div>
          </div>

          <button 
            onClick={handleLogout} 
            className="text-blue-200 hover:text-red-300 p-1.5 rounded-full hover:bg-blue-800 dark:hover:bg-slate-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* CORE BODY CONTAINER */}
      <div className="flex-1 flex relative">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 py-6 px-4 space-y-6 shrink-0 shadow-sm">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 px-3 pb-2">
              Billing Module
            </p>
            <nav className="space-y-1">
              {allowedMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 font-semibold' 
                        : 'text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border border-slate-150 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-slate-900/40 text-[10px]">
            <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">Company Details</p>
            <div className="space-y-1 text-slate-500 dark:text-slate-400 font-mono">
              <div class="flex justify-between">
                <span>Name:</span>
                <span class="font-bold text-slate-700 dark:text-slate-200">Prasanth Jewellery</span>
              </div>
              <div class="flex justify-between">
                <span>Tax:</span>
                <span class="text-green-600 dark:text-green-400">GST Active</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MOBILE SIDEBAR DRAW */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex flex-col w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 h-full p-6 space-y-6 animate-slide-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <img src="/pj_logo.png" alt="PJ Logo" className="w-6 h-6 object-contain rounded border border-slate-200" />
                  <span className="font-bold text-blue-900 dark:text-blue-100">Prasanth Billing</span>
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="text-slate-500 hover:text-blue-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="space-y-1 text-sm font-medium">
                {allowedMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-blue-600 text-white font-semibold shadow-md' 
                          : 'text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* CONTENT VIEWPORT */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
