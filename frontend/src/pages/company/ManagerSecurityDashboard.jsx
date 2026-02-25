// frontend/src/pages/manager/ManagerSecurityDashboard.jsx
// Manager Security Command Layer
// Scoped Risk • Incident Awareness • Session Overview • Device Alerts

import React, { useEffect, useMemo, useState } from "react";
import { useSecurity } from "../../context/SecurityContext.jsx";
import { getToken } from "../../lib/api.js";

function riskColor(score) {
  const n = Number(score || 0);
  if (n >= 85) return "#ff4d4f";
  if (n >= 70) return "#ff9800";
  if (n >= 40) return "#facc15";
  return "#22c55e";
}

export default function ManagerSecurityDashboard() {
  const {
    riskScore,
    assetExposure,
    auditFeed,
    deviceAlerts,
  } = useSecurity();

  const [incidents, setIncidents] = useState([]);
  const [sessions, setSessions] = useState([]);

  const base = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

  /* ================= LOAD INCIDENTS ================= */
  useEffect(() => {
    async function loadIncidents() {
      try {
        const res = await fetch(`${base}/api/incidents`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setIncidents(data.incidents || []);
      } catch {}
    }

    loadIncidents();
  }, [base]);

  /* ================= LOAD SESSION SUMMARY ================= */
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

  const highExposureAssets = useMemo(() => {
    return Object.entries(assetExposure || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [assetExposure]);

  const recentAudit = useMemo(() => {
    return (auditFeed || []).slice(0, 5);
  }, [auditFeed]);

  const recentAlerts = useMemo(() => {
    return (deviceAlerts || []).slice(0, 5);
  }, [deviceAlerts]);

  const riskLevelColor = riskColor(riskScore);

  return (
    <div style={{ padding: 30, display: "flex", flexDirection: "column", gap: 30 }}>

      <div className="sectionTitle">Manager Security Command</div>

      {/* ================= RISK ================= */}
      <div
        className="postureCard"
        style={{
          border: `1px solid ${riskLevelColor}50`
        }}
      >
        <h3>Company Risk Score</h3>

        <div
          style={{
            fontSize: 48,
            fontWeight: 900,
            color: riskLevelColor
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
            ⚠ Elevated company risk. Review incidents and device alerts immediately.
          </div>
        )}
      </div>

      {/* ================= INCIDENTS ================= */}
      <div className="postureCard">
        <h3>Active Incidents</h3>

        {incidents.length === 0 ? (
          <div className="muted">No active incidents.</div>
        ) : (
          incidents.slice(0, 5).map((incident) => (
            <div
              key={incident.id}
              style={{
                padding: 10,
                borderBottom: "1px solid rgba(255,255,255,.08)"
              }}
            >
              <b>{incident.title}</b>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Severity: {incident.severity}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= HIGH EXPOSURE ASSETS ================= */}
      <div className="postureCard">
        <h3>Top Exposure Assets</h3>

        {highExposureAssets.length === 0 ? (
          <div className="muted">No exposure detected.</div>
        ) : (
          highExposureAssets.map(([asset, score]) => (
            <div key={asset} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{asset}</span>
                <b>{score}</b>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= SESSION SUMMARY ================= */}
      <div className="postureCard">
        <h3>Active Sessions</h3>
        <div>
          <b>{sessions.length}</b> active sessions detected.
        </div>
      </div>

      {/* ================= DEVICE ALERTS ================= */}
      <div className="postureCard">
        <h3>Recent Device Alerts</h3>

        {recentAlerts.length === 0 ? (
          <div className="muted">No recent alerts.</div>
        ) : (
          recentAlerts.map((alert, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              {alert.deviceName || "Device"} — {alert.message}
            </div>
          ))
        )}
      </div>

      {/* ================= RECENT AUDIT ================= */}
      <div className="postureCard">
        <h3>Recent Audit Events</h3>

        {recentAudit.length === 0 ? (
          <div className="muted">No recent activity.</div>
        ) : (
          recentAudit.map((event, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              {event.action}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
