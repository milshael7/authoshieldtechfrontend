import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import NotificationList from '../components/NotificationList.jsx';

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

  return (
    <div className="grid">
      <div className="card">
        <h2>Cybersecurity Dashboard</h2>
        <p><small>Report an issue and track AutoProtect actions.</small></p>
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
          Right now, AutoProtect creates an audit trail and notifications. Next step is wiring the always-on AI worker
          to monitor logins, requests, and trading activity and automatically trigger blocks/alerts.
        </small></p>
      </div>
    </div>
  );
}
