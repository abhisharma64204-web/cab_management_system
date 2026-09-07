import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  ['⚡', 'Instant Booking',     'Book your ride in under 30 seconds with our streamlined flow.'],
  ['📍', 'Live Tracking',       'Track your driver in real-time from pickup to drop.'],
  ['💳', 'Multiple Payments',   'Cash, Card, UPI, or Wallet — your choice, every time.'],
  ['⭐', 'Verified Drivers',    'Every driver is background-checked and admin-approved.'],
  ['💰', 'Transparent Fares',   'Know your fare before booking. Zero hidden charges.'],
  ['🛡️', 'Safe & Secure',       '24/7 support and emergency assistance on every ride.'],
];

const STATS = [
  { value: '500+',  label: 'Total Rides' },
  { value: '50+',   label: 'Verified Drivers' },
  { value: '300+',  label: 'Happy Customers' },
  { value: '4.8★',  label: 'Platform Rating' },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div>
      {/* ── Hero ── */}
      <section style={{
        background: '#fff',
        padding: '80px 24px 60px',
        textAlign: 'center',
        borderBottom: '1px solid var(--s200)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position:'absolute', top:-80, left:-80, width:320, height:320, borderRadius:'50%', background:'rgba(249,115,22,.07)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, right:-60, width:250, height:250, borderRadius:'50%', background:'rgba(249,115,22,.05)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1, maxWidth:680, margin:'0 auto' }}>
          {/* Live badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'var(--pri-light)', color:'var(--pri)', padding:'5px 14px', borderRadius:'var(--radius-full)', fontSize:'0.8rem', fontWeight:700, marginBottom:22, border:'1px solid var(--pri-border)' }}>
            <span className="live-dot live-dot-green" />
            Rides are live and available now
          </div>

          <h1 style={{ fontSize:'clamp(2.2rem,5vw,3.2rem)', fontWeight:900, lineHeight:1.1, marginBottom:16, color:'var(--s900)' }}>
            Your Ride,<br />
            <span style={{ color:'var(--pri)' }}>Your Way.</span>
          </h1>
          <p style={{ fontSize:'1.1rem', color:'var(--s500)', marginBottom:34, lineHeight:1.65, maxWidth:500, margin:'0 auto 34px' }}>
            Book in seconds. Track live. Pay your way.<br />
            Professional, verified drivers — every single time.
          </p>

          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            {user ? (
              <Link to="/book">
                <button className="btn btn-primary btn-xl">🚖 Book a Ride</button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <button className="btn btn-primary btn-xl">🚀 Get Started</button>
                </Link>
                <Link to="/login">
                  <button className="btn btn-outline btn-xl">Login</button>
                </Link>
              </>
            )}
            <Link to="/driver-register">
              <button className="btn btn-secondary btn-xl">🚗 Drive with Us</button>
            </Link>
          </div>

          {/* Stats row */}
          <div style={{ display:'flex', gap:48, justifyContent:'center', marginTop:56, paddingTop:40, borderTop:'1px solid var(--s100)', flexWrap:'wrap' }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'2rem', fontWeight:900, color:'var(--pri)' }}>{s.value}</div>
                <div style={{ fontSize:'0.82rem', color:'var(--s500)', fontWeight:500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding:'60px 24px', background:'var(--s50)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <h2 style={{ fontSize:'1.9rem', fontWeight:800, color:'var(--s900)' }}>Why CabGo?</h2>
            <p style={{ color:'var(--s500)', marginTop:8 }}>Everything you need for a seamless ride experience</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:18 }}>
            {FEATURES.map(([icon, title, desc], i) => (
              <div key={i} className="card" style={{ cursor:'default', transition:'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='var(--shadow-lg)'; e.currentTarget.style.borderColor='var(--pri-border)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderColor=''; }}>
                <div style={{ width:50, height:50, borderRadius:'var(--radius)', background:'var(--pri-light)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:14 }}>{icon}</div>
                <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--s800)', marginBottom:6 }}>{title}</div>
                <div style={{ fontSize:'0.85rem', color:'var(--s500)', lineHeight:1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Strip ── */}
      <section style={{ background:'var(--pri)', padding:'50px 24px', textAlign:'center' }}>
        <h2 style={{ fontSize:'1.8rem', fontWeight:800, color:'#fff', marginBottom:12 }}>Ready to ride?</h2>
        <p style={{ color:'rgba(255,255,255,.85)', marginBottom:28, fontSize:'1rem' }}>Join thousands of happy riders across the city.</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/register"><button className="btn btn-xl" style={{ background:'#fff', color:'var(--pri)', fontWeight:800 }}>Create Free Account</button></Link>
          <Link to="/book"><button className="btn btn-xl" style={{ background:'rgba(255,255,255,.15)', color:'#fff', border:'2px solid rgba(255,255,255,.5)' }}>Book a Ride</button></Link>
        </div>
      </section>
    </div>
  );
}
