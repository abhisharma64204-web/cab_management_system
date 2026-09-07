import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';

import HomePage          from './pages/HomePage';
import CustomerRegister  from './pages/customer/Register';
import CustomerLogin     from './pages/customer/Login';
import DriverRegister    from './pages/driver/DriverRegister';
import DriverLogin       from './pages/driver/DriverLogin';
import DriverDashboard   from './pages/driver/DriverDashboard';
import RideBooking       from './pages/rides/RideBooking';
import MyRides           from './pages/rides/MyRides';
import AdminDashboard    from './pages/admin/AdminDashboard';

function CustomerRoute({ children }) {
  const { user, isCustomer } = useAuth();
  if (!user)       return <Navigate to="/login" replace />;
  if (!isCustomer) return <Navigate to="/driver-dashboard" replace />;
  return children;
}

function DriverRoute({ children }) {
  const { user, isDriver } = useAuth();
  if (!user)     return <Navigate to="/driver-login" replace />;
  if (!isDriver) return <Navigate to="/my-rides" replace />;
  return children;
}

function AppRoutes() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public */}
          <Route path="/"                element={<HomePage />} />
          <Route path="/register"        element={<CustomerRegister />} />
          <Route path="/login"           element={<CustomerLogin />} />
          <Route path="/driver-register" element={<DriverRegister />} />
          <Route path="/driver-login"    element={<DriverLogin />} />

          {/* Customer protected */}
          <Route path="/book"     element={<CustomerRoute><RideBooking /></CustomerRoute>} />
          <Route path="/my-rides" element={<CustomerRoute><MyRides /></CustomerRoute>} />

          {/* Driver protected */}
          <Route path="/driver-dashboard" element={<DriverRoute><DriverDashboard /></DriverRoute>} />

          {/* Admin (open) */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer style={{ background: 'var(--s800)', color: 'rgba(255,255,255,.6)', textAlign: 'center', padding: '14px 24px', fontSize: '0.82rem' }}>
        © 2025 CabGo — Cab Management System · React + Node.js + MySQL + Socket.io
      </footer>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { fontFamily: "'Outfit',sans-serif", fontSize: '0.88rem', fontWeight: 600 },
          success: { iconTheme: { primary: '#22C55E', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
