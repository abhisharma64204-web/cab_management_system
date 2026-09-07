import React, { useState } from 'react';

/* ── Loading Spinner ── */
export function Spinner({ dark }) {
  return <span className={`spinner${dark ? ' spinner-dark' : ''}`} />;
}

/* ── Status Badge ── */
const RIDE_STATUS_CLASS = {
  Pending:   'badge-yellow',
  Accepted:  'badge-blue',
  Ongoing:   'badge-orange',
  Completed: 'badge-green',
  Cancelled: 'badge-red',
};
const PAYMENT_STATUS_CLASS = {
  Pending:   'badge-yellow',
  Completed: 'badge-green',
  Failed:    'badge-red',
  Refunded:  'badge-purple',
};
const DRIVER_STATUS_CLASS = {
  Available: 'badge-green',
  Busy:      'badge-orange',
  Offline:   'badge-gray',
};
const VERIFY_STATUS_CLASS = {
  Verified: 'badge-green',
  Pending:  'badge-yellow',
  Rejected: 'badge-red',
};

export function RideStatusBadge({ status }) {
  return (
    <span className={`badge ${RIDE_STATUS_CLASS[status] || 'badge-gray'}`}>
      {status === 'Ongoing' && <span className="live-dot live-dot-red" style={{ marginRight: 3 }} />}
      {status}
    </span>
  );
}

export function PaymentStatusBadge({ status }) {
  return <span className={`badge ${PAYMENT_STATUS_CLASS[status] || 'badge-gray'}`}>{status}</span>;
}

export function DriverStatusBadge({ status }) {
  return (
    <span className={`badge ${DRIVER_STATUS_CLASS[status] || 'badge-gray'}`}>
      {status === 'Available' && <span className="live-dot live-dot-green" style={{ marginRight: 3 }} />}
      {status}
    </span>
  );
}

export function VerifyBadge({ status }) {
  return <span className={`badge ${VERIFY_STATUS_CLASS[status] || 'badge-gray'}`}>{status}</span>;
}

/* ── Avatar ── */
export function Avatar({ name, size = 'md', style = {} }) {
  const initials = (name || '??').split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className={`avatar avatar-${size}`} style={style}>{initials}</div>
  );
}

/* ── Star Rating (interactive) ── */
export function StarRating({ value, onChange, readOnly }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`star${(hover || value) >= i ? ' active' : ''}`}
          onClick={() => !readOnly && onChange && onChange(i)}
          onMouseEnter={() => !readOnly && setHover(i)}
          onMouseLeave={() => !readOnly && setHover(0)}
        >★</span>
      ))}
    </div>
  );
}

/* ── Ride Lifecycle Tracker ── */
const STEPS = [
  { key: 'Pending',   label: 'Pending',   icon: '⏳' },
  { key: 'Accepted',  label: 'Accepted',  icon: '✓'  },
  { key: 'Ongoing',   label: 'Ongoing',   icon: '🚗' },
  { key: 'Completed', label: 'Completed', icon: '🎉' },
];

export function RideTracker({ status }) {
  const idx = STEPS.findIndex(s => s.key === status);
  return (
    <div className="ride-tracker">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.key}>
          {i > 0 && <div className={`tracker-line${i <= idx ? ' done' : ''}`} />}
          <div className="tracker-step">
            <div className={`tracker-circle${i === idx ? ' active' : i < idx ? ' done' : ''}`}>
              {i < idx ? '✓' : s.icon}
            </div>
            <div className={`tracker-label${i === idx ? ' active' : i < idx ? ' done' : ''}`}>{s.label}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── Modal ── */
export function Modal({ isOpen, onClose, title, subtitle, children, width }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box animate-slide" style={width ? { maxWidth: width } : {}}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: title ? 16 : 0 }}>
          <div>
            {title    && <div className="modal-title">{title}</div>}
            {subtitle && <div className="modal-sub">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            style={{ background:'none', border:'none', fontSize:22, cursor:'pointer', color:'var(--s400)', marginLeft:12, lineHeight:1 }}
          >×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Empty State ── */
export function EmptyState({ icon = '📭', title, subtitle, action }) {
  return (
    <div className="empty-state">
      <div className="icon">{icon}</div>
      <h3>{title || 'Nothing here yet'}</h3>
      <p>{subtitle || ''}</p>
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  );
}

/* ── Stat Card ── */
export function StatCard({ icon, label, value, color = '#FFF7ED', iconBg }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg || color }}>{icon}</div>
      <div>
        <div className="stat-value">{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

/* ── Section separator ── */
export function SectionTitle({ children }) {
  return <div className="section-title">{children}</div>;
}

/* ── Page Header ── */
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header flex justify-between items-center" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

/* ── Format helpers exported from here ── */
export const formatDate = (s) => {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return s; }
};
export const formatDateTime = (s) => {
  if (!s) return '—';
  try { return new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch { return s; }
};
export const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
