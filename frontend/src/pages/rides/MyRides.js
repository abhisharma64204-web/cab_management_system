import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import socket from '../../utils/socket';
import {
  Spinner, RideStatusBadge, PaymentStatusBadge, RideTracker,
  Avatar, EmptyState, StarRating, formatDateTime, formatCurrency, Modal
} from '../../components/common';

const PAYMENT_METHODS = ['Cash','Card','UPI','Wallet'];
const METHOD_ICONS    = { Cash:'💵', Card:'💳', UPI:'📱', Wallet:'👛' };

export default function MyRides() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [rides, setRides]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState('');
  const [filter, setFilter]       = useState('All');

  // Modal states
  const [payModal, setPayModal]   = useState(null); // ride object
  const [fbModal, setFbModal]     = useState(null);  // ride object
  const [payMethod, setPayMethod] = useState('Cash');
  const [paying, setPaying]       = useState(false);
  const [fbForm, setFbForm]       = useState({ rating:0, comments:'' });
  const [submittingFb, setSubmittingFb] = useState(false);

  const fetchRides = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await API.get(`/customers/${user.CUST_ID}/history`);
      setRides(data.data || []);
    } catch { } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchRides(); }, [fetchRides]);

  // Real-time updates
  useEffect(() => {
    const onUpdate = () => fetchRides();
    socket.on('rideAccepted',  onUpdate);
    socket.on('rideStarted',   onUpdate);
    socket.on('rideCompleted', onUpdate);
    socket.on('paymentDone',   onUpdate);
    return () => {
      socket.off('rideAccepted',  onUpdate);
      socket.off('rideStarted',   onUpdate);
      socket.off('rideCompleted', onUpdate);
      socket.off('paymentDone',   onUpdate);
    };
  }, [fetchRides]);

  if (!user) return (
    <div className="page-container">
      <EmptyState icon="🔐" title="Login Required" subtitle="Please login to view your rides"
        action={<Link to="/login"><button className="btn btn-primary">Login</button></Link>} />
    </div>
  );

  const FILTERS = ['All','Accepted','Ongoing','Completed','Cancelled'];
  const filtered = rides
    .filter(r => filter === 'All' || r.RIDE_STATUS === filter)
    .filter(r => !query || r.PICKUP_LOC?.toLowerCase().includes(query.toLowerCase()) || r.DROP_LOC?.toLowerCase().includes(query.toLowerCase()));

  const handleCancelRide = async (ride) => {
    if (!window.confirm('Cancel this ride?')) return;
    try {
      await API.patch(`/rides/${ride.RIDE_ID}/cancel`);
      toast.success('Ride cancelled');
      fetchRides();
    } catch (err) { toast.error(err.message); }
  };

  const handlePayment = async () => {
    if (!payModal) return;
    setPaying(true);
    try {
      await API.post('/payments', {
        RIDE_ID: payModal.RIDE_ID, CUST_ID: user.CUST_ID,
        PAYMENT_AMOUNT: payModal.FARE, PAYMENT_METHOD: payMethod,
      });
      toast.success(`Payment of ${formatCurrency(payModal.FARE)} successful! 💰`);
      setPayModal(null);
      fetchRides();
    } catch (err) { toast.error(err.message); }
    finally { setPaying(false); }
  };

  const handleFeedback = async () => {
    if (!fbModal || !fbForm.rating) { toast.error('Please select a rating'); return; }
    setSubmittingFb(true);
    try {
      await API.post('/feedback', {
        RIDE_ID: fbModal.RIDE_ID, CUST_ID: user.CUST_ID,
        DRIVER_ID: fbModal.DRIVER_ID, RATING: fbForm.rating, COMMENTS: fbForm.comments,
      });
      toast.success('Feedback submitted! Thank you ⭐');
      setFbModal(null);
      setFbForm({ rating:0, comments:'' });
      fetchRides();
    } catch (err) { toast.error(err.message); }
    finally { setSubmittingFb(false); }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 className="page-title">My Rides</h1>
          <p className="page-sub">{rides.length} total rides</p>
        </div>
        <Link to="/book"><button className="btn btn-primary">+ Book New Ride</button></Link>
      </div>

      {/* Filters & Search */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div className="search-bar" style={{ flex:1, minWidth:200 }}>
          <span>🔍</span>
          <input placeholder="Search by location…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {FILTERS.map(f => (
            <button key={f}
              className={`btn btn-sm${filter===f ? ' btn-primary' : ' btn-secondary'}`}
              onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {/* Rides list */}
      {loading ? (
        <div style={{ textAlign:'center', padding:40 }}><Spinner dark /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🚖" title="No rides found" subtitle="Book your first ride!"
          action={<Link to="/book"><button className="btn btn-primary">Book a Ride</button></Link>} />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {filtered.map(ride => (
            <div key={ride.RIDE_ID} className="card animate-fade" style={{ padding:20 }}>
              {/* Top row */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontWeight:800, fontSize:'1.05rem' }}>{ride.RIDE_ID}</span>
                  <RideStatusBadge status={ride.RIDE_STATUS} />
                  {ride.RIDE_STATUS === 'Ongoing' && (
                    <span className="live-badge"><span className="live-dot live-dot-red" /> LIVE</span>
                  )}
                </div>
                <span style={{ fontWeight:900, color:'var(--pri)', fontSize:'1.25rem' }}>{formatCurrency(ride.FARE)}</span>
              </div>

              {/* Tracker */}
              {['Accepted','Ongoing','Completed'].includes(ride.RIDE_STATUS) && (
                <div style={{ marginBottom:14 }}><RideTracker status={ride.RIDE_STATUS} /></div>
              )}

              <div className="grid-2" style={{ gap:14, marginBottom:14 }}>
                {/* Route */}
                <div>
                  <div style={{ fontSize:'0.72rem', color:'var(--s400)', fontWeight:700, marginBottom:5, textTransform:'uppercase' }}>Route</div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <span style={{ color:'var(--pri)', fontSize:16 }}>📍</span>
                    <span style={{ fontWeight:600, fontSize:'0.9rem' }}>{ride.PICKUP_LOC}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:16 }}>🏁</span>
                    <span style={{ fontWeight:600, fontSize:'0.9rem' }}>{ride.DROP_LOC}</span>
                  </div>
                  <div style={{ marginTop:6, display:'flex', gap:8 }}>
                    <span className="badge badge-gray">{ride.RIDE_TYPE}</span>
                    <span className="badge badge-gray">{ride.DISTANCE} km</span>
                  </div>
                </div>

                {/* Driver */}
                <div>
                  <div style={{ fontSize:'0.72rem', color:'var(--s400)', fontWeight:700, marginBottom:5, textTransform:'uppercase' }}>Driver</div>
                  {ride.DRIVER_NAME ? (
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <Avatar name={ride.DRIVER_NAME} size="sm" />
                      <div>
                        <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{ride.DRIVER_NAME}</div>
                        <div style={{ fontSize:'0.78rem', color:'var(--s500)' }}>{ride.VEHICLE_NO}</div>
                      </div>
                    </div>
                  ) : <span style={{ color:'var(--s400)', fontSize:'0.85rem' }}>Not assigned</span>}
                </div>

                {/* Times */}
                <div>
                  <div style={{ fontSize:'0.72rem', color:'var(--s400)', fontWeight:700, marginBottom:5, textTransform:'uppercase' }}>Timeline</div>
                  <div style={{ fontSize:'0.82rem' }}>
                    <div>🕐 Requested: {formatDateTime(ride.REQUEST_TIME)}</div>
                    {ride.START_TIME && <div>🚀 Started: {formatDateTime(ride.START_TIME)}</div>}
                    {ride.END_TIME   && <div>🏁 Ended: {formatDateTime(ride.END_TIME)}</div>}
                  </div>
                </div>

                {/* Payment & feedback */}
                <div>
                  <div style={{ fontSize:'0.72rem', color:'var(--s400)', fontWeight:700, marginBottom:5, textTransform:'uppercase' }}>Status</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {ride.PAYMENT_STATUS
                      ? <PaymentStatusBadge status={ride.PAYMENT_STATUS} />
                      : ride.RIDE_STATUS === 'Completed' && <span className="badge badge-yellow">Payment Pending</span>
                    }
                    {ride.RATING && <span className="badge badge-yellow">⭐ {ride.RATING}/5</span>}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', borderTop:'1px solid var(--s100)', paddingTop:12 }}>
                {ride.RIDE_STATUS === 'Accepted' && (
                  <>
                    <span className="badge badge-blue" style={{ padding:'7px 12px' }}>⏳ Waiting for driver to start</span>
                    <button className="btn btn-danger btn-sm" onClick={() => handleCancelRide(ride)}>✕ Cancel Ride</button>
                  </>
                )}
                {ride.RIDE_STATUS === 'Ongoing' && (
                  <span className="badge badge-orange" style={{ padding:'7px 12px' }}>🚗 Ride in progress — driver will end the ride</span>
                )}
                {ride.RIDE_STATUS === 'Completed' && !ride.PAYMENT_STATUS && (
                  <button className="btn btn-primary btn-sm" onClick={() => setPayModal(ride)}>💳 Pay Now · {formatCurrency(ride.FARE)}</button>
                )}
                {ride.RIDE_STATUS === 'Completed' && ride.PAYMENT_STATUS === 'Completed' && !ride.RATING && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setFbModal(ride)}>⭐ Give Feedback</button>
                )}
                {ride.RATING && <span className="badge badge-yellow">⭐ {ride.RATING}/5 — {ride.COMMENTS}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Payment Modal ── */}
      <Modal isOpen={!!payModal} onClose={() => setPayModal(null)}
        title={`Pay ${formatCurrency(payModal?.FARE)}`}
        subtitle={`${payModal?.PICKUP_LOC} → ${payModal?.DROP_LOC}`}>
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
          {PAYMENT_METHODS.map(m => (
            <div key={m} className={`payment-method${payMethod===m?' active':''}`} onClick={() => setPayMethod(m)}>
              <span style={{ fontSize:28 }}>{METHOD_ICONS[m]}</span>
              <div>
                <div style={{ fontWeight:700, fontSize:'0.95rem' }}>{m}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--s500)' }}>
                  {m==='Cash'?'Pay in hand to driver':m==='Card'?'Debit/Credit card':m==='UPI'?'GPay, PhonePe, Paytm':'Stored balance'}
                </div>
              </div>
              {payMethod===m && <span style={{ marginLeft:'auto', color:'var(--pri)', fontWeight:800 }}>✓</span>}
            </div>
          ))}
        </div>
        <div style={{ background:'var(--s50)', borderRadius:'var(--radius)', padding:14, marginBottom:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:'0.88rem' }}>
            <span style={{ color:'var(--s500)' }}>Distance</span><span>{payModal?.DISTANCE} km</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:'1.05rem', color:'var(--pri)' }}>
            <span>Total Amount</span><span>{formatCurrency(payModal?.FARE)}</span>
          </div>
        </div>
        <button className="btn btn-primary btn-lg btn-full" onClick={handlePayment} disabled={paying}>
          {paying ? <><Spinner /> Processing…</> : `✅ Pay ${formatCurrency(payModal?.FARE)} via ${payMethod}`}
        </button>
      </Modal>

      {/* ── Feedback Modal ── */}
      <Modal isOpen={!!fbModal} onClose={() => setFbModal(null)}
        title="Rate Your Ride" subtitle={`${fbModal?.PICKUP_LOC} → ${fbModal?.DROP_LOC} · Driver: ${fbModal?.DRIVER_NAME}`}>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:'0.85rem', color:'var(--s600)', marginBottom:8 }}>How was your experience?</div>
          <StarRating value={fbForm.rating} onChange={r => setFbForm(p => ({ ...p, rating:r }))} />
          <div style={{ fontSize:'0.8rem', color:'var(--s400)', marginTop:4 }}>
            {['','😞 Terrible','😕 Bad','😐 Okay','😊 Good','🤩 Excellent!'][fbForm.rating] || ''}
          </div>
        </div>
        <div className="form-group" style={{ marginBottom:18 }}>
          <label className="form-label">Comments (optional)</label>
          <textarea className="form-textarea" placeholder="Share your experience…"
            value={fbForm.comments} onChange={e => setFbForm(p => ({ ...p, comments:e.target.value }))} />
        </div>
        <button className="btn btn-primary btn-lg btn-full" onClick={handleFeedback} disabled={submittingFb || !fbForm.rating}>
          {submittingFb ? <><Spinner /> Submitting…</> : '⭐ Submit Feedback'}
        </button>
      </Modal>
    </div>
  );
}
