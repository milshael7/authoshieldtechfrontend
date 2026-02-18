// frontend/src/pages/Individual.jsx
// Individual Workspace — Personal Protection Layer
// No cross-company access
// No management controls
// Fully scoped to self

import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import NotificationList from '../components/NotificationList.jsx';
import PosturePanel from '../components/PosturePanel.jsx';
import { useCompany } from '../context/CompanyContext';

export default function Individual({ user }) {

  // 🔥 Ensure no company scope is inherited
  const { setCompany } = useCompany();

  const [notes, setNotes] = useState([]);
  const [project, setProject] = useState({
    title: '',
    issueType: 'phishing',
    details: ''
  });
  const [created, setCreated] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const n = await api.meNotifications();
      setNotes(Array.isArray(n) ? n : []);
      setCompany(null); // Individual has no company context
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    try {
      await api.markMyNotificationRead(id);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function create(e) {
    e.preventDefault();
    try {
      const p = await api.createProject({
        title: project.title,
        issue: { type: project.issueType, details: project.details }
      });

      setCreated(p);
      setProject({ title:'', issueType:'phishing', details:'' });
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="grid">

      {/* ================= HEADER ================= */}
      <div className="card">
        <h2>Personal Cybersecurity Dashboard</h2>
        <p>
          <small>
            Individual protection layer. No cross-organization visibility.
          </small>
        </p>
      </div>

      {/* ================= POSTURE ================= */}
      <div style={{ gridColumn: "1 / -1" }}>
        <PosturePanel
          title="Personal Security Posture"
          subtitle="Individual risk and AutoProtect status"
        />
      </div>

      {/* ================= ISSUE REPORT ================= */}
      <div className="card">
        <h3>Report a Security Issue</h3>

        <form onSubmit={create} className="form">
          <label>Title</label>
          <input
            value={project.title}
            onChange={e=>setProject({...project,title:e.target.value})}
            placeholder="e.g., Suspicious login attempt"
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
            placeholder="Describe what happened..."
            rows={4}
          />

          <button type="submit">Create Case</button>
        </form>

        {created && (
          <div style={{marginTop:12}}>
            <b>Case Created:</b> <code>{created.id}</code>
            <div><small>Status: {created.status || 'Open'}</small></div>
          </div>
        )}
      </div>

      {/* ================= NOTIFICATIONS ================= */}
      <div className="card">
        <h3>Notifications</h3>

        {loading && <div style={{ opacity: 0.6 }}>Loading…</div>}

        {!loading && notes.length === 0 && (
          <div style={{ opacity: 0.6 }}>
            No alerts detected.
          </div>
        )}

        <NotificationList items={notes} onRead={markRead} />
      </div>

      {/* ================= AUTO PROTECT INFO ================= */}
      <div className="card">
        <h3>AutoProtect Overview</h3>
        <p>
          <small>
            AutoProtect monitors login behavior, anomaly signals,
            and reported activity. Future updates will include
            always-on AI enforcement with automatic response triggers.
          </small>
        </p>
      </div>

    </div>
  );
}
