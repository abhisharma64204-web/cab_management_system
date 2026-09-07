import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../../utils/api';
import socket from '../../utils/socket';
import { useAuth } from '../../context/AuthContext';
import {
  Spinner, RideStatusBadge, PaymentStatusBadge, Avatar,
  StatCard, EmptyState, RideTracker, formatDateTime, formatCurrency
} from '../../components/common';

const TABS = ['Active Rides', 'Ride History', 'My Profile'];

export default function DriverDashboard() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]             = useState('Active Rides');
  const [rides, setRides]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [driverInfo, setDriverInfo]       = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // Redirect if not a driver
  useEffect(() => {
    if (!user || user.role !== 'driver') { navigate('/driver-login'); }
  }, [user, navigate]);

  const fetchRides = useCallback(async () => {
    if (!user?.DRIVER_ID) return;
    setLoading(true);
    try {
      const { data } = await API.get(`/drivers/${user.DRIVER_ID}/rides`);
      setRides(data.data || []);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, [user]);

  const fetchDriverInfo = useCallback(async () => {
    if (!user?.DRIVER_ID) return;
    try {
      const { data } = await API.get(`/drivers/${user.DRIVER_ID}`);
      setDriverInfo(data.data);
    } catch {}
  }, [user]);

  useEffect(() => { fetchRides(); fetchDriverInfo(); }, [fetchRides, fetchDriverInfo]);

  // Real-time: refresh when a new ride is assigned
  useEffect(() => {
    const onNewRide = (ride) => {
      if (ride.DRIVER_ID === user?.DRIVER_ID) {
        toast.success(`New ride assigned! ${ride.PICKUP_LOC} → ${ride.DROP_LOC} 🚖`, { duration: 5000 });
        fetchRides();
      }
    };
    socket.on('rideAccepted', onNewRide);
    socket.on('rideCompleted', fetchRides);
    return () => { socket.off('rideAccepted', onNewRide); socket.off('rideCompleted', fetchRides); };
  }, [user, fetchRides]);

  const setActionLoad = (id, val) => setActionLoading(p => ({ ...p, [id]: val }));

  const handleStartRide = async (ride) => {
    setActionLoad(ride.RIDE_ID, 'start');
    try {
      await API.patch(`/rides/${ride.RIDE_ID}/start`);
      toast.success('Ride started! Drive safely 🚗');
      fetchRides(); fetchDriverInfo();
    } catch (err) { toast.error(err.message); }
    finally { setActionLoad(ride.RIDE_ID, null); }
  };

  const handleEndRide = async (ride) => {
    setActionLoad(ride.RIDE_ID, 'end');
    try {
      await API.patch(`/rides/${ride.RIDE_ID}/end`);
      toast.success('Ride completed! Great job 🎉');
      fetchRides(); fetchDriverInfo();
    } catch (err) { toast.error(err.message); }
    finally { setActionLoad(ride.RIDE_ID, null); }
  };

  const handleToggleAvailability = async () => {
    if (!driverInfo) return;
    const newStatus = driverInfo.AVAIL_STATUS === 'Available' ? 'Offline' : 'Available';
    setTogglingAvail(true);
    try {
      await API.patch(`/drivers/${user.DRIVER_ID}/availability`, { AVAIL_STATUS: newStatus });
      const updated = { ...driverInfo, AVAIL_STATUS: newStatus };
      setDriverInfo(updated);
      login({ ...user, AVAIL_STATUS: newStatus });
      toast.success(`Status set to ${newStatus}`);
    } catch (err) { toast.error(err.message); }
    finally { setTogglingAvail(false); }
  };

  if (!user || user.role !== 'driver') return null;

  const info      = driverInfo || user;
  const active    = rides.filter(r => ['Accepted', 'Ongoing'].includes(r.RIDE_STATUS));
  const history   = rides.filter(r => ['Completed', 'Cancelled'].includes(r.RIDE_STATUS));
  const totalEarnings = rides.filter(r => r.RIDE_STATUS === 'Completed').reduce((s, r) => s + Number(r.FARE || 0), 0);

  const StatusToggle = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: info.AVAIL_STATUS === 'Available' ? 'var(--green-light)' : 'var(--s100)', borderRadius: 'var(--radius-md)', border: `1px solid ${info.AVAIL_STATUS === 'Available' ? '#BBF7D0' : 'var(--s200)'}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: info.AVAIL_STATUS === 'Available' ? '#15803D' : 'var(--s600)' }}>
          {info.AVAIL_STATUS === 'Available' ? '🟢 You are Online' : '⚫ You are Offline'}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--s500)', marginTop: 2 }}>
          {info.AVAIL_STATUS === 'Available' ? 'Accepting new ride requests' : 'Not accepting rides right now'}
        </div>
      </div>
      <button
        className={`btn btn-sm ${info.AVAIL_STATUS === 'Available' ? 'btn-danger' : 'btn-success'}`}
        onClick={handleToggleAvailability}
        disabled={togglingAvail || info.AVAIL_STATUS === 'Busy'}>
        {togglingAvail ? <Spinner /> : info.AVAIL_STATUS === 'Available' ? 'Go Offline' : 'Go Online'}
      </button>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 62px)' }}>
      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0, background: '#fff', borderRight: '1px solid var(--s200)', padding: '20px 10px', position: 'sticky', top: 62, height: 'calc(100vh - 62px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Driver profile mini */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px 16px', borderBottom: '1px solid var(--s100)', marginBottom: 6 }}>
          <Avatar name={info.DRIVER_NAME} size="md" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--s900)' }}>{info.DRIVER_NAME}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--s500)' }}>{info.VEHICLE_TYPE} · {info.VEHICLE_NO}</div>
          </div>
        </div>

        {TABS.map(t => {
          const icons = { 'Active Rides': '🚖', 'Ride History': '📋', 'My Profile': '👤' };
          const cnt   = t === 'Active Rides' ? active.length : t === 'Ride History' ? history.length : null;
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              width: '100%', padding: '10px 12px', borderRadius: 'var(--radius)', border: 'none',
              background: tab === t ? 'var(--pri-light)' : 'transparent',
              color: tab === t ? 'var(--pri)' : 'var(--s600)',
              fontFamily: "'Outfit',sans-serif", fontSize: '0.88rem', fontWeight: tab === t ? 700 : 500,
              cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 9, transition: 'all .12s',
            }}>
              {icons[t]} {t}
              {cnt != null && <span style={{ marginLeft: 'auto', background: tab === t ? 'var(--pri)' : 'var(--s200)', color: tab === t ? '#fff' : 'var(--s600)', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 800, padding: '1px 7px' }}>{cnt}</span>}
            </button>
          );
        })}

        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <button className="btn btn-secondary btn-sm btn-full" onClick={() => { logout(); navigate('/'); toast.success('Logged out'); }}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: 24, background: 'var(--s50)', overflowY: 'auto' }}>

        {/* ── ACTIVE RIDES ── */}
        {tab === 'Active Rides' && (
          <div className="animate-slide">
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.5rem' }}>Active Rides</h2>
              <p style={{ color: 'var(--s500)', fontSize: '0.88rem' }}>Manage your current assigned rides</p>
            </div>

            {/* Availability toggle */}
            <div style={{ marginBottom: 20 }}><StatusToggle /></div>

            {/* Stats strip */}
            <div className="stats-grid" style={{ marginBottom: 20 }}>
              <StatCard icon="⭐" label="Avg Rating"    value={info.AVG_RATING > 0 ? `${info.AVG_RATING}★` : '—'}  iconBg="#FEF9C3" />
              <StatCard icon="🚖" label="Total Rides"   value={info.TOTAL_RIDES || 0}  iconBg="#DBEAFE" />
              <StatCard icon="💰" label="Total Earned"  value={formatCurrency(totalEarnings)} iconBg="#DCFCE7" />
              <StatCard icon="⚡" label="Active Now"    value={active.length}           iconBg="#FFF7ED" />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spinner dark /></div>
            ) : active.length === 0 ? (
              <div className="card">
                <EmptyState icon="😴" title="No active rides" subtitle={info.AVAIL_STATUS === 'Available' ? "You're online — waiting for ride requests" : "Go online to start receiving rides"} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {active.map(ride => (
                  <RideCard key={ride.RIDE_ID} ride={ride} onStart={handleStartRide} onEnd={handleEndRide} actionLoading={actionLoading} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RIDE HISTORY ── */}
        {tab === 'Ride History' && (
          <div className="animate-slide">
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.5rem' }}>Ride History</h2>
              <p style={{ color: 'var(--s500)', fontSize: '0.88rem' }}>{history.length} completed rides</p>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}><Spinner dark /></div>
            ) : history.length === 0 ? (
              <EmptyState icon="📋" title="No ride history yet" subtitle="Complete your first ride to see it here" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {history.map(ride => (
                  <div key={ride.RIDE_ID} className="card animate-fade" style={{ padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span style={{ fontWeight: 800 }}>{ride.RIDE_ID}</span>
                        <RideStatusBadge status={ride.RIDE_STATUS} />
                      </div>
                      <span style={{ fontWeight: 900, color: 'var(--green)', fontSize: '1.1rem' }}>{formatCurrency(ride.FARE)}</span>
                    </div>

                    <div className="grid-2" style={{ gap: 12 }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--s400)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Route</div>
                        <div style={{ fontSize: '0.88rem' }}>📍 <strong>{ride.PICKUP_LOC}</strong></div>
                        <div style={{ fontSize: '0.88rem' }}>🏁 <strong>{ride.DROP_LOC}</strong></div>
                        <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                          <span className="badge badge-gray">{ride.RIDE_TYPE}</span>
                          <span className="badge badge-gray">{ride.DISTANCE} km</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--s400)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Customer</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar name={ride.CUST_NAME} size="sm" />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{ride.CUST_NAME}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--s500)' }}>{ride.CUST_PHONE}</div>
                          </div>
                        </div>
                        {ride.RATING && (
                          <div style={{ marginTop: 8 }}>
                            <span className="badge badge-yellow">⭐ {ride.RATING}/5</span>
                            {ride.COMMENTS && <div style={{ fontSize: '0.78rem', color: 'var(--s500)', marginTop: 4, fontStyle: 'italic' }}>"{ride.COMMENTS}"</div>}
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--s400)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Timeline</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--s600)' }}>
                          {ride.START_TIME && <div>🚀 {formatDateTime(ride.START_TIME)}</div>}
                          {ride.END_TIME   && <div>🏁 {formatDateTime(ride.END_TIME)}</div>}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--s400)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Payment</div>
                        {ride.PAYMENT_STATUS ? <PaymentStatusBadge status={ride.PAYMENT_STATUS} /> : <span className="badge badge-yellow">Pending</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY PROFILE ── */}
        {tab === 'My Profile' && (
          <div className="animate-slide">
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.5rem' }}>My Profile</h2>
              <p style={{ color: 'var(--s500)', fontSize: '0.88rem' }}>Your account details</p>
            </div>

            <div className="grid-2" style={{ gap: 18 }}>
              {/* Profile card */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <Avatar name={info.DRIVER_NAME} size="lg" style={{ width: 64, height: 64, fontSize: 22, borderRadius: 'var(--radius-md)' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{info.DRIVER_NAME}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--s500)', marginTop: 2 }}>{info.DRIVER_ID}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <span className={`badge ${info.VERIFY_STATUS === 'Verified' ? 'badge-green' : 'badge-yellow'}`}>{info.VERIFY_STATUS}</span>
                      <span className={`badge ${info.AVAIL_STATUS === 'Available' ? 'badge-green' : 'badge-gray'}`}>{info.AVAIL_STATUS}</span>
                    </div>
                  </div>
                </div>

                <div className="section-title">Personal Details</div>
                {[
                  ['📞 Phone',     info.DRIVER_PHONE],
                  ['🪪 License',   info.LICENSE_NO],
                  ['🚗 Vehicle',   `${info.VEHICLE_TYPE} · ${info.VEHICLE_NO}`],
                  ['💼 Experience',`${info.EXPERIENCE} years`],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--s100)', fontSize: '0.88rem' }}>
                    <span style={{ color: 'var(--s500)' }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Stats card */}
              <div className="card">
                <div className="card-title">📊 Performance Stats</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--s100)' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--yellow)' }}>{info.AVG_RATING > 0 ? info.AVG_RATING : '—'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--s500)', marginTop: 2 }}>Average Rating</div>
                    {info.AVG_RATING > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div className="progress-bar"><div className="progress-fill" style={{ width: `${(info.AVG_RATING / 5) * 100}%` }} /></div>
                      </div>
                    )}
                  </div>
                  {[
                    ['Total Rides Completed', info.TOTAL_RIDES || 0, 'var(--blue)'],
                    ['Total Earnings',        formatCurrency(totalEarnings), 'var(--green)'],
                    ['Active Rides Now',      active.length, 'var(--pri)'],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--s100)' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--s600)' }}>{label}</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Availability toggle */}
            <div style={{ marginTop: 18 }}><StatusToggle /></div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── RideCard sub-component ── */
function RideCard({ ride, onStart, onEnd, actionLoading }) {
  const isLoading = actionLoading[ride.RIDE_ID];
  return (
    <div className="card animate-fade" style={{ padding: 20, border: ride.RIDE_STATUS === 'Ongoing' ? '2px solid var(--pri)' : '1px solid var(--s200)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{ride.RIDE_ID}</span>
          <RideStatusBadge status={ride.RIDE_STATUS} />
          {ride.RIDE_STATUS === 'Ongoing' && (
            <span className="live-badge"><span className="live-dot live-dot-red" /> LIVE</span>
          )}
        </div>
        <span style={{ fontWeight: 900, color: 'var(--pri)', fontSize: '1.3rem' }}>{formatCurrency(ride.FARE)}</span>
      </div>

      <RideTracker status={ride.RIDE_STATUS} />

      <div className="grid-2" style={{ gap: 14, marginTop: 14, marginBottom: 14 }}>
        {/* Route */}
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--s400)', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' }}>Route</div>
          <div style={{ fontSize: '0.9rem', marginBottom: 4 }}>📍 <strong>{ride.PICKUP_LOC}</strong></div>
          <div style={{ fontSize: '0.9rem' }}>🏁 <strong>{ride.DROP_LOC}</strong></div>
          <div style={{ marginTop: 6, display: 'flex', gap: 7 }}>
            <span className="badge badge-gray">{ride.RIDE_TYPE}</span>
            <span className="badge badge-gray">{ride.DISTANCE} km</span>
          </div>
        </div>
        {/* Customer */}
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--s400)', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' }}>Customer</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={ride.CUST_NAME} size="sm" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ride.CUST_NAME}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--s500)' }}>📞 {ride.CUST_PHONE}</div>
            </div>
          </div>
        </div>
        {/* Timeline */}
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--s400)', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' }}>Timeline</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--s600)' }}>
            <div>🕐 Requested: {formatDateTime(ride.REQUEST_TIME)}</div>
            {ride.START_TIME && <div>🚀 Started: {formatDateTime(ride.START_TIME)}</div>}
          </div>
        </div>
        {/* Fare breakdown */}
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--s400)', fontWeight: 700, marginBottom: 5, textTransform: 'uppercase' }}>Fare</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--pri)' }}>{formatCurrency(ride.FARE)}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--s500)' }}>{ride.DISTANCE} km × ₹/km</div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--s100)', paddingTop: 14 }}>
        {ride.RIDE_STATUS === 'Accepted' && (
          <button className="btn btn-success" onClick={() => onStart(ride)} disabled={!!isLoading} style={{ flex: 1 }}>
            {isLoading === 'start' ? <><Spinner /> Starting…</> : '▶ Start Ride'}
          </button>
        )}
        {ride.RIDE_STATUS === 'Ongoing' && (
          <button className="btn btn-primary" onClick={() => onEnd(ride)} disabled={!!isLoading} style={{ flex: 1 }}>
            {isLoading === 'end' ? <><Spinner /> Ending…</> : '🏁 End Ride'}
          </button>
        )}
        <div style={{ fontSize: '0.82rem', color: 'var(--s500)', display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
          {ride.RIDE_STATUS === 'Accepted' ? 'Tap Start when you pick up the customer' : ride.RIDE_STATUS === 'Ongoing' ? 'Tap End when you reach the destination' : ''}
        </div>
      </div>
    </div>
  );
}
