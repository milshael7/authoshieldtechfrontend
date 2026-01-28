// frontend/src/pages/Admin.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import NotificationList from '../components/NotificationList.jsx';

export default function Admin({ user }) {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [notes, setNotes] = useState([]);

  // ✅ Manager-room visibility inside Admin
  const [mgrOverview, setMgrOverview] = useState(null);
  const [mgrAudit, setMgrAudit] = useState([]);
  const [mgrNotes, setMgrNotes] = useState([]);
  const [mgrLoading, setMgrLoading] = useState(false);
  const [mgrErr, setMgrErr] = useState('');

  const [newUser, setNewUser] = useState({
    email: '',
    role: 'Individual',
    companyId: '',
    password: '',
  });

  const [newCompany, setNewCompany] = useState({
    name: '',
  });

  const load = async () => {
    const [u, c, n] = await Promise.all([
      api.adminUsers(),
      api.adminCompanies(),
      api.adminNotifications(),
    ]);
    setUsers(u || []);
    setCompanies(c || []);
    setNotes(n || []);
  };

  // ✅ load manager room data (Admin allowed)
  const loadManagerRoom = async () => {
    setMgrLoading(true);
    setMgrErr('');
    try {
      const [ov, au, no] = await Promise.all([
        api.managerOverview(),
        api.managerAudit(200),
        api.managerNotifications(),
      ]);
      setMgrOverview(ov || null);
      setMgrAudit(Array.isArray(au) ? au : []);
      setMgrNotes(Array.isArray(no) ? no : []);
    } catch (e) {
      setMgrErr(e?.message || 'Failed to load manager room data');
    } finally {
      setMgrLoading(false);
    }
  };

  useEffect(() => {
    load().catch(e => alert(e.message));
    loadManagerRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        email: newUser.email.trim(),
        role: newUser.role,
        password: newUser.password,
        companyId: newUser.companyId || null,
      };
      await api.adminCreateUser(payload);
      setNewUser({ email: '', role: 'Individual', companyId: '', password: '' });
      await load();
      await loadManagerRoom();
      alert('User created.');
    } catch (e) {
      alert(e.message);
    }
  };

  const rotateId = async (id) => {
    try {
      await api.adminRotateUserId(id);
      await load();
      await loadManagerRoom();
      alert('Platform ID rotated and password reset forced.');
    } catch (e) {
      alert(e.message);
    }
  };

  const toggleAutoprotect = async (u) => {
    try {
      const next = !u.autoprotectEnabled;
      await api.adminUpdateSubscription(u.id, { autoprotectEnabled: next });
      await load();
      await loadManagerRoom();
    } catch (e) {
      alert(e.message);
    }
  };

  const setSub = async (u, status) => {
    try {
      await api.adminUpdateSubscription(u.id, { subscriptionStatus: status });
      await load();
      await loadManagerRoom();
    } catch (e) {
      alert(e.message);
    }
  };

  const createCompany = async (e) => {
    e.preventDefault();
    try {
      await api.adminCreateCompany({ name: newCompany.name.trim() });
      setNewCompany({ name: '' });
      await load();
      await loadManagerRoom();
      alert('Company created.');
    } catch (e) {
      alert(e.message);
    }
  };

  const companyOptions = useMemo(() => (
    companies.map(c => (
      <option key={c.id} value={c.id}>{c.name}</option>
    ))
  ), [companies]);

  const companyNameById = useMemo(() => {
    const m = new Map();
    (companies || []).forEach(c => m.set(c.id, c.name));
    return m;
  }, [companies]);

  return (
    <div className="grid">
      <div className="card">
        <h2>Admin — Cybersecurity Control</h2>
        <p><small>Manage users, companies, subscriptions, and security posture.</small></p>
      </div>

      {/* ✅ Admin sees Manager room overview right here */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>Manager Room (Admin View)</h3>
            <p style={{ marginTop: 6 }}><small>Admin can see everything Manager sees — read-only dashboard.</small></p>
          </div>
          <button onClick={loadManagerRoom} disabled={mgrLoading} style={{ width: 160 }}>
            {mgrLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {mgrErr && <p className="error" style={{ marginTop: 10 }}>{mgrErr}</p>}

        {mgrOverview && (
          <div className="kpi" style={{ marginTop: 10 }}>
            <div><b>{mgrOverview.users}</b><span>Users</span></div>
            <div><b>{mgrOverview.companies}</b><span>Companies</span></div>
            <div><b>{mgrOverview.auditEvents}</b><span>Audit events</span></div>
            <div><b>{mgrOverview.notifications}</b><span>Notifications</span></div>
          </div>
        )}

        {!mgrOverview && !mgrErr && (
          <p style={{ marginTop: 10 }}><small>{mgrLoading ? 'Loading…' : 'No manager overview yet.'}</small></p>
        )}
      </div>

      {/* ✅ Manager notifications inside Admin */}
      <div className="card">
        <h3>Manager Notifications (Admin View)</h3>
        {mgrNotes.length === 0 && <p><small>{mgrLoading ? 'Loading…' : 'No notifications yet.'}</small></p>}
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Title</th>
                <th>Message</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {mgrNotes.slice(0, 12).map(n => (
                <tr key={n.id}>
                  <td><small>{new Date(n.createdAt || Date.now()).toLocaleString()}</small></td>
                  <td><small><b>{n.title || '—'}</b></small></td>
                  <td><small>{n.message || '—'}</small></td>
                  <td><small>{n.severity || 'info'}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ✅ Manager audit log inside Admin */}
      <div className="card">
        <h3>Manager Audit Log (Admin View)</h3>
        {mgrAudit.length === 0 && <p><small>{mgrLoading ? 'Loading…' : 'No audit events yet.'}</small></p>}
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
              {mgrAudit.slice(0, 20).map(ev => (
                <tr key={ev.id}>
                  <td><small>{new Date(ev.at || Date.now()).toLocaleString()}</small></td>
                  <td><small>{ev.action || '—'}</small></td>
                  <td><small>{ev.actorId || '—'}</small></td>
                  <td><small>{(ev.targetType || '—') + ':' + (ev.targetId || '—')}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 10 }}><small>Admin can see this; Managers are read-only by default.</small></p>
      </div>

      <div className="card">
        <h3>Create user</h3>
        <form onSubmit={createUser} className="form">
          <label>Email</label>
          <input
            value={newUser.email}
            onChange={e => setNewUser({ ...newUser, email: e.target.value })}
            placeholder="name@company.com"
            required
          />

          <label>Role</label>
          <select
            value={newUser.role}
            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
          >
            <option value="Individual">Individual</option>
            <option value="Company">Company</option>
            <option value="Manager">Manager</option>
            <option value="Admin">Admin</option>
          </select>

          <label>Company (optional)</label>
          <select
            value={newUser.companyId}
            onChange={e => setNewUser({ ...newUser, companyId: e.target.value })}
          >
            <option value="">— none —</option>
            {companyOptions}
          </select>

          <label>Temporary password</label>
          <input
            value={newUser.password}
            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
            placeholder="Set a temp password"
            required
          />

          <button type="submit">Create user</button>
        </form>
      </div>

      <div className="card">
        <h3>Create company</h3>
        <form onSubmit={createCompany} className="form">
          <label>Name</label>
          <input
            value={newCompany.name}
            onChange={e => setNewCompany({ name: e.target.value })}
            placeholder="Company name"
            required
          />
          <button type="submit">Create company</button>
        </form>
      </div>

      <div className="card">
        <h3>Users</h3>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Company</th>
                <th>Subscription</th>
                <th>AutoProtect</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.companyId ? (companyNameById.get(u.companyId) || u.companyId) : '—'}</td>
                  <td>{u.subscriptionStatus}</td>
                  <td>{u.autoprotectEnabled ? 'On' : 'Off'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => rotateId(u.id)}>Rotate ID</button>
                      <button onClick={() => toggleAutoprotect(u)}>
                        {u.autoprotectEnabled ? 'Disable' : 'Enable'} AutoProtect
                      </button>
                      <button onClick={() => setSub(u, 'Active')}>Set Active</button>
                      <button onClick={() => setSub(u, 'PastDue')}>Set PastDue</button>
                      <button onClick={() => setSub(u, 'Locked')}>Lock</button>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">No users yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>System notifications</h3>
        <NotificationList items={notes} />
      </div>
    </div>
  );
}
