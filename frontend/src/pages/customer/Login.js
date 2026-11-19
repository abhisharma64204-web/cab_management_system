import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/common';

export default function CustomerLogin() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ CUST_EMAIL: '', CUST_PASSWORD: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.CUST_EMAIL || !form.CUST_PASSWORD) { setError('Please enter email and password'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await API.post('/customers/login', form);
      login({ ...data.data, role: 'customer' });
      toast.success(`Welcome back, ${data.data.CUST_NAME}! 👋`);
      navigate('/my-rides');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
    }}>
      <div className="login-split-card animate-slide">
        {/* Left half: Video background */}
        <div className="login-split-video">
          <video
            autoPlay
            loop
            muted
            playsInline
          >
            <source src={`${process.env.PUBLIC_URL}/cab_go.mp4`} type="video/mp4" />
          </video>
          <div className="login-split-overlay" />
          <div className="login-split-content">
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(249, 115, 22, 0.9)',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              marginBottom: 16,
              boxShadow: '0 4px 12px rgba(249,115,22,0.4)',
            }}>
              <span>🚖</span> CabGo Rides
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.15, marginBottom: 12, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              Your Ride,<br />Your Way.
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#ffffff', lineHeight: 1.5, maxWidth: 320, textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
              Reliable city commutes, instant booking, and verified drivers at transparent fares.
            </p>
          </div>
        </div>

        {/* Right half: Form */}
        <div className="login-split-form">
          <div style={{ textAlign: 'left', marginBottom: 24 }}>
            <h1 className="page-title" style={{ fontSize: '1.75rem', marginBottom: 6 }}>Welcome back</h1>
            <p className="page-sub" style={{ fontSize: '0.9rem' }}>Log in to book and track your rides</p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 16 }}>
              <span>❌</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="your@email.com"
                value={form.CUST_EMAIL}
                onChange={e => setForm(p => ({ ...p, CUST_EMAIL: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Your password"
                value={form.CUST_PASSWORD}
                onChange={e => setForm(p => ({ ...p, CUST_PASSWORD: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
              {loading ? <><Spinner /> Logging in…</> : '🔐 Customer Login'}
            </button>
          </form>

          <div className="divider" style={{ margin: '20px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--s500)' }}>
              No account? <Link to="/register" style={{ color: 'var(--pri)', fontWeight: 700 }}>Register here</Link>
            </p>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--s500)' }}>
              Are you a driver? <Link to="/driver-login" style={{ color: 'var(--pri)', fontWeight: 700 }}>Driver Login →</Link>
            </p>
          </div>

          <div className="divider" style={{ margin: '16px 0 12px' }} />
          <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--s400)' }}>
            🔑 Demo: <strong>qwerty@example.com</strong> / <strong>qwerty</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
