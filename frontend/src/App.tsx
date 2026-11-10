import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Landing
import { LandingPage } from './pages/landing/LandingPage';
import { FeaturesPage } from './pages/landing/FeaturesPage';
import { PricingPage } from './pages/landing/PricingPage';

// Auth
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Customer
import { CustomerOrderPage } from './pages/customer/CustomerOrderPage';
import { OrderStatusTrackerPage } from './pages/customer/OrderStatusTrackerPage';

// Dashboard
import { DashboardOverview } from './pages/dashboard/DashboardOverview';
import { KitchenDisplayPage } from './pages/dashboard/KitchenDisplayPage';
import { ServiceStaffPage } from './pages/dashboard/ServiceStaffPage';
import { OrderManagement } from './pages/dashboard/OrderManagement';
import { MenuManagement } from './pages/dashboard/MenuManagement';
import { TableManagement } from './pages/dashboard/TableManagement';
import { StaffManagement } from './pages/dashboard/StaffManagement';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { SubscriptionPage } from './pages/dashboard/SubscriptionPage';

// Super Admin
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';

const Spinner = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/pricing" element={<PricingPage />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Customer Ordering — public, no auth */}
      <Route path="/menu" element={<CustomerOrderPage />} />
      <Route path="/menu/:slug" element={<CustomerOrderPage />} />
      <Route path="/order/:slug/:token" element={<CustomerOrderPage />} />
      <Route path="/order/status/:orderId" element={<OrderStatusTrackerPage />} />
      <Route path="/tejas" element={<CustomerOrderPage />} />

      {/* Kitchen Display — protected */}
      <Route path="/kitchen" element={
        <ProtectedRoute allowedRoles={['KITCHEN_STAFF', 'KITCHEN_MANAGER', 'RESTAURANT_OWNER', 'PLATFORM_ADMIN', 'RESTAURANT_MANAGER']}>
          <KitchenDisplayPage />
        </ProtectedRoute>
      } />

      {/* Service/Waiter */}
      <Route path="/service" element={
        <ProtectedRoute>
          <DashboardLayout><ServiceStaffPage /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Owner Dashboard */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><DashboardOverview /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/orders" element={<ProtectedRoute><DashboardLayout><OrderManagement /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/menu" element={<ProtectedRoute><DashboardLayout><MenuManagement /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/tables" element={<ProtectedRoute><DashboardLayout><TableManagement /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/staff" element={<ProtectedRoute><DashboardLayout><StaffManagement /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/settings" element={<ProtectedRoute><DashboardLayout><SettingsPage /></DashboardLayout></ProtectedRoute>} />
      <Route path="/dashboard/subscription" element={<ProtectedRoute><DashboardLayout><SubscriptionPage /></DashboardLayout></ProtectedRoute>} />

      {/* Super Admin */}
      <Route path="/super-admin" element={
        <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
          <SuperAdminLayout><SuperAdminDashboard /></SuperAdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/super-admin/restaurants" element={
        <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
          <SuperAdminLayout><SuperAdminDashboard /></SuperAdminLayout>
        </ProtectedRoute>
      } />

      {/* 404 → landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
