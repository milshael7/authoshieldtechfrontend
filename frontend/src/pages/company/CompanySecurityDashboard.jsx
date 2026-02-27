// frontend/src/pages/company/CompanySecurityDashboard.jsx
// Corporate Security Control Center + Tool Governance
// Hardened Build-Safe Version (No Env Crash)

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
  const { riskScore = 0, assetExposure = {}, deviceAlerts = [] } = useSecurity();
  const user = getSavedUser();

  // 🔒 SAFE ENV HANDLING
  const rawBase = import.meta.env.VITE_API_BASE;
  const base = rawBase ? rawBase.replace(/\/+$/, "") : "";

  const token = getToken();

  const [incidents, setIncidents] = useState([]);
  const [seatStats, setSeatStats] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [seatRequests, setSeatRequests] = useState([]);

  /* ================= SAFE FETCH HELPER ================= */

  async function safeFetch(path, options = {}) {
    if (!base || !token) return null;

    try {
      const res = await fetch(`${base}${path}`, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /* ================= LOAD SEAT REQUESTS ================= */

  useEffect(() => {
    async function loadSeatRequests() {
      const data = await safeFetch("/api/tools/requests/inbox");
      if (data?.inbox) setSeatRequests(data.inbox);
    }
    loadSeatRequests();
  }, []);

  async function forwardRequest(id) {
    await safeFetch(`/api/tools/requests/${id}/forward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "Forwarded by company review" })
    });
  }

  async function denyRequest(id) {
    await safeFetch(`/api/tools/requests/${id}/deny`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: "Denied by company" })
    });
  }

  /* ================= LOAD INCIDENTS ================= */

  useEffect(() => {
    async function loadIncidents() {
      const data = await safeFetch("/api/incidents");
      if (data?.incidents) setIncidents(data.incidents);
    }
    loadIncidents();
  }, []);

  /* ================= LOAD SEAT STATS ================= */

  useEffect(() => {
    async function loadSeats() {
      const data = await safeFetch("/api/entitlements");
      if (data) setSeatStats(data);
    }
    loadSeats();
  }, []);

  /* ================= LOAD COMPLIANCE ================= */

  useEffect(() => {
    async function loadCompliance() {
      const data = await safeFetch("/api/security/compliance");
      if (data) setCompliance(data);
    }
    loadCompliance();
  }, []);

  /* ================= EXPOSURE ================= */

  const highExposure = useMemo(() => {
    return Object.entries(assetExposure || {})
      .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
      .slice(0, 5);
  }, [assetExposure]);

  const riskLevelColor = riskColor(riskScore);

  return (
    <div style={{ padding: 30, display: "flex", flexDirection: "column", gap: 30 }}>
      <div className="sectionTitle">Corporate Security Control Center</div>

      {/* RISK */}
      <div className="postureCard" style={{ border: `1px solid ${riskLevelColor}50` }}>
        <h3>Company Risk Score</h3>
        <div style={{ fontSize: 48, fontWeight: 900, color: riskLevelColor }}>
          {Number(riskScore || 0)}
        </div>
      </div>

      {/* SUBSCRIPTION */}
      <div className="postureCard">
        <h3>Subscription Status</h3>
        <div style={{ fontWeight: 700, color: subscriptionColor(user?.subscriptionStatus) }}>
          {user?.subscriptionStatus || "Unknown"}
        </div>
      </div>

      {/* SEAT REQUESTS */}
      <div className="postureCard">
        <h3>Seat Tool Requests</h3>

        {seatRequests.length === 0 ? (
          <div className="muted">No pending seat requests.</div>
        ) : (
          seatRequests.map(r => (
            <div key={r.id} style={{
              padding: 12,
              marginBottom: 10,
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 8
            }}>
              <div style={{ fontWeight: 600 }}>{r.toolName}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Requested By: {r.requestedBy}
              </div>

              {r.note && (
                <div style={{ fontSize: 12, marginTop: 6, opacity: 0.7 }}>
                  Note: {r.note}
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                <button className="btn small" onClick={() => forwardRequest(r.id)}>
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

      {/* INCIDENTS */}
      <div className="postureCard">
        <h3>Active Incidents</h3>
        {incidents.length === 0 ? (
          <div className="muted">No active incidents.</div>
        ) : (
          incidents.slice(0, 5).map(i => (
            <div key={i.id}><b>{i.title}</b></div>
          ))
        )}
      </div>

      {/* DEVICE ALERTS */}
      <div className="postureCard">
        <h3>Recent Device Alerts</h3>
        {deviceAlerts.length === 0 ? (
          <div className="muted">No recent alerts.</div>
        ) : (
          deviceAlerts.slice(0, 5).map((alert, i) => (
            <div key={i}>
              {alert?.deviceName || "Device"} — {alert?.message || ""}
            </div>
          ))
        )}
      </div>

      {/* EXPOSURE */}
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

      {/* COMPLIANCE */}
      <div className="postureCard">
        <h3>Compliance Overview</h3>
        {compliance ? (
          <div>
            <div>Score: <b>{compliance?.score ?? 0}</b></div>
            <div>Status: <b>{compliance?.status ?? "Unknown"}</b></div>
          </div>
        ) : (
          <div className="muted">Compliance data unavailable.</div>
        )}
      </div>
    </div>
  );
}
