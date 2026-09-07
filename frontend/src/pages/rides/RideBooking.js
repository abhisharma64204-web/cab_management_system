import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Spinner, Avatar, RideTracker, formatCurrency } from '../../components/common';

const RIDE_TYPES  = ['Standard','Premium','SUV','Auto'];
const LOCATIONS   = ['Airport','City Center','Mall','University','Train Station','Hotel Grand','Office Park','Suburb','Tech Park','Medical Center','Bus Stand','Hill View'];
const FARE_RATES  = { Standard:12, Premium:20, SUV:18, Auto:8 };
const BASE_FARE   = 40;
const TYPE_ICONS  = { Standard:'🚗', Premium:'🚘', SUV:'🚙', Auto:'🛺' };

export default function RideBooking() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [avDrivers, setAvDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [bookedRide, setBookedRide]         = useState(null);

  const [form, setForm] = useState({
    PICKUP_LOC: '', DROP_LOC: '', RIDE_TYPE: 'Standard', DISTANCE: '',
  });

  const fare = form.DISTANCE && !isNaN(form.DISTANCE)
    ? Math.round(BASE_FARE + Number(form.DISTANCE) * (FARE_RATES[form.RIDE_TYPE] || 12))
    : 0;

  // Load available drivers
  useEffect(() => {
    API.get('/drivers/available').then(r => setAvDrivers(r.data.data || [])).catch(() => {});
  }, []);

  const handleFindDrivers = () => {
    if (!form.PICKUP_LOC) { toast.error('Select pickup location'); return; }
    if (!form.DROP_LOC)   { toast.error('Select drop location');   return; }
    if (form.PICKUP_LOC === form.DROP_LOC) { toast.error('Pickup and drop must differ'); return; }
    if (!form.DISTANCE || Number(form.DISTANCE) <= 0) { toast.error('Enter a valid distance'); return; }
    if (!user) { toast.error('Please login first'); navigate('/login'); return; }
    setStep(2);
  };

  const handleBook = async () => {
    if (!selectedDriver) { toast.error('Please select a driver'); return; }
    setLoading(true);
    try {
      const { data } = await API.post('/rides', {
        CUST_ID:    user.CUST_ID,
        PICKUP_LOC: form.PICKUP_LOC,
        DROP_LOC:   form.DROP_LOC,
        RIDE_TYPE:  form.RIDE_TYPE,
        DISTANCE:   Number(form.DISTANCE),
      });
      setBookedRide(data.data);
      setStep(3);
      toast.success(`${data.data.DRIVER_NAME} is on the way! 🚖`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ─── Step 1: Trip details ─── */
  if (step === 1) return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Book a Ride</h1>
        <p className="page-sub">Fast, safe, and reliable — every trip</p>
      </div>

      {!user && (
        <div className="alert alert-warning mb-20" style={{ marginBottom:16 }}>
          ⚠️ Please <Link to="/login" style={{ fontWeight:700 }}>login</Link> or <Link to="/register" style={{ fontWeight:700 }}>register</Link> before booking.
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, maxWidth:1000, margin:'0 auto' }}>
        {/* Left: form */}
        <div className="card animate-slide">
          <div className="card-title">🗺️ Trip Details</div>

          <div className="form-group mb-16" style={{ marginBottom:14 }}>
            <label className="form-label">Pickup Location <span>*</span></label>
            <select className="form-select" value={form.PICKUP_LOC} onChange={e => setForm(p => ({ ...p, PICKUP_LOC: e.target.value }))}>
              <option value="">— Select pickup —</option>
              {LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div className="form-group mb-16" style={{ marginBottom:14 }}>
            <label className="form-label">Drop Location <span>*</span></label>
            <select className="form-select" value={form.DROP_LOC} onChange={e => setForm(p => ({ ...p, DROP_LOC: e.target.value }))}>
              <option value="">— Select destination —</option>
              {LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div className="form-grid mb-16" style={{ marginBottom:14 }}>
            <div className="form-group">
              <label className="form-label">Ride Type</label>
              <select className="form-select" value={form.RIDE_TYPE} onChange={e => setForm(p => ({ ...p, RIDE_TYPE: e.target.value }))}>
                {RIDE_TYPES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Distance (km) <span>*</span></label>
              <input className="form-input" type="number" min="1" placeholder="e.g. 12" value={form.DISTANCE}
                onChange={e => setForm(p => ({ ...p, DISTANCE: e.target.value }))} />
            </div>
          </div>

          {/* Fare estimator */}
          {fare > 0 && (
            <div className="fare-box mb-16" style={{ marginBottom:14 }}>
              <div style={{ fontWeight:700, marginBottom:10, color:'#C2410C' }}>💰 Fare Estimate</div>
              <div className="fare-row"><span>Base fare</span><span>₹{BASE_FARE}</span></div>
              <div className="fare-row"><span>{form.DISTANCE} km × ₹{FARE_RATES[form.RIDE_TYPE]}/km</span><span>₹{Number(form.DISTANCE)*FARE_RATES[form.RIDE_TYPE]}</span></div>
              <div className="fare-row total"><span>Total Fare</span><span>{formatCurrency(fare)}</span></div>
            </div>
          )}

          <button className="btn btn-primary btn-lg btn-full" onClick={handleFindDrivers}>
            🔍 Find Available Drivers
          </button>
        </div>

        {/* Right: ride types & available count */}
        <div>
          <div className="card mb-16" style={{ marginBottom:16 }}>
            <div className="card-title">⚡ Ride Types</div>
            {RIDE_TYPES.map(t => (
              <div key={t}
                onClick={() => setForm(p => ({ ...p, RIDE_TYPE: t }))}
                style={{
                  display:'flex', alignItems:'center', gap:12, padding:'11px', borderRadius:'var(--radius)',
                  cursor:'pointer', marginBottom:6,
                  background: form.RIDE_TYPE===t ? 'var(--pri-light)' : 'var(--s50)',
                  border: `2px solid ${form.RIDE_TYPE===t ? 'var(--pri)' : 'var(--s200)'}`,
                  transition:'all .15s',
                }}>
                <span style={{ fontSize:22 }}>{TYPE_ICONS[t]}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:'0.92rem' }}>{t}</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--s500)' }}>₹{BASE_FARE} + ₹{FARE_RATES[t]}/km</div>
                </div>
                {form.RIDE_TYPE===t && <span style={{ color:'var(--pri)', fontWeight:800 }}>✓</span>}
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-title">🚗 Available Drivers</div>
            <div style={{ fontSize:'0.8rem', color:'var(--s500)', marginBottom:10 }}>{avDrivers.length} drivers ready near you</div>
            {avDrivers.slice(0,3).map(d => (
              <div key={d.DRIVER_ID} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--s100)' }}>
                <Avatar name={d.DRIVER_NAME} size="sm" />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:'0.88rem' }}>{d.DRIVER_NAME}</div>
                  <div style={{ fontSize:'0.76rem', color:'var(--s500)' }}>{d.VEHICLE_TYPE} · {d.AVG_RATING ? `⭐${d.AVG_RATING}` : 'New'}</div>
                </div>
                <span className="badge badge-green">Available</span>
              </div>
            ))}
            {avDrivers.length === 0 && <div style={{ color:'var(--s400)', fontSize:'0.85rem' }}>No drivers available right now</div>}
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── Step 2: Select driver ─── */
  if (step === 2) return (
    <div className="page-container">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 className="page-title">Select Driver</h1>
          <p className="page-sub">{form.PICKUP_LOC} → {form.DROP_LOC} · {form.DISTANCE}km · <strong style={{ color:'var(--pri)' }}>{formatCurrency(fare)}</strong></p>
        </div>
        <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
      </div>

      <div style={{ maxWidth:660, margin:'0 auto', display:'flex', flexDirection:'column', gap:12 }}>
        {avDrivers.length === 0 && (
          <div className="alert alert-warning">⚠️ No available drivers right now. Please try again shortly.</div>
        )}
        {avDrivers.map(d => (
          <div key={d.DRIVER_ID}
            onClick={() => setSelectedDriver(d)}
            style={{
              display:'flex', alignItems:'center', gap:14, padding:18, borderRadius:'var(--radius-md)',
              cursor:'pointer', border:`2px solid ${selectedDriver?.DRIVER_ID===d.DRIVER_ID ? 'var(--pri)' : 'var(--s200)'}`,
              background: selectedDriver?.DRIVER_ID===d.DRIVER_ID ? 'var(--pri-light)' : '#fff',
              transition:'all .15s',
            }}>
            <Avatar name={d.DRIVER_NAME} size="lg" />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:'1rem' }}>{d.DRIVER_NAME}</div>
              <div style={{ fontSize:'0.82rem', color:'var(--s500)', marginTop:3 }}>
                🚗 {d.VEHICLE_TYPE} · {d.VEHICLE_NO} · {d.EXPERIENCE} yrs exp
              </div>
              <div style={{ display:'flex', gap:7, marginTop:6 }}>
                {d.AVG_RATING > 0 && <span className="badge badge-yellow">⭐ {d.AVG_RATING}</span>}
                <span className="badge badge-green">✓ Verified</span>
                <span className="badge badge-gray">{d.TOTAL_RIDES} rides</span>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontWeight:900, color:'var(--pri)', fontSize:'1.3rem' }}>{formatCurrency(fare)}</div>
              <div style={{ fontSize:'0.78rem', color:'var(--s400)' }}>{form.DISTANCE} km</div>
              {selectedDriver?.DRIVER_ID===d.DRIVER_ID && <span className="badge badge-blue" style={{ marginTop:6, display:'inline-flex' }}>Selected ✓</span>}
            </div>
          </div>
        ))}

        <button
          className="btn btn-primary btn-lg btn-full"
          style={{ marginTop:8 }}
          onClick={handleBook}
          disabled={!selectedDriver || loading}
        >
          {loading ? <><Spinner /> Booking…</> : `🚖 Confirm Booking · ${formatCurrency(fare)}`}
        </button>
      </div>
    </div>
  );

  /* ─── Step 3: Confirmed ─── */
  if (step === 3 && bookedRide) return (
    <div className="page-container">
      <div style={{ maxWidth:560, margin:'0 auto' }}>
        <div className="card animate-slide">
          <div className="success-screen" style={{ paddingBottom:10 }}>
            <div className="success-icon">🎉</div>
            <div className="success-title">Ride Confirmed!</div>
            <div className="success-sub" style={{ marginBottom:22 }}>Your driver is on the way</div>

            <div style={{ background:'var(--s50)', borderRadius:'var(--radius)', padding:18, textAlign:'left', marginBottom:20 }}>
              {[
                ['Ride ID',   bookedRide.RIDE_ID],
                ['Driver',    bookedRide.DRIVER_NAME],
                ['Vehicle',   bookedRide.VEHICLE_NO],
                ['Phone',     bookedRide.DRIVER_PHONE],
                ['Route',     `${bookedRide.PICKUP_LOC} → ${bookedRide.DROP_LOC}`],
                ['Distance',  `${bookedRide.DISTANCE} km`],
                ['Fare',      formatCurrency(bookedRide.FARE)],
              ].map(([k, v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', fontSize:'0.88rem', borderBottom:'1px solid var(--s100)' }}>
                  <span style={{ color:'var(--s500)' }}>{k}</span>
                  <span style={{ fontWeight:700 }}>{v}</span>
                </div>
              ))}
            </div>

            <RideTracker status="Accepted" />

            <div style={{ display:'flex', gap:10, marginTop:22, justifyContent:'center' }}>
              <button className="btn btn-primary" onClick={() => navigate('/my-rides')}>📋 Track Ride</button>
              <button className="btn btn-secondary" onClick={() => { setStep(1); setForm({ PICKUP_LOC:'', DROP_LOC:'', RIDE_TYPE:'Standard', DISTANCE:'' }); setSelectedDriver(null); }}>
                Book Another
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return null;
}
