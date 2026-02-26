// frontend/src/pages/user/IndividualUserSecurityDashboard.jsx
// Personal Security Center + Tool Governance View

import React, { useEffect, useState } from "react";
import { useSecurity } from "../../context/SecurityContext.jsx";
import { getToken, getSavedUser } from "../../lib/api.js";

function riskColor(score) {
  const n = Number(score || 0);
  if (n >= 85) return "#ff4d4f";
  if (n >= 70) return "#ff9800";
  if (n >= 40) return "#facc15";
  return "#22c55e";
}

function subscriptionColor(status) {
  if (status === "Active") return "#22c55e";
  if (status === "Past Due") return "#ff9800";
  if (status === "Locked") return "#ff4d4f";
  return "#999";
}

export default function IndividualUserSecurityDashboard() {
  const { riskScore, deviceAlerts } = useSecurity();
  const user = getSavedUser();
  const base = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

  const [sessions, setSessions] = useState([]);
  const [tools, setTools] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  const isSeat =
    Boolean(user?.companyId) && !Boolean(user?.freedomEnabled);

  /* ================= LOAD SESSIONS ================= */
  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await fetch(`${base}/api/security/sessions`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch {}
    }
    loadSessions();
  }, [base]);

  /* ================= LOAD TOOL CATALOG ================= */
  useEffect(() => {
    async function loadTools() {
      try {
        const res = await fetch(`${base}/api/tools/catalog`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setTools(data.tools || []);
      } catch {}
    }

    async function loadRequests() {
      try {
        const res = await fetch(`${base}/api/tools/requests/mine`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setMyRequests(data.requests || []);
      } catch {}
    }

    loadTools();
    loadRequests();
  }, [base]);

  async function requestTool(toolId) {
    try {
      await fetch(`${base}/api/tools/request/${toolId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ note: "User requested access" })
      });

      // refresh requests
      const res = await fetch(`${base}/api/tools/requests/mine`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyRequests(data.requests || []);
      }
    } catch {}
  }

  function hasPendingRequest(toolId) {
    return myRequests.some(
      r =>
        r.toolId === toolId &&
        ["pending_company", "pending_review", "pending_admin"].includes(r.status)
    );
  }

  const color = riskColor(riskScore);

  return (
    <div style={{ padding: 30, display: "flex", flexDirection: "column", gap: 30 }}>

      <div className="sectionTitle">Personal Security Center</div>

      {/* ================= RISK ================= */}
      <div className="postureCard" style={{ border: `1px solid ${color}50` }}>
        <h3>Your Risk Score</h3>
        <div style={{ fontSize: 40, fontWeight: 900, color }}>
          {Number(riskScore || 0)}
        </div>
      </div>

      {/* ================= ACCOUNT ================= */}
      <div className="postureCard">
        <h3>Account Status</h3>
        <div>Status: <b>{user?.status || "Unknown"}</b></div>
        <div style={{ marginTop: 6 }}>
          Subscription:
          <b style={{ marginLeft: 8, color: subscriptionColor(user?.subscriptionStatus) }}>
            {user?.subscriptionStatus || "Unknown"}
          </b>
        </div>

        {isSeat && (
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            This account is managed by your company.
            Tool requests must be forwarded by them.
          </div>
        )}
      </div>

      {/* ================= TOOL ACCESS CENTER ================= */}
      <div className="postureCard">
        <h3>Tool Access Center</h3>

        {tools.length === 0 ? (
          <div className="muted">No tools available.</div>
        ) : (
          tools.map(tool => {
            const pending = hasPendingRequest(tool.id);

            return (
              <div
                key={tool.id}
                style={{
                  padding: 12,
                  marginBottom: 10,
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 8
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {tool.name}
                </div>

                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {tool.description}
                </div>

                <div style={{ marginTop: 8 }}>

                  {tool.accessible ? (
                    <button className="btn small">
                      Open
                    </button>
                  ) : tool.requiresApproval ? (
                    pending ? (
                      <button className="btn small muted">
                        Pending Approval
                      </button>
                    ) : (
                      <button
                        className="btn small"
                        onClick={() => requestTool(tool.id)}
                      >
                        Request Access
                      </button>
                    )
                  ) : (
                    <button className="btn small muted">
                      Not Entitled
                    </button>
                  )}

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ================= SESSIONS ================= */}
      <div className="postureCard">
        <h3>Active Sessions</h3>

        {sessions.length === 0 ? (
          <div className="muted">No active sessions.</div>
        ) : (
          sessions.map(session => (
            <div key={session.jti} style={{ fontSize: 12 }}>
              Session ID: {session.jti}
            </div>
          ))
        )}
      </div>

      {/* ================= DEVICE ALERTS ================= */}
      <div className="postureCard">
        <h3>Recent Device Alerts</h3>

        {deviceAlerts.length === 0 ? (
          <div className="muted">No device alerts detected.</div>
        ) : (
          deviceAlerts.slice(0, 5).map((alert, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              {alert.deviceName || "Device"} — {alert.message}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
