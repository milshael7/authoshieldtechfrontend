// frontend/src/pages/Manager.jsx
// GLOBAL OPERATIONAL OVERSIGHT CENTER
// Manager = enforcement visibility layer
// Admin supersedes Manager

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import PosturePanel from "../components/PosturePanel.jsx";
import CompanySelector from "../components/CompanySelector.jsx";
import { useCompany } from "../context/CompanyContext";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeStr(v, fallback = "—") {
  return typeof v === "string" && v.trim() ? v : fallback;
}

/* ================= PAGE ================= */

export default function Manager() {
  const { activeCompanyId, mode } = useCompany();

  const [overview, setOverview] = useState(null);
  const [audit, setAudit] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [postureKey, setPostureKey] = useState(0);

  async function loadRoom() {
    setLoading(true);
    setErr("");

    try {
      const [ov, au, no, co] = await Promise.all([
        api.managerOverview(),
        api.managerAudit(200),
        api.managerNotifications?.() || Promise.resolve([]),
        api.adminCompanies?.() || Promise.resolve([]),
      ]);

      setOverview(ov || null);
      setAudit(safeArray(au));
      setNotifications(safeArray(no));
      setCompanies(safeArray(co));
    } catch (e) {
      setErr(e?.message || "Failed to load manager oversight data");
    } finally {
      setLoading(false);
    }
  }

  function refreshPosture() {
    setPostureKey((k) => k + 1);
  }

  useEffect(() => {
    loadRoom();
    refreshPosture();
  }, []);

  /* ================= COMPANY SCOPED FILTERING ================= */

  const filteredAudit = useMemo(() => {
    if (!activeCompanyId) return audit;
    return audit.filter(ev => ev.companyId === activeCompanyId);
  }, [audit, activeCompanyId]);

  const filteredNotifications = useMemo(() => {
    if (!activeCompanyId) return notifications;
    return notifications.filter(n => n.companyId === activeCompanyId);
  }, [notifications, activeCompanyId]);

  const severityStats = useMemo(() => {
    const base = { critical: 0, high: 0, medium: 0, low: 0 };
    filteredNotifications.forEach((n) => {
      if (base[n?.severity] !== undefined) {
        base[n.severity]++;
      }
    });
    return base;
  }, [filteredNotifications]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 32 }}>

      {/* HEADER */}
      <div className="card">
        <h2 style={{ margin: 0 }}>
          Operational Oversight — {mode === "global" ? "All Companies" : "Scoped Company"}
        </h2>

        <div style={{ opacity: 0.65, fontSize: 13 }}>
          Enforcement visibility • Read-only control layer
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn" onClick={loadRoom} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh Data"}
          </button>

          <button className="btn" onClick={refreshPosture}>
            Refresh Posture
          </button>
        </div>

        {err && (
          <div style={{ marginTop: 14, color: "#ff5a5f" }}>
            {err}
          </div>
        )}
      </div>

      {/* 🔥 COMPANY SELECTOR */}
      <div className="card">
        <CompanySelector companies={companies} />
      </div>

      {/* POSTURE SNAPSHOT */}
      <PosturePanel
        key={postureKey}
        title="Security Posture Snapshot"
        subtitle={mode === "global"
          ? "All companies combined"
          : "Scoped company only"}
      />

      {/* KPI STRIP */}
      {overview && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 20
          }}
        >
          <div className="card">
            <div style={{ fontSize: 12, opacity: 0.6 }}>Total Users</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>
              {overview.users ?? 0}
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, opacity: 0.6 }}>Companies</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>
              {overview.companies ?? 0}
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, opacity: 0.6 }}>Audit Events</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>
              {filteredAudit.length}
            </div>
          </div>

          <div className="card">
            <div style={{ fontSize: 12, opacity: 0.6 }}>Active Alerts</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>
              {filteredNotifications.length}
            </div>
          </div>
        </div>
      )}

      {/* ALERT DISTRIBUTION */}
      <div className="card">
        <h3>Alert Severity Distribution</h3>

        {Object.entries(severityStats).map(([level, count]) => (
          <div key={level} style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span>{level.toUpperCase()}</span>
              <span>{count}</span>
            </div>

            <div
              style={{
                marginTop: 6,
                height: 6,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 999,
              }}
            >
              <div
                style={{
                  width: `${filteredNotifications.length
                    ? Math.round((count / filteredNotifications.length) * 100)
                    : 0}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: "#5EC6FF",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* NOTIFICATIONS */}
      <div className="card">
        <h3>Recent Alerts</h3>

        {filteredNotifications.length === 0 && (
          <div style={{ opacity: 0.6 }}>
            {loading ? "Loading…" : "No alerts detected."}
          </div>
        )}

        {filteredNotifications.slice(0, 12).map((n) => (
          <div
            key={n.id}
            style={{
              marginTop: 14,
              paddingBottom: 14,
              borderBottom: "1px solid rgba(255,255,255,.08)"
            }}
          >
            <strong>{safeStr(n.title)}</strong>
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              {safeStr(n.message)}
            </div>
            <div style={{ fontSize: 11, opacity: 0.45 }}>
              {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
            </div>
          </div>
        ))}
      </div>

      {/* AUDIT TABLE */}
      <div className="card">
        <h3>Operational Audit Log</h3>

        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", opacity: 0.6 }}>
                <th>Time</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Target</th>
              </tr>
            </thead>
            <tbody>
              {filteredAudit.slice(0, 25).map((ev, i) => (
                <tr key={ev.id || i}>
                  <td style={{ padding: "8px 0" }}>
                    {ev.at ? new Date(ev.at).toLocaleString() : ""}
                  </td>
                  <td>{safeStr(ev.action)}</td>
                  <td>{safeStr(ev.actorId)}</td>
                  <td>
                    {safeStr(ev.targetType)}:{safeStr(ev.targetId)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, opacity: 0.55, fontSize: 12 }}>
          Managers operate in read-only enforcement mode.
        </div>
      </div>

    </div>
  );
}
