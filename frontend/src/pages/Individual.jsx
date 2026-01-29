import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import NotificationList from '../components/NotificationList.jsx';

function clamp(n,a,b){ return Math.max(a, Math.min(b, n)); }

export default function Individual({ user }) {
  const [notes, setNotes] = useState([]);
  const [project, setProject] = useState({
    title: '',
    issueType: 'phishing',
    details: ''
  });
  const [created, setCreated] = useState(null);

  const load = async () => setNotes(await api.meNotifications());

  useEffect(() => { load().catch(e => alert(e.message)); }, []);

  const markRead = async (id) => {
    try {
      await api.markMyNotificationRead(id);
      await load();
    } catch (e) { alert(e.message); }
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      const p = await api.createProject({
        title: project.title,
        issue: { type: project.issueType, details: project.details }
      });
      setCreated(p);
      setProject({ title:'', issueType:'phishing', details:'' });
      await load();
    } catch (e) { alert(e.message); }
  };

  // MVP “score” based on subscription/autoprotect + unread notifications
  const score = useMemo(() => {
    let s = 82;
    if (user?.subscriptionStatus === 'Locked') s -= 30;
    if (user?.subscriptionStatus === 'PastDue') s -= 10;
    if (!user?.autoprotectEnabled) s -= 10;

    const unread = (notes || []).filter(n => !n.readAt).length;
    s -= Math.min(18, unread * 2);

    return clamp(s, 0, 100);
  }, [user, notes]);

  const coverage = useMemo(() => ([
    { label: 'Threat', val: clamp(score - 6, 0, 100) },
    { label: 'Vuln', val: clamp(score - 12, 0, 100) },
    { label: 'Access', val: clamp(score - 4, 0, 100) },
    { label: 'Data', val: clamp(score - 10, 0, 100) },
  ]), [score]);

  return (
    <div className="grid">

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="postureWrap">

          {/* Left big posture card */}
          <div className="postureCard">
            <div className="postureTop">
              <div className="postureTitle">
                <b>Cybersecurity Dashboard</b>
                <small>Personal room • Security posture snapshot (MVP)</small>
              </div>

              <div className="postureScore">
                <div className="scoreRing">{score}</div>
                <div className="scoreMeta">
                  <b>Account Score</b>
                  <span>{score >= 80 ? 'Healthy' : (score >= 60 ? 'Watch' : 'At Risk')}</span>
                </div>
              </div>
            </div>

            <div className="meter" aria-hidden="true">
              <div style={{ width: `${score}%` }} />
            </div>

            <div className="coverGrid">
              {coverage.map(x => (
                <div key={x.label}>
                  <div className="coverItemTop">
                    <b>{x.label} Coverage</b>
                    <small>{x.val}%</small>
                  </div>
                  <div className="coverBar" aria-hidden="true">
                    <div style={{ width: `${x.val}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ height: 14 }} />

            <div className="kpi">
              <div><b>{user?.subscriptionStatus || '—'}</b><span>Subscription</span></div>
              <div><b>{user?.autoprotectEnabled ? 'On' : 'Off'}</b><span>AutoProtect</span></div>
              <div><b>{(notes || []).filter(n => !n.readAt).length}</b><span>Unread alerts</span></div>
              <div><b>{(notes || []).length}</b><span>Total alerts</span></div>
            </div>

            <div style={{ height: 10 }} />
            <p><small>Next: real device signals, login anomalies, and policy checks.</small></p>
          </div>

          {/* Right radar + recent notifications */}
          <div className="postureCard radarBox">
            <div className="postureTop">
              <div className="postureTitle">
                <b>Signal Radar</b>
                <small>MVP visual (real signals later)</small>
              </div>
            </div>

            <div className="radar" />

            <div style={{ height: 12 }} />
            <b style={{ display: 'block', marginBottom: 8 }}>Recent alerts</b>

            <NotificationList items={(notes || []).slice(0, 8)} onRead={markRead} />
          </div>

        </div>
      </div>

      {/* Report issue + How it works */}
      <div className="card">
        <h3>Report a security issue</h3>
        <form onSubmit={create} className="form">
          <label>Title</label>
          <input
            value={project.title}
            onChange={e=>setProject({...project,title:e.target.value})}
            placeholder="e.g., suspicious login attempt"
            required
          />

          <label>Type</label>
          <select
            value={project.issueType}
            onChange={e=>setProject({...project,issueType:e.target.value})}
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
            onChange={e=>setProject({...project,details:e.target.value})}
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

      <div className="card">
        <h3>How AutoProtect works (MVP)</h3>
        <p><small>
          Right now, AutoProtect creates an audit trail and notifications.
          Next step is wiring the always-on AI worker to monitor logins, requests, and trading activity
          and automatically trigger blocks/alerts.
        </small></p>
      </div>

      {/* Full notifications list */}
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h3>All Notifications</h3>
        <NotificationList items={notes} onRead={markRead} />
      </div>

    </div>
  );
}
