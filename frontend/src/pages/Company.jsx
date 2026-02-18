// frontend/src/pages/Company.jsx
// Company Workspace — Scoped Organization Control Layer
// No global visibility
// No admin override
// Internal user governance only

import React, { useEffect, useState, useMemo } from "react";
import { api } from "../lib/api.js";
import NotificationList from "../components/NotificationList.jsx";
import PosturePanel from "../components/PosturePanel.jsx";
import { useCompany } from "../context/CompanyContext";

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

export default function Company() {
  const { setCompany } = useCompany();

  const [company, setCompanyData] = useState(null);
  const [notes, setNotes] = useState([]);
  const [memberId, setMemberId] = useState("");
  const [memberDetails, setMemberDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [postureKey, setPostureKey] = useState(0);

  async function loadRoom() {
    setLoading(true);
    setErr("");

    try {
      const [c, n, members] = await Promise.all([
        api.companyMe(),
        api.companyNotifications(),
        api.companyMembers?.() || Promise.resolve({ users: [] }),
      ]);

      setCompanyData(c || null);
      setNotes(safeArray(n));
      setMemberDetails(safeArray(members?.users));

      // 🔥 LOCK CONTEXT TO THIS COMPANY
      if (c?.id) {
        setCompany({
          id: c.id,
          name: c.name,
        });
      }

    } catch (e) {
      setErr(e?.message || "Failed to load company workspace");
    } finally {
      setLoading(false);
    }
  }

  function refreshPosture() {
    setPostureKey((k) => k + 1);
  }

  useEffect(() => {
    loadRoom();
    refreshPosture();
  }, []);

  const stats = useMemo(() => {
    return {
      total: memberDetails.length,
      mfaEnabled: memberDetails.filter((u) => u.mfa === true).length,
      locked: memberDetails.filter((u) => u.locked === true).length,
    };
  }, [memberDetails]);

  async function addMember() {
    try {
      const id = memberId.trim();
      if (!id) return;
      await api.companyAddMember(id);
      setMemberId("");
      await loadRoom();
      refreshPosture();
    } catch (e) {
      alert(e.message);
    }
  }

  async function removeMember(id) {
    try {
      await api.companyRemoveMember(id);
      await loadRoom();
      refreshPosture();
    } catch (e) {
      alert(e.message);
    }
  }

  async function markRead(id) {
    try {
      await api.companyMarkRead(id);
      await loadRoom();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="grid">

      {/* ================= HEADER ================= */}
      <div className="card" style={{ gridColumn: "1 / -1" }}>
        <h2>Organization Control Workspace</h2>

        {company && (
          <>
            <div className="pill">
              <b>{company.name}</b>
              <span className="badge">{company.sizeTier}</span>
            </div>

            <small style={{ opacity: 0.6 }}>
              Company-level governance. Internal visibility only.
              No cross-organization access.
            </small>
          </>
        )}

        <div style={{ height: 12 }} />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={loadRoom} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh Workspace"}
          </button>

          <button onClick={refreshPosture}>
            Refresh Posture
          </button>
        </div>

        {err && <p className="error" style={{ marginTop: 10 }}>{err}</p>}
      </div>

      {/* ================= POSTURE ================= */}
      <div style={{ gridColumn: "1 / -1" }}>
        <PosturePanel
          key={postureKey}
          title="Company Security Posture"
          subtitle="Aggregate internal security health"
        />
      </div>

      {/* ================= MEMBER STATS ================= */}
      <div className="card">
        <h3>Member Overview</h3>

        <div className="kpi">
          <div><b>{stats.total}</b><span>Total Members</span></div>
          <div><b>{stats.mfaEnabled}</b><span>MFA Enabled</span></div>
          <div><b>{stats.locked}</b><span>Locked Accounts</span></div>
        </div>
      </div>

      {/* ================= MEMBER MANAGEMENT ================= */}
      <div className="card">
        <h3>Member Governance</h3>

        <div style={{ height: 10 }} />

        <div className="row">
          <div className="col">
            <input
              placeholder="Member userId"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
            />
          </div>
          <div className="col">
            <button onClick={addMember} disabled={!memberId.trim()}>
              Add Member
            </button>
          </div>
        </div>

        <div style={{ height: 16 }} />

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>MFA</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {memberDetails.map((u) => (
                <tr key={u.id}>
                  <td><small>{u.name}</small></td>
                  <td><small>{u.email}</small></td>
                  <td><small>{u.mfa ? "Enabled" : "Disabled"}</small></td>
                  <td><small>{u.locked ? "Locked" : "Active"}</small></td>
                  <td>
                    <button onClick={() => removeMember(u.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}

              {memberDetails.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <small className="muted">No members registered.</small>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= NOTIFICATIONS ================= */}
      <div className="card">
        <h3>Organization Notifications</h3>
        <NotificationList items={notes} onRead={markRead} />
      </div>

    </div>
  );
}
