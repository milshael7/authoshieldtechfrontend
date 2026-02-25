// frontend/src/pages/user/IndividualUserSecurityDashboard.jsx
// Personal Security Center
// Individual Risk • Sessions • Devices • Account Status • Subscription Awareness

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

  const [sessions, setSessions] = useState([]);
  const base = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

  /* ================= LOAD PERSONAL SESSIONS ================= */
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

  const color = riskColor(riskScore);

  return (
    <div style={{ padding: 30, display: "flex", flexDirection: "column", gap: 30 }}>

      <div className="sectionTitle">Personal Security Center</div>

      {/* ================= PERSONAL RISK ================= */}
      <div
        className="postureCard"
        style={{ border: `1px solid ${color}50` }}
      >
        <h3>Your Risk Score</h3>

        <div
          style={{
            fontSize: 40,
            fontWeight: 900,
            color
          }}
        >
          {Number(riskScore || 0)}
        </div>

        {riskScore >= 80 && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              borderRadius: 8,
              background: "rgba(255,77,79,.15)",
              border: "1px solid rgba(255,77,79,.4)"
            }}
          >
            ⚠ Elevated personal risk detected.
          </div>
        )}
      </div>

      {/* ================= ACCOUNT STATUS ================= */}
      <div className="postureCard">
        <h3>Account Status</h3>

        <div>Status: <b>{user?.status || "Unknown"}</b></div>
        <div style={{ marginTop: 6 }}>
          Subscription:
          <b style={{ marginLeft: 8, color: subscriptionColor(user?.subscriptionStatus) }}>
            {user?.subscriptionStatus || "Unknown"}
          </b>
        </div>
      </div>

      {/* ================= PERSONAL SESSIONS ================= */}
      <div className="postureCard">
        <h3>Active Sessions</h3>

        {sessions.length === 0 ? (
          <div className="muted">No active sessions.</div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.jti}
              style={{
                padding: 10,
                borderBottom: "1px solid rgba(255,255,255,.08)"
              }}
            >
              <div style={{ fontSize: 12 }}>
                Session ID: {session.jti}
              </div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Created: {new Date(session.createdAt).toLocaleString()}
              </div>
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

      {/* ================= SECURITY TIPS ================= */}
      <div className="postureCard">
        <h3>Security Recommendations</h3>

        <ul style={{ paddingLeft: 18, marginTop: 8 }}>
          <li>Use a strong, unique password.</li>
          <li>Enable two-factor authentication if available.</li>
          <li>Revoke sessions you do not recognize.</li>
          <li>Keep devices updated and patched.</li>
        </ul>
      </div>

    </div>
  );
}
