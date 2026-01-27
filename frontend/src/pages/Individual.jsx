// frontend/src/pages/Individual.jsx
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import NotificationList from '../components/NotificationList.jsx';

function apiBase(){
  return (import.meta.env.VITE_API_BASE || import.meta.env.VITE_BACKEND_URL || '').trim();
}

export default function Individual({ user }) {
  const [notes, setNotes] = useState([]);
  const [project, setProject] = useState({
    title: '',
    issueType: 'phishing',
    details: ''
  });
  const [created, setCreated] = useState(null);

  // ✅ NEW: posture state
  const [posture, setPosture] = useState(null);
  const [postureErr, setPostureErr] = useState('');

  const loadNotes = async () => setNotes(await api.meNotifications());

  // ✅ NEW: load posture from backend (/api/posture/me)
  const loadPosture = async () => {
    setPostureErr('');
    const base = apiBase();
    if (!base) {
      setPostureErr('Missing VITE_API_BASE');
      return;
    }

    try {
      const res = await fetch(`${base}/api/posture/me`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
      setPosture(data);
    } catch (e) {
      setPostureErr(e?.message || 'Failed to load posture');
    }
  };

  useEffect(() => {
    loadNotes().catch(e => alert(e.message));
    loadPosture().catch(()=>{});
  }, []);

  const markRead = async (id) => {
    try {
      await api.markMyNotificationRead(id);
      await loadNotes();
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
      await loadNotes();
    } catch (e) { alert(e.message); }
  };

  const score = posture?.posture?.score;
  const risk = posture?.posture?.risk || '—';
  const alerts = posture?.recent?.alerts || [];

  return (
    <div className="grid">
      <div className="card">
        <h2>Cybersecurity Dashboard</h2>
        <p><small>Report an issue and track AutoProtect actions.</small></p>
      </div>

      {/* ✅ NEW: Security Posture */}
      <div className="card">
        <div style={{display:'flex', justifyContent:'space-between', gap:10, alignItems:'center'}}>
          <h3 style={{margin:0}}>Security Posture</h3>
          <button style={{width:150}} onClick={loadPosture}>Refresh</button>
        </div>

        {postureErr && <p className="error" style={{marginTop:10}}>{postureErr}</p>}

        {!posture && !postureErr && (
          <p style={{marginTop:10}}><small>Loading posture…</small></p>
        )}

        {posture && (
          <>
            <div className="kpi" style={{marginTop:10}}>
              <div>
                <b>{Number.isFinite(Number(score)) ? score : '—'}</b>
                <span>Score</span>
              </div>
              <div>
                <b>{String(risk).toUpperCase()}</b>
                <span>Risk</span>
              </div>
              <div>
                <b>{alerts.length}</b>
                <span>Active alerts</span>
              </div>
              <div>
                <b>{posture?.me?.autoprotectEnabled ? 'ON' : 'OFF'}</b>
                <span>AutoProtect</span>
              </div>
            </div>

            <div style={{marginTop:12}}>
              <b>Recent alerts</b>
              <div style={{height:8}} />
              {alerts.length === 0 && <div className="muted">No alerts right now.</div>}
              {alerts.length > 0 && (
                <div className="tableWrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Severity</th>
                        <th>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.slice(0, 12).map((a, i) => (
                        <tr key={i}>
                          <td><small>{a.at ? new Date(a.at).toLocaleString() : '—'}</small></td>
                          <td><small>{a.type || '—'}</small></td>
                          <td><small>{a.severity || '—'}</small></td>
                          <td><small>{a.msg || '—'}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h3>Report a security issue</h3>
        <form onSubmit={create} className="form">
          <label>Title</label>
          <input value={project.title} onChange={e=>setProject({...project,title:e.target.value})} placeholder="e.g., suspicious login attempt" required />
          <label>Type</label>
          <select value={project.issueType} onChange={e=>setProject({...project,issueType:e.target.value})}>
            <option value="phishing">Phishing</option>
            <option value="account_takeover">Account takeover</option>
            <option value="malware">Malware</option>
            <option value="fraud">Fraud</option>
            <option value="other">Other</option>
          </select>
          <label>Details</label>
          <textarea value={project.details} onChange={e=>setProject({...project,details:e.target.value})} placeholder="What happened? What did you notice?" rows={4} />
          <button type="submit">Create case</button>
        </form>

        {created && (
          <div style={{marginTop:12}}>
            <b>Created case:</b> <code>{created.id}</code>
            <div><small>Status: {created.status || 'Open'}</small></div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Notifications</h3>
        <NotificationList items={notes} onRead={markRead} />
      </div>

      <div className="card">
        <h3>How AutoProtect works (MVP)</h3>
        <p><small>
          AutoProtect will monitor logins, API activity, and suspicious behavior and generate alerts + an audit trail.
          Next step is enforcing blocks and auto-remediation.
        </small></p>
      </div>
    </div>
  );
}
