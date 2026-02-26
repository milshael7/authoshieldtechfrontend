// frontend/src/pages/company/CompanySecurityDashboard.jsx
// Corporate Security Control Center + Tool Governance

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
  const base = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

  const [incidents, setIncidents] = useState([]);
  const [seatStats, setSeatStats] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [seatRequests, setSeatRequests] = useState([]);

  /* ================= LOAD SEAT REQUESTS ================= */
  async function loadSeatRequests() {
    try {
      const res = await fetch(`${base}/api/tools/requests/inbox`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setSeatRequests(data.inbox || []);
    } catch {}
  }

  useEffect(() => {
    loadSeatRequests();
  }, []);

  async function forwardRequest(id) {
    await fetch(`${base}/api/tools/requests/${id}/forward`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ note: "Forwarded by company review" })
    });
    loadSeatRequests();
  }

  async function denyRequest(id) {
    await fetch(`${base}/api/tools/requests/${id}/deny`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ note: "Denied by company" })
    });
    loadSeatRequests();
  }

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
  }, []);

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
  }, []);

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
  }, []);

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
      <div className="postureCard" style={{ border: `1px solid ${riskLevelColor}50` }}>
        <h3>Company Risk Score</h3>
        <div style={{ fontSize: 48, fontWeight: 900, color: riskLevelColor }}>
          {Number(riskScore || 0)}
        </div>
      </div>

      {/* ================= SUBSCRIPTION ================= */}
      <div className="postureCard">
        <h3>Subscription Status</h3>
        <div style={{ fontWeight: 700, color: subscriptionColor(user?.subscriptionStatus) }}>
          {user?.subscriptionStatus || "Unknown"}
        </div>
      </div>

      {/* ================= SEAT TOOL REQUESTS ================= */}
      <div className="postureCard">
        <h3>Seat Tool Requests</h3>

        {seatRequests.length === 0 ? (
          <div className="muted">No pending seat requests.</div>
        ) : (
          seatRequests.map(r => (
            <div
              key={r.id}
              style={{
                padding: 12,
                marginBottom: 10,
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 8
              }}
            >
              <div style={{ fontWeight: 600 }}>
                {r.toolName}
              </div>

              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Requested By: {r.requestedBy}
              </div>

              {r.note && (
                <div style={{ fontSize: 12, marginTop: 6, opacity: 0.7 }}>
                  Note: {r.note}
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                <button
                  className="btn small"
                  onClick={() => forwardRequest(r.id)}
                >
                  Forward
                </button>

                <button
                  className="btn small muted"
                  style={{ marginLeft: 8 }}
                  onClick={() => denyRequest(r.id)}
                >
                  Deny
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= INCIDENTS ================= */}
      <div className="postureCard">
        <h3>Active Incidents</h3>
        {incidents.length === 0 ? (
          <div className="muted">No active incidents.</div>
        ) : (
          incidents.slice(0, 5).map(incident => (
            <div key={incident.id}>
              <b>{incident.title}</b>
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
            <div key={i}>
              {alert.deviceName || "Device"} — {alert.message}
            </div>
          ))
        )}
      </div>

      {/* ================= EXPOSURE ================= */}
      <div className="postureCard">
        <h3>Top Exposure Assets</h3>
        {highExposure.length === 0 ? (
          <div className="muted">No exposure detected.</div>
        ) : (
          highExposure.map(([asset, score]) => (
            <div key={asset}>
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
