// frontend/src/pages/Individual.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import NotificationList from '../components/NotificationList.jsx';

export default function Individual({ user }) {
  const [notes, setNotes] = useState([]);

  // Posture
  const [summary, setSummary] = useState(null);
  const [checks, setChecks] = useState([]);
  const [recent, setRecent] = useState({ audit: [], notifications: [] });
  const [loadingPosture, setLoadingPosture] = useState(true);
  const [postureErr, setPostureErr] = useState('');

  // Existing case form
  const [project, setProject] = useState({
    title: '',
    issueType: 'phishing',
    details: '',
  });
  const [created, setCreated] = useState(null);

  const loadNotes = async () => setNotes(await api.meNotifications());

  const loadPosture = async () => {
    setLoadingPosture(true);
    setPostureErr('');
    try {
      const [s, c, r] = await Promise.all([
        api.postureSummary(),
        api.postureChecks(),
        api.postureRecent(30),
      ]);
      setSummary(s);
      setChecks(c?.checks || []);
      setRecent({ audit: r?.audit || [], notifications: r?.notifications || [] });
    } catch (e) {
      setPostureErr(e?.message || 'Failed to load posture');
    } finally {
      setLoadingPosture(false);
    }
  };

  useEffect(() => {
    loadNotes().catch(e => alert(e.message));
    loadPosture();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = async (id) => {
    try {
      await api.markMyNotificationRead(id);
      await loadNotes();
      await loadPosture();
    } catch (e) { alert(e.message); }
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      const p = await api.createProject({
        title: project.title,
        issue: { type: project.issueType, details: project.details },
      });
      setCreated(p);
      setProject({ title: '', issueType: 'phishing', details: '' });
      await loadNotes();
      await loadPosture();
    } catch (e) { alert(e.message); }
  };

  // simple score (MVP)
  const score = (() => {
    if (!checks || checks.length === 0) return 78;
    const ok = checks.filter(x => x.status === 'ok').length;
    const warn = checks.filter(x => x.status === 'warn').length;
    const danger = checks.filter(x => x.status === 'danger').length;
    let s = 90 + ok * 3 - warn * 6 - danger * 12;
    if (!user?.autoprotectEnabled) s -= 8;
    return Math.max(10, Math.min(99, Math.round(s)));
  })();

  const meterPct = `${score}%`;

  return (
    <div className="grid">
      {/* Posture header card */}
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h2>Cybersecurity Dashboard</h2>
        <p style={{ marginTop: 6 }}>
          <small>Your personal security posture + recent events.</small>
        </p>
        <div style={{ height: 10 }} />
        <button onClick={loadPosture} disabled={loadingPosture}>
          {loadingPosture ? 'Refreshing…' : 'Refresh posture'}
        </button>
        {postureErr && <p className="error" style={{ marginTop: 10 }}>{postureErr}</p>}
      </div>

      {/* Posture “picture-style” layout */}
      <div className="postureWrap" style={{ gridColumn: '1 / -1' }}>
        <div className="postureCard">
          <div className="postureTop">
            <div className="postureTitle">
              <b>Security Posture</b>
              <small>
                Scope: {summary?.scope?.type || 'user'} • Events: {summary?.totals?.auditEvents ?? '—'} • Alerts: {summary?.totals?.notifications ?? '—'}
              </small>
            </div>

            <div className="postureScore">
              <div className="scoreRing">{score}</div>
              <div className="scoreMeta">
                <b>{user?.autoprotectEnabled ? 'AutoProtect On' : 'AutoProtect Off'}</b>
                <span>MVP score (improves as we add real checks)</span>
              </div>
            </div>
          </div>

          <div className="meter" aria-hidden="true">
            <div style={{ width: meterPct }} />
          </div>

          <div className="coverGrid">
            <div>
              <div className="coverItemTop">
                <b>Account Protection</b>
                <small>{user?.autoprotectEnabled ? 'High' : 'Medium'}</small>
              </div>
              <div className="coverBar"><div style={{ width: user?.autoprotectEnabled ? '88%' : '62%' }} /></div>
            </div>

            <div>
              <div className="coverItemTop">
                <b>Threat Monitoring</b>
                <small>{user?.autoprotectEnabled ? 'Active' : 'Limited'}</small>
              </div>
              <div className="coverBar"><div style={{ width: user?.autoprotectEnabled ? '80%' : '55%' }} /></div>
            </div>

            <div>
              <div className="coverItemTop">
                <b>Login Hygiene</b>
                <small>Good</small>
              </div>
              <div className="coverBar"><div style={{ width: '74%' }} /></div>
            </div>

            <div>
              <div className="coverItemTop">
                <b>Data Safety</b>
                <small>Starter</small>
              </div>
              <div className="coverBar"><div style={{ width: '61%' }} /></div>
            </div>
          </div>

          <div style={{ height: 14 }} />

          <div className="radarBox">
            <b>Signal Radar (visual)</b>
            <div style={{ height: 8 }} />
            <div className="radar" />
            <div style={{ height: 8 }} />
            <small>
              This is a visual “radar” placeholder — next we wire real signals (logins, password resets, trading actions, blocks).
            </small>
          </div>
        </div>

        <div className="postureCard">
          <b>Checks</b>
          <div style={{ height: 10 }} />

          {loadingPosture && <p><small>Loading checks…</small></p>}

          {!loadingPosture && checks.length === 0 && (
            <p><small>No checks yet.</small></p>
          )}

          {!loadingPosture && checks.length > 0 && (
            <ul className="list">
              {checks.slice(0, 6).map(ch => (
                <li key={ch.id}>
                  <span className={`dot ${ch.status || 'info'}`} aria-hidden="true" />
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <b>{ch.title}</b>
                      <small>{new Date(ch.at || Date.now()).toLocaleString()}</small>
                    </div>
                    <div><small>{ch.message}</small></div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div style={{ height: 14 }} />
          <b>Recent activity</b>
          <div style={{ height: 10 }} />

          {(recent.notifications || []).length === 0 && (recent.audit || []).length === 0 && (
            <p><small>{loadingPosture ? 'Loading…' : 'No recent activity yet.'}</small></p>
          )}

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {[...(recent.notifications || []).slice(0, 8).map(n => ({
                  at: n.createdAt || n.at,
                  type: `NOTIFY:${n.severity || 'info'}`,
                  msg: n.title ? `${n.title} — ${n.message || ''}` : (n.message || ''),
                })),
                ...(recent.audit || []).slice(0, 8).map(a => ({
                  at: a.at,
                  type: `AUDIT:${a.action || 'event'}`,
                  msg: `${a.targetType || ''}${a.targetId ? ':' + a.targetId : ''}`,
                }))].slice(0, 12).map((x, i) => (
                  <tr key={i}>
                    <td><small>{x.at ? new Date(x.at).toLocaleString() : '—'}</small></td>
                    <td><small>{x.type}</small></td>
                    <td><small>{x.msg}</small></td>
                  </tr>
                ))}

                {(recent.notifications || []).length === 0 && (recent.audit || []).length === 0 && !loadingPosture && (
                  <tr><td colSpan={3}><small className="muted">No items.</small></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Existing: Report issue */}
      <div className="card">
        <h3>Report a security issue</h3>
        <form onSubmit={create} className="form">
          <label>Title</label>
          <input
            value={project.title}
            onChange={e => setProject({ ...project, title: e.target.value })}
            placeholder="e.g., suspicious login attempt"
            required
          />

          <label>Type</label>
          <select
            value={project.issueType}
            onChange={e => setProject({ ...project, issueType: e.target.value })}
          >
            <option value="phishing">Phishing</option>
            <option value="account_takeover">Account takeover</option>
            <option value="malware">Malware</option>
            <option value="fraud">Fraud</option>
            <option value="other">Other</option>
          </select>

          <label>Details</label>
          <textarea
            value={project.details}
            onChange={e => setProject({ ...project, details: e.target.value })}
            placeholder="What happened? What did you notice?"
            rows={4}
          />

          <button type="submit">Create case</button>
        </form>

        {created && (
          <div style={{ marginTop: 12 }}>
            <b>Created case:</b> <code>{created.id}</code>
            <div><small>Status: {created.status || 'Open'}</small></div>
          </div>
        )}
      </div>

      {/* Existing: Notifications */}
      <div className="card">
        <h3>Notifications</h3>
        <NotificationList items={notes} onRead={markRead} />
      </div>
    </div>
  );
}
