import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import API from '../../utils/api';
import socket from '../../utils/socket';
import {
  Spinner, RideStatusBadge, DriverStatusBadge, VerifyBadge,
  PaymentStatusBadge, Avatar, StatCard, EmptyState,
  formatDateTime, formatDate, formatCurrency
} from '../../components/common';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const TABS = ['Dashboard','Rides','Drivers','Customers','Payments','Feedback','Reports'];
const PIE_COLORS = ['#F97316','#3B82F6','#22C55E','#EAB308'];

export default function AdminDashboard() {
  const [tab,      setTab]      = useState('Dashboard');
  const [stats,    setStats]    = useState({});
  const [rides,    setRides]    = useState([]);
  const [drivers,  setDrivers]  = useState([]);
  const [customers,setCustomers]= useState([]);
  const [payments, setPayments] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [daily,    setDaily]    = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [ratings,  setRatings]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [activeRides, setActiveRides] = useState([]);

  const load = useCallback(async (t) => {
    setLoading(true);
    try {
      if (t === 'Dashboard') {
        const [s, ar] = await Promise.all([API.get('/reports/dashboard'), API.get('/rides/active')]);
        setStats(s.data.data || {});
        setActiveRides(ar.data.data || []);
      } else if (t === 'Rides')     { const r = await API.get('/rides');     setRides(r.data.data || []); }
      else if (t === 'Drivers')     { const r = await API.get('/drivers');   setDrivers(r.data.data || []); }
      else if (t === 'Customers')   { const r = await API.get('/customers'); setCustomers(r.data.data || []); }
      else if (t === 'Payments')    { const r = await API.get('/payments');  setPayments(r.data.data || []); }
      else if (t === 'Feedback')    { const r = await API.get('/feedback');  setFeedback(r.data.data || []); }
      else if (t === 'Reports') {
        const [d, e, rt] = await Promise.all([API.get('/reports/daily-trips?days=7'), API.get('/drivers/earnings'), API.get('/feedback/ratings')]);
        setDaily(d.data.data || []);
        setEarnings(e.data.data || []);
        setRatings(rt.data.data || []);
      }
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(tab); }, [tab, load]);

  // Real-time
  useEffect(() => {
    const refresh = () => { if (tab === 'Dashboard') load('Dashboard'); if (tab === 'Rides') load('Rides'); };
    socket.on('rideAccepted',  refresh);
    socket.on('rideStarted',   refresh);
    socket.on('rideCompleted', refresh);
    socket.on('paymentDone',   refresh);
    return () => { socket.off('rideAccepted', refresh); socket.off('rideStarted', refresh); socket.off('rideCompleted', refresh); socket.off('paymentDone', refresh); };
  }, [tab, load]);

  const verifyDriver = async (id, status) => {
    try {
      await API.patch(`/drivers/${id}/verify`, { VERIFY_STATUS: status });
      toast.success(`Driver ${status}`);
      load('Drivers');
    } catch (err) { toast.error(err.message); }
  };

  const toggleAvail = async (id, current) => {
    const next = current === 'Available' ? 'Offline' : 'Available';
    try {
      await API.patch(`/drivers/${id}/availability`, { AVAIL_STATUS: next });
      toast.success(`Status → ${next}`);
      load('Drivers');
    } catch (err) { toast.error(err.message); }
  };

  const startRide = async (id) => {
    try { await API.patch(`/rides/${id}/start`); toast.success('Ride started'); load('Rides'); }
    catch (err) { toast.error(err.message); }
  };

  const endRide = async (id) => {
    try { await API.patch(`/rides/${id}/end`); toast.success('Ride ended'); load('Rides'); }
    catch (err) { toast.error(err.message); }
  };

  const Sidebar = () => (
    <div style={{ width:210, flexShrink:0, background:'#fff', borderRight:'1px solid var(--s200)', padding:'16px 10px', position:'sticky', top:62, height:'calc(100vh - 62px)', overflowY:'auto' }}>
      <div style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--s400)', textTransform:'uppercase', letterSpacing:'.1em', padding:'2px 10px 8px' }}>Admin Panel</div>
      {TABS.map(t => {
        const icons = { Dashboard:'📊', Rides:'🚖', Drivers:'🚗', Customers:'👥', Payments:'💳', Feedback:'⭐', Reports:'📈' };
        return (
          <button key={t}
            onClick={() => setTab(t)}
            style={{
              width:'100%', padding:'9px 12px', borderRadius:'var(--radius)', border:'none',
              background: tab===t ? 'var(--pri-light)' : 'transparent',
              color: tab===t ? 'var(--pri)' : 'var(--s600)',
              fontFamily:"'Outfit',sans-serif", fontSize:'0.88rem', fontWeight: tab===t ? 700 : 500,
              cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:9, marginBottom:2,
              transition:'all .12s',
            }}>
            {icons[t]} {t}
          </button>
        );
      })}
      <div style={{ marginTop:16, padding:'12px 10px', background:'var(--s50)', borderRadius:'var(--radius)', fontSize:'0.78rem', color:'var(--s500)' }}>
        <div style={{ fontWeight:700, marginBottom:4 }}>🔴 Active Rides</div>
        <div style={{ fontSize:'1.3rem', fontWeight:900, color:'var(--pri)' }}>{activeRides.length}</div>
      </div>
    </div>
  );

  return (
    <div style={{ display:'flex' }}>
      <Sidebar />
      <div style={{ flex:1, padding:'24px', overflowY:'auto', minHeight:'calc(100vh - 62px)', background:'var(--s50)' }}>

        {/* ── DASHBOARD ── */}
        {tab === 'Dashboard' && (
          <div className="animate-slide">
            <div style={{ marginBottom:22 }}>
              <h2 style={{ fontWeight:800, fontSize:'1.6rem' }}>Dashboard Overview</h2>
              <p style={{ color:'var(--s500)', fontSize:'0.88rem' }}>Live metrics & system status</p>
            </div>

            <div className="stats-grid mb-20" style={{ marginBottom:20 }}>
              <StatCard icon="👥" label="Total Customers"    value={stats.total_customers}   iconBg="#DBEAFE" />
              <StatCard icon="🚗" label="Verified Drivers"   value={stats.verified_drivers}  iconBg="#DCFCE7" />
              <StatCard icon="🚖" label="Total Rides"        value={stats.total_rides}       iconBg="#FFF7ED" />
              <StatCard icon="✅" label="Completed Rides"    value={stats.completed_rides}   iconBg="#DCFCE7" />
              <StatCard icon="⚡" label="Active Rides"       value={stats.active_rides}      iconBg="#FEE2E2" />
              <StatCard icon="💰" label="Today's Revenue"    value={formatCurrency(stats.today_revenue||0)} iconBg="#FFF7ED" />
              <StatCard icon="💳" label="Total Revenue"      value={formatCurrency(stats.total_revenue||0)} iconBg="#F3E8FF" />
              <StatCard icon="⭐" label="Platform Rating"    value={stats.platform_rating ? `${stats.platform_rating}★` : '—'} iconBg="#FEF9C3" />
            </div>

            {/* Live Active Rides */}
            <div className="card mb-20" style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <div className="card-title" style={{ margin:0 }}>
                  🔴 Live Active Rides
                  <span className="live-badge" style={{ marginLeft:8 }}>
                    <span className="live-dot live-dot-red" />{activeRides.length} LIVE
                  </span>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => load('Dashboard')}>↻ Refresh</button>
              </div>

              {activeRides.length === 0 ? (
                <EmptyState icon="🚖" title="No active rides" subtitle="All quiet right now" />
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>{['Ride ID','Customer','Driver','Vehicle','Route','Status','Start Time'].map(h => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {activeRides.map(r => (
                        <tr key={r.RIDE_ID}>
                          <td><strong>{r.RIDE_ID}</strong></td>
                          <td><div style={{ display:'flex', alignItems:'center', gap:8 }}><Avatar name={r.CUST_NAME} size="sm" />{r.CUST_NAME}</div></td>
                          <td><div style={{ display:'flex', alignItems:'center', gap:8 }}><Avatar name={r.DRIVER_NAME} size="sm" />{r.DRIVER_NAME}</div></td>
                          <td>{r.VEHICLE_NO}</td>
                          <td>{r.PICKUP_LOC} → {r.DROP_LOC}</td>
                          <td><RideStatusBadge status={r.RIDE_STATUS} /></td>
                          <td>{formatDateTime(r.START_TIME)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick stats strip */}
            <div className="grid-2">
              <div className="card">
                <div className="card-title">📊 Pending Verifications</div>
                <div style={{ fontSize:'2.5rem', fontWeight:900, color:'var(--yellow)', marginBottom:8 }}>{stats.pending_drivers || 0}</div>
                <div style={{ fontSize:'0.85rem', color:'var(--s500)' }}>Drivers awaiting admin approval</div>
                <button className="btn btn-secondary btn-sm" style={{ marginTop:12 }} onClick={() => setTab('Drivers')}>View Drivers →</button>
              </div>
              <div className="card">
                <div className="card-title">🚖 Today's Rides</div>
                <div style={{ fontSize:'2.5rem', fontWeight:900, color:'var(--pri)', marginBottom:8 }}>{stats.today_rides || 0}</div>
                <div style={{ fontSize:'0.85rem', color:'var(--s500)' }}>Rides booked today</div>
                <button className="btn btn-secondary btn-sm" style={{ marginTop:12 }} onClick={() => setTab('Reports')}>View Reports →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── RIDES ── */}
        {tab === 'Rides' && (
          <div className="animate-slide">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div><h2 style={{ fontWeight:800 }}>All Rides</h2><p style={{ color:'var(--s500)', fontSize:'0.88rem' }}>{rides.length} total</p></div>
              <button className="btn btn-secondary btn-sm" onClick={() => load('Rides')}>↻ Refresh</button>
            </div>
            <div className="search-bar mb-20" style={{ marginBottom:14, maxWidth:380 }}>
              <span>🔍</span><input placeholder="Search ride ID, customer…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr>{['Ride ID','Customer','Driver','Route','Type','Fare','Status','Requested','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {rides.filter(r => !search || r.RIDE_ID.toLowerCase().includes(search.toLowerCase()) || r.CUST_NAME?.toLowerCase().includes(search.toLowerCase())).map(r => (
                    <tr key={r.RIDE_ID}>
                      <td><strong>{r.RIDE_ID}</strong></td>
                      <td>{r.CUST_NAME}</td>
                      <td>{r.DRIVER_NAME || '—'}</td>
                      <td style={{ maxWidth:180 }}><div style={{ fontSize:'0.82rem' }}>{r.PICKUP_LOC} → {r.DROP_LOC}</div></td>
                      <td><span className="badge badge-gray">{r.RIDE_TYPE}</span></td>
                      <td><strong style={{ color:'var(--pri)' }}>{formatCurrency(r.FARE)}</strong></td>
                      <td><RideStatusBadge status={r.RIDE_STATUS} /></td>
                      <td style={{ fontSize:'0.82rem' }}>{formatDateTime(r.REQUEST_TIME)}</td>
                      <td>
                        <div style={{ display:'flex', gap:5 }}>
                          {r.RIDE_STATUS === 'Accepted'  && <button className="btn btn-success btn-sm" onClick={() => startRide(r.RIDE_ID)}>▶ Start</button>}
                          {r.RIDE_STATUS === 'Ongoing'   && <button className="btn btn-primary btn-sm" onClick={() => endRide(r.RIDE_ID)}>🏁 End</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DRIVERS ── */}
        {tab === 'Drivers' && (
          <div className="animate-slide">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div><h2 style={{ fontWeight:800 }}>Drivers</h2><p style={{ color:'var(--s500)', fontSize:'0.88rem' }}>{drivers.length} registered</p></div>
              <button className="btn btn-secondary btn-sm" onClick={() => load('Drivers')}>↻ Refresh</button>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr>{['Driver','Phone','Vehicle','License','Exp','Status','Verify','Rating','Actions'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {drivers.map(d => (
                    <tr key={d.DRIVER_ID}>
                      <td><div style={{ display:'flex', alignItems:'center', gap:8 }}><Avatar name={d.DRIVER_NAME} size="sm" /><div><div style={{ fontWeight:600 }}>{d.DRIVER_NAME}</div><div style={{ fontSize:'0.76rem', color:'var(--s400)' }}>{d.DRIVER_ID}</div></div></div></td>
                      <td>{d.DRIVER_PHONE}</td>
                      <td><div style={{ fontSize:'0.85rem' }}>{d.VEHICLE_TYPE}<br/><span style={{ color:'var(--s400)', fontSize:'0.78rem' }}>{d.VEHICLE_NO}</span></div></td>
                      <td style={{ fontSize:'0.82rem' }}>{d.LICENSE_NO}</td>
                      <td>{d.EXPERIENCE}y</td>
                      <td><DriverStatusBadge status={d.AVAIL_STATUS} /></td>
                      <td><VerifyBadge status={d.VERIFY_STATUS} /></td>
                      <td>{d.AVG_RATING > 0 ? `⭐ ${d.AVG_RATING}` : '—'}</td>
                      <td>
                        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                          {d.VERIFY_STATUS === 'Pending' && (
                            <>
                              <button className="btn btn-success btn-sm" onClick={() => verifyDriver(d.DRIVER_ID,'Verified')}>✓ Verify</button>
                              <button className="btn btn-danger  btn-sm" onClick={() => verifyDriver(d.DRIVER_ID,'Rejected')}>✗ Reject</button>
                            </>
                          )}
                          {d.VERIFY_STATUS === 'Verified' && (
                            <button className="btn btn-secondary btn-sm" onClick={() => toggleAvail(d.DRIVER_ID, d.AVAIL_STATUS)}>
                              {d.AVAIL_STATUS === 'Available' ? '🔴 Set Offline' : '🟢 Set Available'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CUSTOMERS ── */}
        {tab === 'Customers' && (
          <div className="animate-slide">
            <div style={{ marginBottom:18 }}><h2 style={{ fontWeight:800 }}>Customers</h2><p style={{ color:'var(--s500)', fontSize:'0.88rem' }}>{customers.length} registered</p></div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr>{['Customer','Phone','Email','City','Registered'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.CUST_ID}>
                      <td><div style={{ display:'flex', alignItems:'center', gap:8 }}><Avatar name={c.CUST_NAME} size="sm" /><div><div style={{ fontWeight:600 }}>{c.CUST_NAME}</div><div style={{ fontSize:'0.76rem', color:'var(--s400)' }}>{c.CUST_ID}</div></div></div></td>
                      <td>{c.CUST_PHONE}</td>
                      <td>{c.CUST_EMAIL}</td>
                      <td>{c.CUST_CITY}</td>
                      <td style={{ fontSize:'0.85rem' }}>{formatDate(c.REG_DATE)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PAYMENTS ── */}
        {tab === 'Payments' && (
          <div className="animate-slide">
            <div style={{ marginBottom:18 }}><h2 style={{ fontWeight:800 }}>Payments</h2><p style={{ color:'var(--s500)', fontSize:'0.88rem' }}>{payments.length} transactions</p></div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr>{['Payment ID','Ride','Customer','Amount','Method','Status','Date'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.PAYMENT_ID}>
                      <td><strong>{p.PAYMENT_ID}</strong></td>
                      <td>{p.RIDE_ID}</td>
                      <td>{p.CUST_NAME}</td>
                      <td><strong style={{ color:'var(--green)' }}>{formatCurrency(p.PAYMENT_AMOUNT)}</strong></td>
                      <td>{p.PAYMENT_METHOD}</td>
                      <td><PaymentStatusBadge status={p.PAYMENT_STATUS} /></td>
                      <td style={{ fontSize:'0.82rem' }}>{formatDateTime(p.PAYMENT_DATE)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── FEEDBACK ── */}
        {tab === 'Feedback' && (
          <div className="animate-slide">
            <div style={{ marginBottom:18 }}><h2 style={{ fontWeight:800 }}>Customer Feedback</h2></div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {feedback.map(f => (
                <div key={f.FEEDBACK_ID} className="card" style={{ padding:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <Avatar name={f.CUST_NAME} size="sm" />
                      <div><div style={{ fontWeight:700 }}>{f.CUST_NAME}</div><div style={{ fontSize:'0.78rem', color:'var(--s500)' }}>Ride {f.RIDE_ID} · Driver: {f.DRIVER_NAME}</div></div>
                    </div>
                    <span className="badge badge-yellow">{'★'.repeat(f.RATING)} {f.RATING}/5</span>
                  </div>
                  {f.COMMENTS && <div style={{ fontSize:'0.88rem', color:'var(--s600)', background:'var(--s50)', padding:'10px 14px', borderRadius:'var(--radius)', borderLeft:'3px solid var(--pri)' }}>"{f.COMMENTS}"</div>}
                  <div style={{ fontSize:'0.78rem', color:'var(--s400)', marginTop:8 }}>{formatDateTime(f.FEEDBACK_DATE)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── REPORTS ── */}
        {tab === 'Reports' && (
          <div className="animate-slide">
            <div style={{ marginBottom:22 }}><h2 style={{ fontWeight:800 }}>Reports & Analytics</h2></div>

            {/* Daily trips chart */}
            <div className="card mb-20" style={{ marginBottom:20 }}>
              <div className="card-title">📅 Daily Trips (Last 7 days)</div>
              {daily.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[...daily].reverse()} margin={{ top:5, right:10, left:-10, bottom:0 }}>
                    <XAxis dataKey="trip_date" tickFormatter={d => d?.slice(5)} tick={{ fontSize:11 }} />
                    <YAxis tick={{ fontSize:11 }} />
                    <Tooltip formatter={(v,n) => [v, n==='total_rides'?'Total':n==='completed'?'Completed':'Revenue']} />
                    <Bar dataKey="total_rides" fill="#F97316" radius={[4,4,0,0]} name="total_rides" />
                    <Bar dataKey="completed"   fill="#22C55E" radius={[4,4,0,0]} name="completed" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div style={{ color:'var(--s400)', textAlign:'center', padding:30 }}>No data</div>}
            </div>

            {/* Driver earnings */}
            <div className="card mb-20" style={{ marginBottom:20 }}>
              <div className="card-title">💰 Driver Earnings Report</div>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr>{['Driver','Vehicle','Total Rides','Earnings','Avg Fare','Rating'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {earnings.map(d => (
                      <tr key={d.DRIVER_ID}>
                        <td><div style={{ display:'flex', alignItems:'center', gap:8 }}><Avatar name={d.DRIVER_NAME} size="sm" />{d.DRIVER_NAME}</div></td>
                        <td>{d.VEHICLE_TYPE}</td>
                        <td><strong>{d.completed_rides}</strong></td>
                        <td><strong style={{ color:'var(--green)' }}>{formatCurrency(d.total_earnings)}</strong></td>
                        <td>{formatCurrency(d.avg_fare)}</td>
                        <td>{d.AVG_RATING > 0 ? `⭐ ${d.AVG_RATING}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Driver ratings */}
            <div className="card">
              <div className="card-title">⭐ Driver Rating Report</div>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr>{['Driver','Avg Rating','Reviews','5★','4★','≤3★'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {ratings.map(d => (
                      <tr key={d.DRIVER_ID}>
                        <td><div style={{ display:'flex', alignItems:'center', gap:8 }}><Avatar name={d.DRIVER_NAME} size="sm" />{d.DRIVER_NAME}</div></td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ fontWeight:800, color:'var(--yellow)' }}>{d.AVG_RATING || '—'}</div>
                            {d.AVG_RATING > 0 && (
                              <div style={{ flex:1, maxWidth:80 }}>
                                <div className="progress-bar"><div className="progress-fill" style={{ width:`${(d.AVG_RATING/5)*100}%` }} /></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{d.total_reviews}</td>
                        <td style={{ color:'var(--green)',  fontWeight:700 }}>{d.five_star}</td>
                        <td style={{ color:'var(--yellow)', fontWeight:700 }}>{d.four_star}</td>
                        <td style={{ color:'var(--red)',    fontWeight:700 }}>{d.three_or_less}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
