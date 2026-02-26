// AdminToolGovernance.jsx
// Enterprise Tool Governance Control Panel

import React, { useEffect, useState } from "react";
import { getToken } from "../../lib/api.js";

export default function AdminToolGovernance() {
  const base = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
  const [requests, setRequests] = useState([]);
  const [durationMap, setDurationMap] = useState({});

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

  useEffect(() => {
    loadRequests();
  }, []);

  async function approve(id) {
    const duration = durationMap[id] || 1440;

    await fetch(`${base}/api/tools/requests/${id}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        durationMinutes: Number(duration),
        note: "Approved by admin"
      })
    });

    loadRequests();
  }

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

  return (
    <div style={{ padding: 30, display: "flex", flexDirection: "column", gap: 30 }}>
      <div className="sectionTitle">Tool Governance Control</div>

      {requests.length === 0 ? (
        <div className="muted">No pending tool requests.</div>
      ) : (
        requests.map(req => (
          <div
            key={req.id}
            style={{
              padding: 15,
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 10
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {req.toolName}
            </div>

            <div style={{ fontSize: 13, opacity: 0.6 }}>
              Requested By: {req.requestedBy}
            </div>

            <div style={{ fontSize: 13, opacity: 0.6 }}>
              Role: {req.requestedRole}
            </div>

            {req.toolDangerous && (
              <div style={{ marginTop: 6, color: "#ff4d4f", fontSize: 12 }}>
                ⚠ Dangerous Tool (Admin Required)
              </div>
            )}

            <div style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12 }}>
                Duration (minutes):
              </label>
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
                  width: 100,
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
  );
}
