import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/common';

export default function DriverLogin() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ DRIVER_PHONE: '', LICENSE_NO: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.DRIVER_PHONE || !form.LICENSE_NO) { setError('Please enter phone and license number'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await API.post('/drivers/login', form);
      login({ ...data.data, role: 'driver' });
      toast.success(`Welcome back, ${data.data.DRIVER_NAME}! 🚗`);
      navigate('/driver-dashboard');
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
        <div style={{ fontSize: 52, marginBottom: 12 }}>🚗</div>
        <h1 className="page-title" style={{ fontSize: '1.7rem' }}>Driver Login</h1>
        <p className="page-sub">Access your rides and manage your availability</p>
      </div>

      <div className="card animate-slide">
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>
            <span>❌</span><span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Registered Phone Number</label>
            <input className="form-input" type="text" placeholder="10-digit mobile number"
              value={form.DRIVER_PHONE} onChange={e => setForm(p => ({ ...p, DRIVER_PHONE: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">License Number</label>
            <input className="form-input" type="text" placeholder="e.g. KA01-20234567"
              value={form.LICENSE_NO} onChange={e => setForm(p => ({ ...p, LICENSE_NO: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit(e)} />
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading ? <><Spinner /> Logging in…</> : '🚗 Driver Login'}
          </button>
        </form>

        <div className="divider" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--s500)' }}>
            Not registered? <Link to="/driver-register" style={{ color: 'var(--pri)', fontWeight: 700 }}>Register as Driver →</Link>
          </p>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--s500)' }}>
            Are you a customer? <Link to="/login" style={{ color: 'var(--pri)', fontWeight: 700 }}>Customer Login →</Link>
          </p>
        </div>

        <div className="divider" />
        <div style={{ background: 'var(--s50)', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--s500)', marginBottom: 6, textTransform: 'uppercase' }}>Demo Drivers</div>
          {[
            ['Suresh Kumar', '9111222333', 'KA01-20234567'],
            ['Ravi Verma',   '9222333444', 'MH02-20235678'],
            ['Vijay Rao',    '9555666777', 'AP05-20238901'],
          ].map(([name, phone, lic]) => (
            <div key={phone}
              onClick={() => setForm({ DRIVER_PHONE: phone, LICENSE_NO: lic })}
              style={{ padding: '6px 0', fontSize: '0.82rem', cursor: 'pointer', borderBottom: '1px solid var(--s100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>{name}</span>
              <span style={{ color: 'var(--pri)', fontSize: '0.75rem', fontWeight: 600 }}>Use →</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
