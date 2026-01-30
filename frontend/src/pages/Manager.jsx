// frontend/src/pages/Manager.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import PosturePanel from '../components/PosturePanel.jsx';

export default function Manager({ user }) {
  const [overview, setOverview] = useState(null);
  const [audit, setAudit] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // ✅ forces PosturePanel to reload without touching its internals
  const [postureKey, setPostureKey] = useState(0);

  async function loadRoom() {
    setLoading(true);
    setErr('');
    try {
      const [ov, au, no] = await Promise.all([
        api.managerOverview(),
        api.managerAudit(200),
        api.managerNotifications(),
      ]);
      setOverview(ov || null);
      setAudit(au || []);
      setNotifications(no || []);
    } catch (e) {
      setErr(e?.message || 'Failed to load manager room data');
    } finally {
      setLoading(false);
    }
  }

  function refreshPosture() {
    setPostureKey((k) => k + 1);
  }

  useEffect(() => {
    loadRoom();
    // load posture on first entry
    refreshPosture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grid">
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h2>Manager Room</h2>
        <p style={{ marginTop: 6 }}>
          Full visibility of cybersecurity gadgets + platform activity.
        </p>

        <div style={{ height: 10 }} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={loadRoom} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh room'}
          </button>

          <button onClick={refreshPosture} style={{ width: 'auto', minWidth: 150 }}>
            Refresh posture
          </button>
        </div>

        {err && <p className="error" style={{ marginTop: 10 }}>{err}</p>}
      </div>

      {/* ✅ ONE posture system only (the reusable component) */}
      <div style={{ gridColumn: '1 / -1' }}>
        <PosturePanel
          key={postureKey}
          title="Security Posture — Manager"
          subtitle="Global posture snapshot (MVP) • Admin automatically sees everything Manager sees"
        />
      </div>

      {/* ✅ Manager data (keep it) */}
      <div className="card">
        <h3>Security Overview</h3>

        {!overview && <p>{loading ? 'Loading…' : 'No data'}</p>}

        {overview && (
          <div className="kpi">
            <div><b>{overview.users}</b><span>Users</span></div>
            <div><b>{overview.companies}</b><span>Companies</span></div>
            <div><b>{overview.auditEvents}</b><span>Audit events</span></div>
            <div><b>{overview.notifications}</b><span>Notifications</span></div>
          </div>
        )}

        <p style={{ marginTop: 10 }}>
          <small>Tip: Trading Terminal is in the top menu → Trading.</small>
        </p>
      </div>

      <div className="card">
        <h3>Notifications</h3>
        {notifications.length === 0 && (
          <p><small>{loading ? 'Loading…' : 'No notifications yet.'}</small></p>
        )}

        <ul className="list">
          {notifications.slice(0, 10).map(n => (
            <li key={n.id}>
              <span className={`dot ${n.severity || 'info'}`} aria-hidden="true"></span>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <b>{n.title}</b>
                  <small>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</small>
                </div>
                <div><small>{n.message}</small></div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Audit Log</h3>
        {audit.length === 0 && (
          <p><small>{loading ? 'Loading…' : 'No audit events yet.'}</small></p>
        )}

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {audit.slice(0, 25).map(ev => (
                <tr key={ev.id || `${ev.at}-${ev.action}-${ev.actorId}-${ev.targetId}`}>
                  <td><small>{ev.at ? new Date(ev.at).toLocaleString() : ''}</small></td>
                  <td><small>{ev.action || ''}</small></td>
                  <td><small>{ev.actorId || '-'}</small></td>
                  <td><small>{(ev.targetType || '-') + ':' + (ev.targetId || '-')}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: 10 }}>
          <small>Managers have read-only visibility here by default.</small>
        </p>
      </div>
    </div>
  );
}
