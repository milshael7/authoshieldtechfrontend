// frontend/src/pages/admin/AdminToolGovernance.jsx
// Enterprise Tool Governance Control Center
// Pending Review • Dangerous Tools • Active Grants • Extend • Revoke • Auto Refresh

import React, { useEffect, useState } from "react";
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

export default function AdminToolGovernance() {
  const base = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

  const [requests, setRequests] = useState([]);
  const [grants, setGrants] = useState([]);
  const [durationMap, setDurationMap] = useState({});

  /* ================= LOAD REQUESTS ================= */
  async function loadRequests() {
    try {
      const res = await fetch(`${base}/api/tools/requests/inbox`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setRequests(data.inbox || []);
    } catch {}
  }

  /* ================= LOAD GRANTS ================= */
  async function loadGrants() {
    try {
      const res = await fetch(`${base}/api/tools/grants`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setGrants(data.grants || []);
    } catch {}
  }

  useEffect(() => {
    loadRequests();
    loadGrants();

    const interval = setInterval(() => {
      loadRequests();
      loadGrants();
    }, 15000); // refresh every 15s

    return () => clearInterval(interval);
  }, []);

  /* ================= APPROVE ================= */
  async function approve(id) {
    const duration = Number(durationMap[id] || 1440);

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

    loadRequests();
    loadGrants();
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

    loadRequests();
  }

  /* ================= REVOKE ================= */
  async function revoke(grantId) {
    await fetch(`${base}/api/tools/grants/${grantId}/revoke`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    loadGrants();
  }

  /* ================= EXTEND ================= */
  async function extend(grantId) {
    const duration = Number(durationMap[grantId] || 1440);

    await fetch(`${base}/api/tools/grants/${grantId}/extend`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ durationMinutes: duration })
    });

    loadGrants();
  }

  return (
    <div style={{ padding: 30, display: "flex", flexDirection: "column", gap: 40 }}>
      <div className="sectionTitle">Tool Governance Control</div>

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
                padding: 15,
                marginBottom: 15,
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 10
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {req.toolName}
              </div>

              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Requested By: {req.requestedBy} ({req.requestedRole})
              </div>

              {req.toolDangerous && (
                <div style={{ marginTop: 6, color: "#ff4d4f", fontSize: 12 }}>
                  ⚠ Dangerous Tool (Admin Required)
                </div>
              )}

              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 12 }}>Duration (minutes):</label>
                <input
                  type="number"
                  value={durationMap[req.id] || 1440}
                  onChange={e =>
                    setDurationMap({
                      ...durationMap,
                      [req.id]: e.target.value
                    })
                  }
                  style={{
                    marginLeft: 10,
                    width: 120,
                    padding: 5
                  }}
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <button
                  className="btn small"
                  onClick={() => approve(req.id)}
                >
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
                padding: 15,
                marginBottom: 15,
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 10
              }}
            >
              <div style={{ fontWeight: 700 }}>
                Tool: {grant.toolId}
              </div>

              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Expires: {new Date(grant.expiresAt).toLocaleString()}
              </div>

              <div style={{ fontSize: 12, marginTop: 4 }}>
                Time Remaining: {timeRemaining(grant.expiresAt)}
              </div>

              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 12 }}>Extend (minutes):</label>
                <input
                  type="number"
                  value={durationMap[grant.id] || 1440}
                  onChange={e =>
                    setDurationMap({
                      ...durationMap,
                      [grant.id]: e.target.value
                    })
                  }
                  style={{
                    marginLeft: 10,
                    width: 120,
                    padding: 5
                  }}
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <button
                  className="btn small"
                  onClick={() => extend(grant.id)}
                >
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
