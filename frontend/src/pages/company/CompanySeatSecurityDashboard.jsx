// frontend/src/pages/company/CompanySeatSecurityDashboard.jsx
// Company Seat Security Panel
// Individual Seat Risk • Personal Sessions • Device Integrity • Compliance Awareness

import React, { useEffect, useMemo, useState } from "react";
import { useSecurity } from "../../context/SecurityContext.jsx";
import { getToken, getSavedUser } from "../../lib/api.js";

function riskColor(score) {
  const n = Number(score || 0);
  if (n >= 85) return "#ff4d4f";
  if (n >= 70) return "#ff9800";
  if (n >= 40) return "#facc15";
  return "#22c55e";
}

export default function CompanySeatSecurityDashboard() {
  const { riskScore, deviceAlerts } = useSecurity();
  const user = getSavedUser();

  const [sessions, setSessions] = useState([]);
  const [compliance, setCompliance] = useState(null);

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

  /* ================= LOAD PERSONAL COMPLIANCE ================= */
  useEffect(() => {
    async function loadCompliance() {
      try {
        const res = await fetch(`${base}/api/security/compliance`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setCompliance(data || null);
      } catch {}
    }

    loadCompliance();
  }, [base]);

  const personalAlerts = useMemo(() => {
    return (deviceAlerts || []).slice(0, 5);
  }, [deviceAlerts]);

  const color = riskColor(riskScore);

  return (
    <div style={{ padding: 30, display: "flex", flexDirection: "column", gap: 30 }}>

      <div className="sectionTitle">Seat Security Panel</div>

      {/* ================= PERSONAL RISK ================= */}
      <div
        className="postureCard"
        style={{ border: `1px solid ${color}50` }}
      >
        <h3>Your Risk Score</h3>

        <div
          style={{
            fontSize: 42,
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
            ⚠ Elevated seat-level risk detected.
          </div>
        )}
      </div>

      {/* ================= PERSONAL SESSIONS ================= */}
      <div className="postureCard">
        <h3>Your Active Sessions</h3>

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
                JTI: {session.jti}
              </div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Created: {new Date(session.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= PERSONAL DEVICE ALERTS ================= */}
      <div className="postureCard">
        <h3>Your Device Alerts</h3>

        {personalAlerts.length === 0 ? (
          <div className="muted">No device alerts detected.</div>
        ) : (
          personalAlerts.map((alert, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              {alert.deviceName || "Device"} — {alert.message}
            </div>
          ))
        )}
      </div>

      {/* ================= PERSONAL COMPLIANCE ================= */}
      <div className="postureCard">
        <h3>Your Compliance Status</h3>

        {compliance ? (
          <div>
            <div>Score: <b>{compliance.score}</b></div>
            <div>Status: <b>{compliance.status}</b></div>
          </div>
        ) : (
          <div className="muted">
            Compliance data unavailable.
          </div>
        )}
      </div>

      {/* ================= USER ID DISPLAY ================= */}
      <div className="postureCard">
        <h3>Seat Identity</h3>
        <div>User ID: <b>{user?.id}</b></div>
        <div>Role: <b>{user?.role}</b></div>
      </div>

    </div>
  );
}
