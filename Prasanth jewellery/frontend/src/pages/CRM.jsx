import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  X,
  UserCheck,
  AlertCircle,
  User,
  Phone,
  MapPin
} from 'lucide-react';

export default function CRM() {
  const { role } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals status
  const [custModal, setCustModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const loadCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setError('Failed to fetch customers list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const openRegisterModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setError('');
    setCustModal(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setName(cust.customer_name);
    setPhone(cust.phone_number);
    setAddress(cust.address || '');
    setError('');
    setCustModal(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!name || !phone) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      if (editingCustomer) {
        // Edit flow
        const res = await api.put(`/customers/${editingCustomer.customer_id}`, {
          customer_name: name,
          phone_number: phone,
          address: address || null
        });
        setSuccess('Customer profile updated successfully.');
      } else {
        // Register flow
        const res = await api.post('/customers', {
          customer_name: name,
          phone_number: phone,
          address: address || null
        });
        setSuccess('New customer profile registered.');
      }
      setCustModal(false);
      loadCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to save customer. Make sure phone number is unique.');
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer record?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/customers/${id}`);
      setSuccess('Customer record deleted successfully.');
      loadCustomers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete customer record.');
    }
  };

  // Filter list
  const filteredCustomers = customers.filter(c => {
    const matchesName = !searchName || c.customer_name.toLowerCase().includes(searchName.toLowerCase());
    const matchesPhone = !searchPhone || c.phone_number.includes(searchPhone);
    const matchesAddress = !searchAddress || (c.address && c.address.toLowerCase().includes(searchAddress.toLowerCase()));
    return matchesName && matchesPhone && matchesAddress;
  });

  const clearFilters = () => {
    setSearchName('');
    setSearchPhone('');
    setSearchAddress('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-slate-800 dark:text-white">
            Customer Profile Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create, view, update, and manage customer profile records for billing tracking.
          </p>
        </div>
        
        <button 
          onClick={openRegisterModal} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition-colors shadow-md shadow-blue-500/10"
        >
          <UserPlus className="w-4 h-4" /> 
          Register Customer
        </button>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 p-3 rounded-lg text-xs flex items-center gap-2">
          <UserCheck className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Advanced Filters Panel */}
      <div className="bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-850 p-5 rounded-xl shadow-sm space-y-4 blue-glow">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Filter Profiles Registry
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="relative">
            <User className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Filter by Customer Name..." 
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-850 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Filter by Phone Number..." 
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Filter by Residential Address..." 
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-855 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          {(searchName || searchPhone || searchAddress) && (
            <button 
              onClick={clearFilters}
              className="text-xs font-semibold text-slate-550 hover:text-slate-800 dark:hover:text-slate-250 flex items-center gap-1 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 shadow-sm transition-colors"
            >
              Clear Filters
            </button>
          )}
          <button 
            onClick={loadCustomers}
            className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 px-4 py-2 rounded-lg shadow transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Registry
          </button>
        </div>
      </div>

      {/* Table view */}
      {loading ? (
        <div className="py-24 text-center text-blue-600 dark:text-blue-400 space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-sm font-medium">Accessing client accounts database...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-850 rounded-xl shadow-sm overflow-hidden blue-glow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/50">
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-5">Customer Name</th>
                  <th className="py-3 px-5">Phone Number</th>
                  <th className="py-3 px-5">Residential Address</th>
                  {role === 'Admin' && <th className="py-3 px-5 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={role === 'Admin' ? 5 : 4} className="py-8 text-center text-slate-450 italic">
                      No client profiles found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.customer_id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-slate-400 dark:text-slate-500">
                        #{cust.customer_id}
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-800 dark:text-white">
                        {cust.customer_name}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-700 dark:text-slate-350">
                        {cust.phone_number}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400">
                        {cust.address || <span className="text-slate-300 dark:text-slate-700 italic">No address provided</span>}
                      </td>
                      {role === 'Admin' && (
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex justify-center items-center gap-3">
                            <button 
                              onClick={() => openEditModal(cust)} 
                              className="p-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                              title="Edit Profile"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCustomer(cust.customer_id)} 
                              className="p-1 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
                              title="Delete Profile"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {custModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setCustModal(false)} />
          
          <div className="bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 relative z-10 space-y-5 shadow-2xl blue-glow">
            <button 
              onClick={() => setCustModal(false)} 
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="font-serif text-xl text-slate-800 dark:text-white font-bold border-b border-slate-100 dark:border-slate-850 pb-3">
              {editingCustomer ? 'Update Customer Profile' : 'Register Customer'}
            </h3>
            
            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Customer Full Name *
                </label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  placeholder="e.g. Abhinav Sharma"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Phone Number *
                </label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  placeholder="e.g. 9876543210"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Residential Address
                </label>
                <textarea 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-20 placeholder:text-slate-400"
                  placeholder="e.g. 123 Bazaar Road, Coimbatore"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setCustModal(false)} 
                  className="flex-1 border border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs shadow-md shadow-blue-500/10"
                >
                  {editingCustomer ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
