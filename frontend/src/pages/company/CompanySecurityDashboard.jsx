// frontend/src/pages/company/CompanySecurityDashboard.jsx
// Corporate Security Control Center
// Company Scoped Risk • Subscription Health • Seat Usage • Incident & Device Awareness

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

function subscriptionColor(status) {
  if (status === "Active") return "#22c55e";
  if (status === "Past Due") return "#ff9800";
  if (status === "Locked") return "#ff4d4f";
  return "#999";
}

export default function CompanySecurityDashboard() {
  const { riskScore, assetExposure, deviceAlerts } = useSecurity();
  const user = getSavedUser();

  const [incidents, setIncidents] = useState([]);
  const [seatStats, setSeatStats] = useState(null);
  const [compliance, setCompliance] = useState(null);

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

  /* ================= LOAD SEAT STATS ================= */
  useEffect(() => {
    async function loadSeats() {
      try {
        const res = await fetch(`${base}/api/entitlements`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setSeatStats(data || null);
      } catch {}
    }
    loadSeats();
  }, [base]);

  /* ================= LOAD COMPLIANCE ================= */
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

  const highExposure = useMemo(() => {
    return Object.entries(assetExposure || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [assetExposure]);

  const riskLevelColor = riskColor(riskScore);

  return (
    <div style={{ padding: 30, display: "flex", flexDirection: "column", gap: 30 }}>

      <div className="sectionTitle">Corporate Security Control Center</div>

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
            ⚠ Elevated corporate risk detected.
          </div>
        )}
      </div>

      {/* ================= SUBSCRIPTION ================= */}
      <div className="postureCard">
        <h3>Subscription Status</h3>

        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: subscriptionColor(user?.subscriptionStatus)
          }}
        >
          {user?.subscriptionStatus || "Unknown"}
        </div>

        {user?.subscriptionStatus === "Past Due" && (
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
            Payment action required to avoid service restriction.
          </div>
        )}

        {user?.subscriptionStatus === "Locked" && (
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
            Access restricted due to subscription status.
          </div>
        )}
      </div>

      {/* ================= SEAT USAGE ================= */}
      <div className="postureCard">
        <h3>Seat Usage</h3>

        {seatStats ? (
          <div>
            <div>Seats Allocated: <b>{seatStats.totalSeats}</b></div>
            <div>Seats Used: <b>{seatStats.usedSeats}</b></div>
            <div>Seats Available: <b>{seatStats.availableSeats}</b></div>
          </div>
        ) : (
          <div className="muted">Seat data unavailable.</div>
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

      {/* ================= DEVICE ALERTS ================= */}
      <div className="postureCard">
        <h3>Recent Device Alerts</h3>

        {deviceAlerts.length === 0 ? (
          <div className="muted">No recent alerts.</div>
        ) : (
          deviceAlerts.slice(0, 5).map((alert, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              {alert.deviceName || "Device"} — {alert.message}
            </div>
          ))
        )}
      </div>

      {/* ================= TOP EXPOSURE ================= */}
      <div className="postureCard">
        <h3>Top Exposure Assets</h3>

        {highExposure.length === 0 ? (
          <div className="muted">No exposure detected.</div>
        ) : (
          highExposure.map(([asset, score]) => (
            <div key={asset} style={{ marginBottom: 6 }}>
              {asset} — <b>{score}</b>
            </div>
          ))
        )}
      </div>

      {/* ================= COMPLIANCE ================= */}
      <div className="postureCard">
        <h3>Compliance Overview</h3>

        {compliance ? (
          <div>
            <div>Score: <b>{compliance.score}</b></div>
            <div>Status: <b>{compliance.status}</b></div>
          </div>
        ) : (
          <div className="muted">Compliance data unavailable.</div>
        )}
      </div>

    </div>
  );
}
