import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Inventory from './pages/Inventory';
import CRM from './pages/CRM';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import UsersManagement from './pages/UsersManagement';
import ProductMaster from './pages/ProductMaster';
import ImportData from './pages/ImportData';
import Settings from './pages/Settings';

// Route guard checking login state and role permission
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center text-blue-600 space-y-2">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs uppercase tracking-wider font-semibold">Validating Session...</span>
      </div>
    );
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    // If not permitted, return to login page
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Showroom Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/login" element={<Login />} />

          {/* Employee Control Portals */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['Admin', 'Operator']}>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/billing" element={
            <ProtectedRoute allowedRoles={['Admin', 'Operator']}>
              <Layout><Billing /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/crm" element={
            <ProtectedRoute allowedRoles={['Admin', 'Operator']}>
              <Layout><CRM /></Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['Admin', 'Operator']}>
              <Layout><Reports /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Layout><UsersManagement /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/products" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Layout><ProductMaster /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/import-data" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Layout><ImportData /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/analytics" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Layout><Analytics /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Layout><Settings /></Layout>
            </ProtectedRoute>
          } />

          {/* Page not found redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
