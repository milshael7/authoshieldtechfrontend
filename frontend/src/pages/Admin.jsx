// frontend/src/pages/Admin.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import NotificationList from '../components/NotificationList.jsx';
import CompanySelector from '../components/CompanySelector.jsx';
import { useCompany } from '../context/CompanyContext';

export default function Admin({ user }) {
  const { activeCompanyId, mode } = useCompany();

  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [notes, setNotes] = useState([]);

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
  }, []);

  const filteredUsers = useMemo(() => {
    if (!activeCompanyId) return users;
    return users.filter(u => u.companyId === activeCompanyId);
  }, [users, activeCompanyId]);

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
        <p>
          <small>
            Mode: {mode === "global" ? "Global View" : "Company Scoped View"}
          </small>
        </p>
      </div>

      {/* 🔥 MULTI COMPANY SELECTOR */}
      <div className="card">
        <CompanySelector companies={companies} />
      </div>

      {/* MANAGER ROOM VIEW */}
      {mode === "global" && (
        <>
          <div className="card">
            <h3>Manager Room (Admin View)</h3>
            {mgrOverview && (
              <div className="kpi">
                <div><b>{mgrOverview.users}</b><span>Users</span></div>
                <div><b>{mgrOverview.companies}</b><span>Companies</span></div>
                <div><b>{mgrOverview.auditEvents}</b><span>Audit events</span></div>
                <div><b>{mgrOverview.notifications}</b><span>Notifications</span></div>
              </div>
            )}
          </div>

          <div className="card">
            <h3>Manager Notifications</h3>
            <NotificationList items={mgrNotes} />
          </div>
        </>
      )}

      {/* USERS TABLE */}
      <div className="card">
        <h3>
          Users {activeCompanyId && `— Scoped to Company`}
        </h3>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Company</th>
                <th>Subscription</th>
                <th>AutoProtect</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    {u.companyId
                      ? (companyNameById.get(u.companyId) || u.companyId)
                      : '—'}
                  </td>
                  <td>{u.subscriptionStatus}</td>
                  <td>{u.autoprotectEnabled ? 'On' : 'Off'}</td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5}>No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE COMPANY */}
      {mode === "global" && (
        <div className="card">
          <h3>Create company</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await api.adminCreateCompany({
                name: newCompany.name.trim()
              });
              setNewCompany({ name: '' });
              await load();
            }}
            className="form"
          >
            <input
              value={newCompany.name}
              onChange={e =>
                setNewCompany({ name: e.target.value })
              }
              placeholder="Company name"
              required
            />
            <button type="submit">Create</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>System notifications</h3>
        <NotificationList items={notes} />
      </div>
    </div>
  );
}
