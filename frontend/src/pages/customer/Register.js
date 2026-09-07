import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/common';

const CITIES = ['Mumbai','Delhi','Bangalore','Chennai','Hyderabad','Pune','Kolkata','Ahmedabad','Jaipur','Surat'];

export default function CustomerRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const [form, setForm] = useState({
    CUST_NAME: '', CUST_PHONE: '', CUST_EMAIL: '',
    CUST_ADDRESS: '', CUST_CITY: 'Bangalore',
    CUST_PASSWORD: '', confirm: '',
  });

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.CUST_NAME.trim())                         e.CUST_NAME     = 'Full name is required';
    if (!/^\d{10}$/.test(form.CUST_PHONE))              e.CUST_PHONE    = 'Enter a valid 10-digit phone';
    if (!/\S+@\S+\.\S+/.test(form.CUST_EMAIL))          e.CUST_EMAIL    = 'Enter a valid email address';
    if (!form.CUST_ADDRESS.trim())                       e.CUST_ADDRESS  = 'Address is required';
    if (form.CUST_PASSWORD.length < 6)                   e.CUST_PASSWORD = 'Min 6 characters';
    if (form.CUST_PASSWORD !== form.confirm)             e.confirm       = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const { data } = await API.post('/customers/register', form);
      // Auto login after registration
      login({ ...data.data, CUST_NAME: form.CUST_NAME, role: 'customer' });
      toast.success('Welcome aboard! 🎉 Account created successfully.');
      navigate('/book');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ name, label, type = 'text', placeholder, half }) => (
    <div className={`form-group${half ? '' : ''}`}>
      <label className="form-label">{label} <span>*</span></label>
      <input
        className="form-input"
        type={type}
        placeholder={placeholder}
        value={form[name]}
        onChange={e => set(name, e.target.value)}
      />
      {errors[name] && <span className="form-error">{errors[name]}</span>}
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h1 className="page-title">Create Account</h1>
          <p className="page-sub">Join CabGo and start booking rides instantly</p>
        </div>
        <Link to="/login" style={{ textDecoration:'none' }}>
          <button className="btn btn-secondary btn-sm">Already a member?</button>
        </Link>
      </div>

      <div className="card animate-slide">
        <form onSubmit={handleSubmit}>
          {/* Personal Info */}
          <div className="section-title">Personal Information</div>
          <div className="form-grid mb-16">
            <Field name="CUST_NAME"    label="Full Name"    placeholder="Your full name" />
            <Field name="CUST_PHONE"   label="Phone Number" placeholder="10-digit mobile" />
            <Field name="CUST_EMAIL"   label="Email Address" type="email" placeholder="you@example.com" />
            <div className="form-group">
              <label className="form-label">City <span>*</span></label>
              <select className="form-select" value={form.CUST_CITY} onChange={e => set('CUST_CITY', e.target.value)}>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group col-span-2">
              <Field name="CUST_ADDRESS" label="Street Address" placeholder="House/flat no, street name" />
            </div>
          </div>

          {/* Security */}
          <div className="section-title">Account Security</div>
          <div className="form-grid mb-20">
            <Field name="CUST_PASSWORD" label="Password"         type="password" placeholder="Minimum 6 characters" />
            <Field name="confirm"       label="Confirm Password" type="password" placeholder="Repeat your password" />
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading ? <><Spinner /> Creating account…</> : '🚀 Create My Account'}
          </button>

          <p style={{ textAlign:'center', marginTop:14, fontSize:'0.85rem', color:'var(--s500)' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color:'var(--pri)', fontWeight:700 }}>Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
