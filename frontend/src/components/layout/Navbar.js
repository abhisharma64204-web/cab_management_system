import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout, isCustomer, isDriver } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
    setMenuOpen(false);
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
    <nav className={`navbar${menuOpen ? ' menu-open' : ''}`}>
      {/* Brand */}
      <Link to="/" className="nav-brand" onClick={() => setMenuOpen(false)}>
        <div className="nav-brand-icon">🚖</div>
        <span className="nav-brand-text">Cab<span style={{ color: 'var(--pri)' }}>Go</span></span>
      </Link>

      <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
        {menuOpen ? '✕' : '☰'}
      </button>

      {/* Nav Menu */}
      <div className="nav-menu">
        {/* Nav links */}
        <div className="nav-links">
          {links.map(l => (
            <Link key={l.to} to={l.to} style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
              <button className="btn btn-ghost btn-sm"
                style={isActive(l.to) ? { background: 'var(--pri-light)', color: 'var(--pri)' } : {}}>
                {l.label}
              </button>
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="nav-right">
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
              <div className="nav-auth">
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  <button className="btn btn-secondary btn-sm">👤 Customer Login</button>
                </Link>
                <Link to="/driver-login" onClick={() => setMenuOpen(false)}>
                  <button className="btn btn-secondary btn-sm">🚗 Driver Login</button>
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}>
                  <button className="btn btn-primary btn-sm">Register</button>
                </Link>
              </div>
            </>
          )}
          {/* Admin always accessible */}
          <Link to="/admin" onClick={() => setMenuOpen(false)}>
            <button className="btn btn-sm" style={{ background: 'var(--s800)', color: '#fff' }}>🛡️ Admin</button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
