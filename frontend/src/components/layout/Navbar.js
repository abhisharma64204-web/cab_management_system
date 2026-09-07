import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout, isCustomer, isDriver } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  // Role-specific nav links
  const customerLinks = [
    { to: '/',              label: '🏠 Home' },
    { to: '/book',          label: '🚖 Book Ride' },
    { to: '/my-rides',      label: '📋 My Rides' },
  ];
  const driverLinks = [
    { to: '/driver-dashboard', label: '🚗 My Dashboard' },
  ];
  const publicLinks = [
    { to: '/', label: '🏠 Home' },
  ];

  const links = isCustomer ? customerLinks : isDriver ? driverLinks : publicLinks;

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid var(--s200)',
      height: 62,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow)',
      gap: 8,
    }}>
      {/* Brand */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', marginRight: 6, flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, background: 'var(--pri)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontWeight: 900 }}>🚖</div>
        <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--s900)' }}>Cab<span style={{ color: 'var(--pri)' }}>Go</span></span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 2, flex: 1 }}>
        {links.map(l => (
          <Link key={l.to} to={l.to} style={{ textDecoration: 'none' }}>
            <button className="btn btn-ghost btn-sm"
              style={isActive(l.to) ? { background: 'var(--pri-light)', color: 'var(--pri)' } : {}}>
              {l.label}
            </button>
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexShrink: 0 }}>
        {user ? (
          <>
            {/* Role pill */}
            <span style={{
              background: isDriver ? 'var(--green-light)' : 'var(--blue-light)',
              color: isDriver ? '#15803D' : '#1D4ED8',
              fontSize: '0.72rem', fontWeight: 700,
              padding: '3px 8px', borderRadius: 'var(--radius-full)',
            }}>
              {isDriver ? '🚗 Driver' : '👤 Customer'}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--s700)', fontWeight: 600 }}>
              {isDriver ? user.DRIVER_NAME : user.CUST_NAME}
            </span>
            {isDriver && (
              <span className={`badge ${user.AVAIL_STATUS === 'Available' ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                {user.AVAIL_STATUS || 'Offline'}
              </span>
            )}
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            {/* Login dropdown area */}
            <div style={{ display: 'flex', gap: 6 }}>
              <Link to="/login">
                <button className="btn btn-secondary btn-sm">👤 Customer Login</button>
              </Link>
              <Link to="/driver-login">
                <button className="btn btn-secondary btn-sm">🚗 Driver Login</button>
              </Link>
              <Link to="/register">
                <button className="btn btn-primary btn-sm">Register</button>
              </Link>
            </div>
          </>
        )}
        {/* Admin always accessible */}
        <Link to="/admin">
          <button className="btn btn-sm" style={{ background: 'var(--s800)', color: '#fff' }}>🛡️ Admin</button>
        </Link>
      </div>
    </nav>
  );
}
