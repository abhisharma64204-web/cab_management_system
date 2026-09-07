import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../../utils/api';
import { Spinner } from '../../components/common';

const VEH_TYPES = ['Sedan', 'SUV', 'Hatchback', 'Auto', 'Premium'];

export default function DriverRegister() {
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors]   = useState({});

  const [form, setForm] = useState({
    DRIVER_NAME: '', DRIVER_PHONE: '', LICENSE_NO: '',
    VEHICLE_TYPE: 'Sedan', VEHICLE_NO: '', EXPERIENCE: '',
  });

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => ({ ...p, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.DRIVER_NAME.trim())              e.DRIVER_NAME  = 'Required';
    if (!/^\d{10}$/.test(form.DRIVER_PHONE))   e.DRIVER_PHONE = 'Valid 10-digit phone';
    if (!form.LICENSE_NO.trim())               e.LICENSE_NO   = 'Required';
    if (!form.VEHICLE_NO.trim())               e.VEHICLE_NO   = 'Required';
    if (!form.EXPERIENCE || isNaN(form.EXPERIENCE)) e.EXPERIENCE = 'Enter valid years';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await API.post('/drivers/register', { ...form, EXPERIENCE: Number(form.EXPERIENCE) });
      setSuccess(true);
      toast.success('Registration submitted! Awaiting admin verification.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="page-container" style={{ maxWidth: 520 }}>
      <div className="card success-screen animate-slide">
        <div className="success-icon">✅</div>
        <div className="success-title">Registration Submitted!</div>
        <div className="success-sub" style={{ marginBottom:24 }}>
          Your application is under review. Admin will verify your documents within 24 hours.
          You'll be able to start accepting rides once verified.
        </div>
        <div style={{ background:'var(--s50)', borderRadius:'var(--radius)', padding:16, marginBottom:24 }}>
          <div style={{ fontSize:'0.82rem', color:'var(--s500)', fontWeight:700, marginBottom:8, textTransform:'uppercase', letterSpacing:'.05em' }}>What happens next?</div>
          {['Admin reviews your documents','Your license & vehicle are verified','Account gets activated','You can start accepting rides!'].map((s,i) => (
            <div key={i} style={{ display:'flex', gap:10, alignItems:'center', padding:'5px 0', fontSize:'0.88rem' }}>
              <span style={{ width:24, height:24, borderRadius:'50%', background:'var(--pri-light)', color:'var(--pri)', fontWeight:800, fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</span>
              {s}
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-full" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: 680 }}>
      <div className="page-header">
        <h1 className="page-title">Driver Registration</h1>
        <p className="page-sub">Join our network of professional drivers</p>
      </div>

      <div className="alert alert-info mb-20" style={{ marginBottom:18 }}>
        <span>ℹ️</span>
        <span><strong>Note:</strong> Your profile requires admin verification before you can accept rides.</span>
      </div>

      <div className="card animate-slide">
        <form onSubmit={handleSubmit}>
          <div className="section-title">Personal Details</div>
          <div className="form-grid mb-16">
            {[
              ['DRIVER_NAME',  'Full Name',        'text',   'Your full name'],
              ['DRIVER_PHONE', 'Phone Number',     'text',   '10-digit mobile'],
              ['LICENSE_NO',   'License Number',   'text',   'DL-XXXX-XXXXXXXX'],
              ['EXPERIENCE',   'Experience (yrs)', 'number', 'e.g. 3'],
            ].map(([name, label, type, ph]) => (
              <div key={name} className="form-group">
                <label className="form-label">{label} <span>*</span></label>
                <input className="form-input" type={type} placeholder={ph} value={form[name]} onChange={e => set(name, e.target.value)} />
                {errors[name] && <span className="form-error">{errors[name]}</span>}
              </div>
            ))}
          </div>

          <div className="section-title">Vehicle Details</div>
          <div className="form-grid mb-20">
            <div className="form-group">
              <label className="form-label">Vehicle Type <span>*</span></label>
              <select className="form-select" value={form.VEHICLE_TYPE} onChange={e => set('VEHICLE_TYPE', e.target.value)}>
                {VEH_TYPES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Number <span>*</span></label>
              <input className="form-input" placeholder="KA01AB1234" value={form.VEHICLE_NO} onChange={e => set('VEHICLE_NO', e.target.value)} />
              {errors.VEHICLE_NO && <span className="form-error">{errors.VEHICLE_NO}</span>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading ? <><Spinner /> Submitting…</> : '🚗 Register as Driver'}
          </button>
        </form>
      </div>
    </div>
  );
}
