// frontend/src/pages/manager/ManagerCommand.jsx
// ======================================================
// MANAGER COMMAND CENTER — OPERATIONAL OVERSIGHT
// Read-only • Enforcement visibility
// Scoped by tenant unless admin overrides
// ======================================================

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";
import NotificationList from "../../components/NotificationList.jsx";
import PosturePanel from "../../components/PosturePanel.jsx";
import { useCompany } from "../../context/CompanyContext";

/* ================= HELPERS ================= */

const arr = (v) => (Array.isArray(v) ? v : []);

/* ================= PAGE ================= */

export default function ManagerCommand() {
  const { activeCompanyId, mode } = useCompany();

  const [overview, setOverview] = useState(null);
  const [audit, setAudit] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [postureKey, setPostureKey] = useState(0);

  async function loadRoom() {
    setLoading(true);
    setErr("");

    try {
      const [ov, au, ev, inc] = await Promise.all([
        api.managerOverview(),
        api.managerAudit(200),
        api.managerNotifications(),
        api.incidents(),
      ]);

      setOverview(ov || null);
      setAudit(arr(au));
      setAlerts(arr(ev));
      setIncidents(arr(inc?.incidents));
    } catch (e) {
      setErr(e?.message || "Failed to load manager command center");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoom();
    setPostureKey((k) => k + 1);
  }, []);

  /* ================= FILTERING ================= */

  const scopedAudit = useMemo(() => {
    if (!activeCompanyId) return audit;
    return audit.filter((a) => a.companyId === activeCompanyId);
  }, [audit, activeCompanyId]);

  const scopedAlerts = useMemo(() => {
    if (!activeCompanyId) return alerts;
    return alerts.filter((a) => a.companyId === activeCompanyId);
  }, [alerts, activeCompanyId]);

  /* ================= UI ================= */

  return (
    <div className="grid">

      {/* ================= HEADER ================= */}
      <div className="card">
        <h2>Manager Command Center</h2>

        <div style={{ opacity: 0.6, fontSize: 13 }}>
          Operational oversight • Read-only enforcement visibility
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <button onClick={loadRoom} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh Data"}
          </button>

          <button onClick={() => setPostureKey((k) => k + 1)}>
            Refresh Posture
          </button>
        </div>

        {err && <p className="error" style={{ marginTop: 10 }}>{err}</p>}
      </div>

      {/* ================= POSTURE ================= */}
      <div style={{ gridColumn: "1 / -1" }}>
        <PosturePanel
          key={postureKey}
          title="Operational Security Posture"
          subtitle={
            mode === "global"
              ? "All companies combined"
              : "Scoped company view"
          }
        />
      </div>

      {/* ================= KPIs ================= */}
      {overview && (
        <div className="kpi">
          <div><b>{overview.users ?? 0}</b><span>Users</span></div>
          <div><b>{overview.companies ?? 0}</b><span>Companies</span></div>
          <div><b>{scopedAudit.length}</b><span>Audit Events</span></div>
          <div><b>{scopedAlerts.length}</b><span>Active Alerts</span></div>
        </div>
      )}

      {/* ================= ALERTS ================= */}
      <div className="card">
        <h3>Recent Alerts</h3>
        <NotificationList items={scopedAlerts.slice(0, 10)} />
      </div>

      {/* ================= INCIDENTS ================= */}
      <div className="card">
        <h3>Incidents</h3>

        {incidents.length === 0 && (
          <small className="muted">No incidents reported.</small>
        )}

        {incidents.map((i) => (
          <div
            key={i.id}
            style={{
              padding: "10px 0",
              borderBottom: "1px solid rgba(255,255,255,.08)",
            }}
          >
            <strong>{i.title || "Incident"}</strong>
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              Severity: {i.severity || "unknown"}
            </div>
          </div>
        ))}
      </div>

      {/* ================= AUDIT ================= */}
      <div className="card">
        <h3>Audit Log</h3>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {scopedAudit.slice(0, 20).map((a) => (
                <tr key={a.id}>
                  <td>{a.at ? new Date(a.at).toLocaleString() : ""}</td>
                  <td>{a.action}</td>
                  <td>{a.actorId}</td>
                </tr>
              ))}

              {scopedAudit.length === 0 && (
                <tr>
                  <td colSpan={3}>
                    <small className="muted">No audit events</small>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 8, fontSize: 12, opacity: 0.5 }}>
          Managers operate in read-only enforcement mode.
        </div>
      </div>

    </div>
  );
}
