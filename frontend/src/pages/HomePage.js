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
      {/* ── Hero with Video Background (Top Half) ── */}
      <section style={{
        position: 'relative',
        padding: '90px 24px 70px',
        textAlign: 'center',
        borderBottom: '1px solid var(--s200)',
        overflow: 'hidden',
        color: '#fff',
      }}>
        {/* Background Video */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          zIndex: 0,
        }}>
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              filter: 'none',
            }}
          >
            <source src={`${process.env.PUBLIC_URL}/cab_go.mp4`} type="video/mp4" />
          </video>
          {/* Very light gradient so video is 100% visible and vivid */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.38) 100%)',
          }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' }}>
          {/* Live badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(6px)',
            color: '#fff',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: 22,
            border: '1px solid rgba(255,255,255,0.25)'
          }}>
            <span className="live-dot live-dot-green" />
            Rides are live and available now
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem,5vw,3.6rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            marginBottom: 16,
            color: '#ffffff',
            textShadow: '0 2px 14px rgba(0,0,0,0.8), 0 4px 28px rgba(0,0,0,0.6)',
          }}>
            Your Ride,<br />
            <span style={{ color: 'var(--pri)', textShadow: '0 2px 14px rgba(0,0,0,0.7)' }}>Your Way.</span>
          </h1>
          <p style={{
            fontSize: '1.15rem',
            color: '#ffffff',
            fontWeight: 500,
            marginBottom: 34,
            lineHeight: 1.65,
            maxWidth: 540,
            margin: '0 auto 34px',
            textShadow: '0 2px 8px rgba(0,0,0,0.85)',
          }}>
            Book in seconds. Track live. Pay your way.<br />
            Professional, verified drivers — every single time.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
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
                  <button className="btn btn-outline btn-xl" style={{ borderColor: 'rgba(255,255,255,0.6)', color: '#fff', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(6px)' }}>Login</button>
                </Link>
              </>
            )}
            <Link to="/driver-register">
              <button className="btn btn-secondary btn-xl" style={{ background: '#fff', color: 'var(--s800)' }}>🚗 Drive with Us</button>
            </Link>
          </div>

          {/* Stats row with glass effect */}
          <div className="stats-row" style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(6px)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 28px',
            maxWidth: 620,
            margin: '36px auto 0',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--pri)', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>{s.value}</div>
                <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '60px 24px', background: 'var(--s50)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--s900)' }}>Why CabGo?</h2>
            <p style={{ color: 'var(--s500)', marginTop: 8 }}>Everything you need for a seamless ride experience</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 18 }}>
            {FEATURES.map(([icon, title, desc], i) => (
              <div key={i} className="card" style={{ cursor: 'default', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='var(--shadow-lg)'; e.currentTarget.style.borderColor='var(--pri-border)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderColor=''; }}>
                <div style={{ width: 50, height: 50, borderRadius: 'var(--radius)', background: 'var(--pri-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 14 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--s800)', marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: '0.86rem', color: 'var(--s500)', lineHeight: 1.55 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ padding: '60px 24px', background: '#fff', borderTop: '1px solid var(--s200)', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: 12, color: 'var(--s900)' }}>Ready to ride?</h2>
          <p style={{ color: 'var(--s500)', marginBottom: 28, fontSize: '1.05rem' }}>Join thousands of happy riders who travel with CabGo daily.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register"><button className="btn btn-primary btn-lg">Create Free Account</button></Link>
            <Link to="/book"><button className="btn btn-secondary btn-lg">Book Now →</button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
