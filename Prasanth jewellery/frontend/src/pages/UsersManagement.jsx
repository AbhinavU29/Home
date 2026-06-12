import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Key, 
  RefreshCw, 
  X, 
  ShieldAlert, 
  UserCheck, 
  UserX,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function UsersManagement() {
  const { username: currentUsername } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [userModal, setUserModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  
  // Selected user for editing/resetting
  const [selectedUser, setSelectedUser] = useState(null);

  // Form fields
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [roleInput, setRoleInput] = useState('Operator');
  const [isActiveInput, setIsActiveInput] = useState(1);
  const [fullNameInput, setFullNameInput] = useState('');
  const [mobileNumberInput, setMobileNumberInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password Reset fields
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch users database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setSelectedUser(null);
    setUsernameInput('');
    setPasswordInput('');
    setRoleInput('Operator');
    setIsActiveInput(1);
    setFullNameInput('');
    setMobileNumberInput('');
    setShowPassword(false);
    setError('');
    setUserModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setUsernameInput(user.username);
    setPasswordInput('');
    setRoleInput(user.role);
    setIsActiveInput(user.is_active);
    setFullNameInput(user.full_name || '');
    setMobileNumberInput(user.mobile_number || '');
    setError('');
    setUserModal(true);
  };

  const openResetModal = (user) => {
    setSelectedUser(user);
    setNewPasswordInput('');
    setShowNewPassword(false);
    setError('');
    setResetModal(true);
  };

  // Client-side strong password validation for immediate UX feedback
  const checkPasswordStrength = (pass) => {
    if (pass.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(pass)) return 'Password must contain at least one uppercase letter.';
    if (!/[a-z]/.test(pass)) return 'Password must contain at least one lowercase letter.';
    if (!/\d/.test(pass)) return 'Password must contain at least one number.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return 'Password must contain at least one special character.';
    return null;
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!usernameInput) {
      setError('Username is required.');
      return;
    }

    // If creating, password is required
    if (!selectedUser && !passwordInput) {
      setError('Password is required for new accounts.');
      return;
    }

    if (!selectedUser && passwordInput) {
      const strengthError = checkPasswordStrength(passwordInput);
      if (strengthError) {
        setError(strengthError);
        return;
      }
    }

    try {
      if (selectedUser) {
        // Edit user details
        await api.put(`/auth/users/${selectedUser.user_id}`, {
          username: usernameInput,
          role: roleInput,
          is_active: parseInt(isActiveInput),
          full_name: fullNameInput || null,
          mobile_number: mobileNumberInput || null
        });
        setSuccess(`User account '${usernameInput}' updated successfully.`);
      } else {
        // Register new user
        await api.post('/auth/register', {
          username: usernameInput,
          password: passwordInput,
          role: roleInput,
          full_name: fullNameInput || null,
          mobile_number: mobileNumberInput || null
        });
        setSuccess(`User account '${usernameInput}' registered successfully.`);
      }
      setUserModal(false);
      fetchUsers();
      setTimeout(() => setSuccess(''), 4500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to save user account.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPasswordInput) {
      setError('New password is required.');
      return;
    }

    const strengthError = checkPasswordStrength(newPasswordInput);
    if (strengthError) {
      setError(strengthError);
      return;
    }

    try {
      await api.post(`/auth/users/${selectedUser.user_id}/reset-password`, {
        new_password: newPasswordInput
      });
      setSuccess(`Password for user '${selectedUser.username}' reset successfully.`);
      setResetModal(false);
      setTimeout(() => setSuccess(''), 4500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to reset password.');
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.username === currentUsername) {
      setError('Safety Lock: You cannot delete your own active Admin account!');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete user '${user.username}'?`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      await api.delete(`/auth/users/${user.user_id}`);
      setSuccess(`User account '${user.username}' deleted successfully.`);
      fetchUsers();
      setTimeout(() => setSuccess(''), 4500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to delete user.');
    }
  };

  const handleToggleStatus = async (user) => {
    if (user.username === currentUsername) {
      setError('Safety Lock: You cannot disable your own active Admin account!');
      return;
    }

    setError('');
    setSuccess('');
    const newStatus = user.is_active === 1 ? 0 : 1;
    try {
      await api.put(`/auth/users/${user.user_id}`, {
        is_active: newStatus
      });
      setSuccess(`User '${user.username}' is now ${newStatus === 1 ? 'Enabled' : 'Disabled'}.`);
      fetchUsers();
      setTimeout(() => setSuccess(''), 4500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to toggle account status.');
    }
  };

  // Search filter
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-850 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-wide text-slate-800 dark:text-white flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            User Access Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create employee accounts, assign roles, disable access, reset passwords, and audit login privileges.
          </p>
        </div>
        
        <button 
          onClick={openAddModal} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition-colors shadow-md shadow-blue-500/10"
        >
          <UserPlus className="w-4 h-4" /> 
          Add New User
        </button>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 p-3 rounded-lg text-xs flex items-center gap-2">
          <UserCheck className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-750 dark:text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <input 
            type="text" 
            placeholder="Search users by name or role..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg pl-3 pr-4 py-2.5 text-xs text-slate-850 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>
        <button 
          onClick={fetchUsers}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-350 transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Users
        </button>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="py-24 text-center text-blue-600 dark:text-blue-400 space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-sm font-medium">Accessing user permissions repository...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-xl shadow-sm overflow-hidden blue-glow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/50">
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-5">Full Name</th>
                  <th className="py-3 px-5">Username</th>
                  <th className="py-3 px-5">Mobile Number</th>
                  <th className="py-3 px-5">System Role</th>
                  <th className="py-3 px-5">Access Status</th>
                  <th className="py-3 px-5">Created Date</th>
                  <th className="py-3 px-5 text-center">Admin Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-855">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-450 italic">
                      No user accounts found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.username === currentUsername;
                    return (
                      <tr key={u.user_id} className={`hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors ${u.is_active === 0 ? 'opacity-60 bg-slate-50/30' : ''}`}>
                        <td className="py-3.5 px-5 font-mono text-slate-450 dark:text-slate-500">
                          #{u.user_id}
                        </td>
                        <td className="py-3.5 px-5 font-bold text-slate-850 dark:text-white">
                          {u.full_name || '-'}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                          {u.username}
                          {isSelf && (
                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              You
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-slate-600 dark:text-slate-400">
                          {u.mobile_number || '-'}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            u.role === 'Admin' 
                              ? 'bg-purple-100 text-purple-750 dark:bg-purple-950/40 dark:text-purple-350' 
                              : 'bg-indigo-100 text-indigo-750 dark:bg-indigo-950/40 dark:text-indigo-350'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <button
                            disabled={isSelf}
                            onClick={() => handleToggleStatus(u)}
                            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                              u.is_active === 1
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900'
                            } ${isSelf ? 'cursor-default border-transparent bg-green-50/50 text-green-750' : ''}`}
                            title={isSelf ? 'Cannot disable your own active account' : 'Click to Toggle Status'}
                          >
                            {u.is_active === 1 ? (
                              <>
                                <UserCheck className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3" />
                                Disabled
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                          {new Date(u.created_date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex justify-center items-center gap-3">
                            <button 
                              onClick={() => openEditModal(u)} 
                              className="p-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                              title="Edit User Info"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => openResetModal(u)} 
                              className="p-1 text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 transition-colors"
                              title="Reset Password"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button 
                              disabled={isSelf}
                              onClick={() => handleDeleteUser(u)} 
                              className={`p-1 transition-colors ${
                                isSelf 
                                  ? 'text-slate-200 dark:text-slate-800 cursor-not-allowed' 
                                  : 'text-slate-550 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400'
                              }`}
                              title={isSelf ? 'Cannot delete your own active account' : 'Delete User'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Add / Edit Modal */}
      {userModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setUserModal(false)} />
          
          <div className="bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 relative z-10 space-y-5 shadow-2xl blue-glow">
            <button 
              onClick={() => setUserModal(false)} 
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:text-slate-550 dark:hover:text-slate-350"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="font-serif text-xl text-slate-850 dark:text-white font-bold border-b border-slate-100 dark:border-slate-850 pb-3">
              {selectedUser ? 'Edit User Details' : 'Register New User'}
            </h3>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-750 dark:text-red-400 p-3 rounded-lg text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Full Name
                </label>
                <input 
                  type="text" 
                  value={fullNameInput} 
                  onChange={(e) => setFullNameInput(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  placeholder="e.g. Aditi Iyer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Mobile Number
                </label>
                <input 
                  type="text" 
                  value={mobileNumberInput} 
                  onChange={(e) => setMobileNumberInput(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Username *
                </label>
                <input 
                  type="text" 
                  value={usernameInput} 
                  onChange={(e) => setUsernameInput(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  placeholder="e.g. aditi_cashier"
                />
              </div>

              {!selectedUser && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                    Password * (Min 8 chars, 1 Upper, 1 Lower, 1 Num, 1 Symbol)
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={passwordInput} 
                      onChange={(e) => setPasswordInput(e.target.value)} 
                      required 
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-3.5 pr-10 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                      placeholder="Enter strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-605"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Access Role *
                </label>
                <select 
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value="Operator">Operator / Cashier</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>

              {selectedUser && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                    Account Status
                  </label>
                  <select 
                    value={isActiveInput}
                    onChange={(e) => setIsActiveInput(parseInt(e.target.value))}
                    disabled={selectedUser.username === currentUsername}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none disabled:opacity-50"
                  >
                    <option value={1}>Enabled (Active)</option>
                    <option value={0}>Disabled (Locked)</option>
                  </select>
                  {selectedUser.username === currentUsername && (
                    <span className="text-[9px] text-amber-600 block italic">Cannot disable your own active account</span>
                  )}
                </div>
              )}
              
              <div className="flex gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setUserModal(false)} 
                  className="flex-1 border border-slate-205 dark:border-slate-800 text-slate-550 dark:text-slate-400 py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs shadow-md shadow-blue-500/10"
                >
                  {selectedUser ? 'Update Details' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setResetModal(false)} />
          
          <div className="bg-white dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 relative z-10 space-y-5 shadow-2xl blue-glow">
            <button 
              onClick={() => setResetModal(false)} 
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-650"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="font-serif text-xl text-slate-800 dark:text-white font-bold border-b border-slate-105 dark:border-slate-850 pb-3 flex items-center gap-1.5">
              <Key className="w-5 h-5 text-amber-500" />
              Reset Security Password
            </h3>

            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              You are resetting the password for user: <strong className="text-slate-850 dark:text-white font-bold">{selectedUser?.username}</strong>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-550 block">
                  New Password * (Min 8 chars, 1 Upper, 1 Lower, 1 Num, 1 Symbol)
                </label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? 'text' : 'password'} 
                    value={newPasswordInput} 
                    onChange={(e) => setNewPasswordInput(e.target.value)} 
                    required 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-3.5 pr-10 py-2.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                    placeholder="Enter new strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-655"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setResetModal(false)} 
                  className="flex-1 border border-slate-205 dark:border-slate-800 text-slate-550 dark:text-slate-400 py-2.5 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg text-xs shadow-md shadow-amber-500/10"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
