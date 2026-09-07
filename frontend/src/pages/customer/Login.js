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
    <div className="page-container" style={{ maxWidth: 430 }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>👤</div>
        <h1 className="page-title" style={{ fontSize: '1.7rem' }}>Customer Login</h1>
        <p className="page-sub">Login to book and track your rides</p>
      </div>

      <div className="card animate-slide">
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <span>❌</span><span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="your@email.com"
              value={form.CUST_EMAIL} onChange={e => setForm(p => ({ ...p, CUST_EMAIL: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Your password"
              value={form.CUST_PASSWORD} onChange={e => setForm(p => ({ ...p, CUST_PASSWORD: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit(e)} />
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading ? <><Spinner /> Logging in…</> : '🔐 Customer Login'}
          </button>
        </form>

        <div className="divider" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--s500)' }}>
            No account? <Link to="/register" style={{ color: 'var(--pri)', fontWeight: 700 }}>Register here</Link>
          </p>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--s500)' }}>
            Are you a driver? <Link to="/driver-login" style={{ color: 'var(--pri)', fontWeight: 700 }}>Driver Login →</Link>
          </p>
        </div>

        <div className="divider" />
        <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--s400)' }}>
          🔑 Demo: <strong>amit@email.com</strong> / <strong>pass123</strong>
        </div>
      </div>
    </div>
  );
}
