// frontend/src/pages/SmallCompanyOverview.jsx
// Small Company Workspace — Limited Organizational Tier
// Scoped to assigned organization
// No compliance engine
// No advanced governance controls
// Clear upgrade path to full Company

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import NotificationList from "../components/NotificationList.jsx";
import PosturePanel from "../components/PosturePanel.jsx";
import { useCompany } from "../context/CompanyContext";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

/* ================= PAGE ================= */

export default function SmallCompanyOverview() {

  const { company } = useCompany();

  const [summary, setSummary] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postureKey, setPostureKey] = useState(0);
  const [err, setErr] = useState("");

  async function loadRoom() {
    setLoading(true);
    setErr("");

    try {
      const [s, n] = await Promise.all([
        api.postureSummary(),
        api.companyNotifications?.() || Promise.resolve([])
      ]);

      setSummary(s || null);
      setNotes(safeArray(n));

    } catch (e) {
      setErr(e?.message || "Failed to load small company workspace");
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
    // eslint-disable-next-line
  }, []);

  const score = useMemo(
    () => pct(summary?.score ?? 72),
    [summary]
  );

  const kpis = useMemo(() => [
    { label: "Employees", value: summary?.users ?? 5 },
    { label: "Devices", value: summary?.devices ?? 6 },
    { label: "Assets", value: summary?.assets ?? 10 },
    { label: "Active Alerts", value: summary?.alerts ?? notes.length }
  ], [summary, notes]);

  const limits = [
    "Up to 5 employees",
    "No compliance frameworks",
    "No internal policy management",
    "Manual security operations only"
  ];

  /* ================= UI ================= */

  return (
    <div className="grid">

      {/* ================= HEADER ================= */}
      <div className="card">
        <h2>Small Organization Security Workspace</h2>

        <div style={{ opacity: 0.6, fontSize: 13 }}>
          Limited operational tier • Internal scope only • Upgrade available
        </div>

        {company && (
          <div style={{ marginTop: 10 }}>
            <small>
              Organization: <b>{company.name}</b>
            </small>
          </div>
        )}

        <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={loadRoom} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh Workspace"}
          </button>

          <button onClick={refreshPosture}>
            Refresh Posture
          </button>
        </div>

        {err && (
          <div style={{ marginTop: 12, color: "#ff5a5f" }}>
            {err}
          </div>
        )}
      </div>

      {/* ================= POSTURE ================= */}
      <div style={{ gridColumn: "1 / -1" }}>
        <PosturePanel
          key={postureKey}
          title="Small Company Security Posture"
          subtitle="Essential protection tier"
        />
      </div>

      {/* ================= SCORE + KPIs ================= */}
      <div className="card">
        <h3>Security Score</h3>

        <div style={{ marginTop: 10 }}>
          <b style={{ fontSize: 32 }}>{score}%</b>
        </div>

        <div style={{ marginTop: 8 }}>
          <div
            style={{
              height: 6,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 999
            }}
          >
            <div
              style={{
                width: `${score}%`,
                height: "100%",
                borderRadius: 999,
                background: "#5EC6FF"
              }}
            />
          </div>
        </div>

        <div style={{
          marginTop: 20,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          gap: 16
        }}>
          {kpis.map(k => (
            <div key={k.label}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                {k.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {k.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= PLAN LIMITS ================= */}
      <div className="card">
        <h3>Current Plan Limits</h3>

        <ul style={{ marginTop: 12 }}>
          {limits.map(l => (
            <li key={l} style={{ marginBottom: 8 }}>
              {l}
            </li>
          ))}
        </ul>
      </div>

      {/* ================= NOTIFICATIONS ================= */}
      <div className="card">
        <h3>Organization Notifications</h3>

        {notes.length === 0 && (
          <div style={{ opacity: 0.6 }}>
            {loading ? "Loading…" : "No alerts detected."}
          </div>
        )}

        <NotificationList items={notes} />
      </div>

      {/* ================= UPGRADE BLOCK ================= */}
      <div className="card">
        <h3>Upgrade to Full Company</h3>

        <div style={{ opacity: 0.7, fontSize: 13 }}>
          Unlock compliance modules, unlimited employees,
          advanced reporting, and governance automation.
        </div>

        <button style={{ marginTop: 18 }}>
          Upgrade to Company
        </button>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.5 }}>
          Your data remains intact during upgrade.
        </div>
      </div>

    </div>
  );
}
