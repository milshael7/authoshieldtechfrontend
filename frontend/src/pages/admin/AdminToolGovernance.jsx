// frontend/src/pages/admin/AdminToolGovernance.jsx
// Enterprise Tool Governance Control Center
// Pending Review • Dangerous Tools • Active Grants • Extend • Revoke • Auto Refresh
// Fully aligned with backend v3.1

import React, { useEffect, useState, useCallback } from "react";
import { getToken } from "../../lib/api.js";

function timeRemaining(expiresAt) {
  if (!expiresAt) return "—";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";

  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function safeNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function AdminToolGovernance() {
  const base = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

  const [requests, setRequests] = useState([]);
  const [grants, setGrants] = useState([]);
  const [durationMap, setDurationMap] = useState({});
  const [loading, setLoading] = useState(true);

  /* ================= LOAD REQUESTS ================= */

  const loadRequests = useCallback(async () => {
    try {
      const res = await fetch(`${base}/api/tools/requests/inbox`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setRequests(data.inbox || []);
    } catch (e) {
      console.error("Failed loading requests", e);
    }
  }, [base]);

  /* ================= LOAD GRANTS ================= */

  const loadGrants = useCallback(async () => {
    try {
      const res = await fetch(`${base}/api/tools/grants`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setGrants(data.grants || []);
    } catch (e) {
      console.error("Failed loading grants", e);
    }
  }, [base]);

  /* ================= INIT ================= */

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadRequests();
      await loadGrants();
      setLoading(false);
    }

    init();

    const interval = setInterval(() => {
      loadRequests();
      loadGrants();
    }, 15000);

    return () => clearInterval(interval);
  }, [loadRequests, loadGrants]);

  /* ================= APPROVE ================= */

  async function approve(id) {
    const duration = safeNumber(durationMap[id], 1440);

    await fetch(`${base}/api/tools/requests/${id}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        durationMinutes: duration,
        note: "Approved by admin"
      })
    });

    await loadRequests();
    await loadGrants();
  }

  /* ================= DENY ================= */

  async function deny(id) {
    await fetch(`${base}/api/tools/requests/${id}/deny`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ note: "Denied by admin" })
    });

    await loadRequests();
  }

  /* ================= REVOKE ================= */

  async function revoke(grantId) {
    await fetch(`${base}/api/tools/grants/${grantId}/revoke`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    await loadGrants();
  }

  /* ================= EXTEND ================= */

  async function extend(grantId) {
    const duration = safeNumber(durationMap[grantId], 1440);

    await fetch(`${base}/api/tools/grants/${grantId}/extend`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ durationMinutes: duration })
    });

    await loadGrants();
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading governance data…</div>;
  }

  return (
    <div style={{ padding: 30, display: "flex", flexDirection: "column", gap: 40 }}>

      <div className="sectionTitle">Tool Governance Control Center</div>

      {/* ================= PENDING REQUESTS ================= */}

      <div className="postureCard">
        <h3>Pending Requests</h3>

        {requests.length === 0 ? (
          <div className="muted">No pending tool requests.</div>
        ) : (
          requests.map(req => (
            <div
              key={req.id}
              style={{
                padding: 16,
                marginBottom: 16,
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 12
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {req.toolName}
              </div>

              <div style={{ fontSize: 12, opacity: 0.65 }}>
                Requested By: {req.requestedBy} ({req.requestedRole})
              </div>

              {req.seatUser && (
                <div style={{ fontSize: 12, opacity: 0.5 }}>
                  Seat User Request (company-scoped routing applied)
                </div>
              )}

              {req.toolDangerous && (
                <div style={{ marginTop: 6, color: "#ff4d4f", fontSize: 12 }}>
                  ⚠ Dangerous Tool — Admin Level Required
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12 }}>Grant Duration (minutes):</label>
                <input
                  type="number"
                  value={durationMap[req.id] || 1440}
                  onChange={e =>
                    setDurationMap(prev => ({
                      ...prev,
                      [req.id]: e.target.value
                    }))
                  }
                  style={{
                    marginLeft: 10,
                    width: 120,
                    padding: 6
                  }}
                />
              </div>

              <div style={{ marginTop: 14 }}>
                <button className="btn small" onClick={() => approve(req.id)}>
                  Approve
                </button>

                <button
                  className="btn small muted"
                  style={{ marginLeft: 10 }}
                  onClick={() => deny(req.id)}
                >
                  Deny
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= ACTIVE GRANTS ================= */}

      <div className="postureCard">
        <h3>Active Tool Grants</h3>

        {grants.length === 0 ? (
          <div className="muted">No active grants.</div>
        ) : (
          grants.map(grant => (
            <div
              key={grant.id}
              style={{
                padding: 16,
                marginBottom: 16,
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 12
              }}
            >
              <div style={{ fontWeight: 700 }}>
                Tool: {grant.toolId}
              </div>

              <div style={{ fontSize: 12, opacity: 0.65 }}>
                Scope:
                {grant.userId && ` User (${grant.userId})`}
                {grant.companyId && ` Company (${grant.companyId})`}
              </div>

              <div style={{ fontSize: 12, opacity: 0.65 }}>
                Approved By: {grant.approvedByRole}
              </div>

              <div style={{ fontSize: 12, marginTop: 4 }}>
                Expires: {new Date(grant.expiresAt).toLocaleString()}
              </div>

              <div style={{ fontSize: 12, marginTop: 4 }}>
                Time Remaining: {timeRemaining(grant.expiresAt)}
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 12 }}>Extend (minutes):</label>
                <input
                  type="number"
                  value={durationMap[grant.id] || 1440}
                  onChange={e =>
                    setDurationMap(prev => ({
                      ...prev,
                      [grant.id]: e.target.value
                    }))
                  }
                  style={{
                    marginLeft: 10,
                    width: 120,
                    padding: 6
                  }}
                />
              </div>

              <div style={{ marginTop: 14 }}>
                <button className="btn small" onClick={() => extend(grant.id)}>
                  Extend
                </button>

                <button
                  className="btn small muted"
                  style={{ marginLeft: 10 }}
                  onClick={() => revoke(grant.id)}
                >
                  Revoke
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
