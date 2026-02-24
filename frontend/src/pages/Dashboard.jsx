// frontend/src/pages/Dashboard.jsx
// Enterprise Admin Dashboard — resilient build (dashboard never acts like a sensor)

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  // Executive
  const [metrics, setMetrics] = useState(null);
  const [risk, setRisk] = useState(null);
  const [predictive, setPredictive] = useState(null);

  // Security
  const [posture, setPosture] = useState(null);
  const [events, setEvents] = useState([]);
  const [vulns, setVulns] = useState([]);

  // Incidents
  const [incidents, setIncidents] = useState([]);

  // Non-blocking status (per-module)
  const [moduleStatus, setModuleStatus] = useState({
    adminMetrics: "loading",
    adminExecutiveRisk: "loading",
    adminPredictiveChurn: "loading",
    postureSummary: "loading",
    securityEvents: "loading",
    vulnerabilities: "loading",
    incidents: "loading",
  });

  const [lastUpdated, setLastUpdated] = useState(null);

  async function loadAll() {
    // Dashboard should NEVER crash if one call fails.
    const tasks = [
      ["adminMetrics", api.adminMetrics()],
      ["adminExecutiveRisk", api.adminExecutiveRisk()],
      ["adminPredictiveChurn", api.adminPredictiveChurn()],
      ["postureSummary", api.postureSummary()],
      ["securityEvents", api.securityEvents(50)],
      ["vulnerabilities", api.vulnerabilities()],
      ["incidents", api.incidents()],
    ];

    const results = await Promise.allSettled(tasks.map((t) => t[1]));

    const nextStatus = { ...moduleStatus };

    results.forEach((res, idx) => {
      const key = tasks[idx][0];
      nextStatus[key] = res.status === "fulfilled" ? "ok" : "error";

      if (res.status !== "fulfilled") {
        console.warn(`[Dashboard] ${key} failed:`, res.reason);
        return;
      }

      const data = res.value;

      switch (key) {
        case "adminMetrics":
          setMetrics(data?.metrics || null);
          break;

        case "adminExecutiveRisk":
          // backend might return { executiveRisk: { score, level } } or other shape
          setRisk(data?.executiveRisk || data?.risk || null);
          break;

        case "adminPredictiveChurn":
          setPredictive(data?.predictiveChurn || null);
          break;

        case "postureSummary":
          // some APIs return {summary}, some return summary directly
          setPosture(data?.summary || data || null);
          break;

        case "securityEvents":
          setEvents(data?.events || data || []);
          break;

        case "vulnerabilities":
          setVulns(data?.vulnerabilities || data || []);
          break;

        case "incidents":
          setIncidents(data?.incidents || data || []);
          break;

        default:
          break;
      }
    });

    setModuleStatus(nextStatus);
    setLastUpdated(new Date());
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eventSeverity = useMemo(() => {
    const map = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const e of events) {
      const s = String(e.severity || e.level || "").toLowerCase();
      if (s.includes("crit")) map.critical++;
      else if (s.includes("high")) map.high++;
      else if (s.includes("med")) map.medium++;
      else map.low++;
    }
    return map;
  }, [events]);

  const openIncidents = incidents.filter((i) => i.status !== "Closed");

  const offlineModules = Object.entries(moduleStatus)
    .filter(([, v]) => v === "error")
    .map(([k]) => k);

  if (loading) {
    // still show something — not a scary “platform unavailable”
    return <div style={{ padding: 28 }}>Loading dashboard modules…</div>;
  }

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 22 }}>
      {/* Non-blocking warning (Dashboard is NOT the sensor) */}
      {offlineModules.length > 0 && (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,0,0,.25)",
            background: "rgba(255,0,0,.08)",
            fontSize: 12,
          }}
        >
          <b>Some modules are temporarily offline:</b>{" "}
          {offlineModules.join(", ")}. <span style={{ opacity: 0.8 }}>
            Dashboard will keep running; sensor handles connectivity.
          </span>
        </div>
      )}

      {/* ================= EXECUTIVE SNAPSHOT ================= */}
      <Panel title="Executive Snapshot">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <KPI label="Total Users" value={metrics?.totalUsers} status={moduleStatus.adminMetrics} />
          <KPI label="Active Subscribers" value={metrics?.activeSubscribers} status={moduleStatus.adminMetrics} />
          <KPI label="Total Revenue" value={fmtMoney(metrics?.totalRevenue)} status={moduleStatus.adminMetrics} />
          <KPI label="Executive Risk" value={risk?.score ?? risk?.riskScore} status={moduleStatus.adminExecutiveRisk} />
          <KPI label="Churn Risk" value={predictive?.riskLevel ?? predictive?.level} status={moduleStatus.adminPredictiveChurn} />
        </div>
      </Panel>

      {/* ================= SOC THREAT STREAM ================= */}
      <Panel title="Live Threat Intelligence (Auto-Refreshing)">
        <SeverityBar counts={eventSeverity} />
        <div style={{ marginTop: 14, maxHeight: 240, overflowY: "auto" }}>
          {events.slice(0, 30).map((e, i) => (
            <div key={i} style={eventRow(e.severity || e.level)}>
              <strong>{e.severity || e.level || "INFO"}</strong>
              <span style={{ marginLeft: 12 }}>{e.title || e.message || e.description || "Security Event"}</span>
            </div>
          ))}
          {events.length === 0 && (
            <div style={{ padding: "10px 0", opacity: 0.6, fontSize: 13 }}>
              No events yet. If the sensor is green, the stream is live — it’s just quiet right now.
            </div>
          )}
        </div>
      </Panel>

      {/* ================= INCIDENT COMMAND CENTER ================= */}
      <Panel title="Incident Command Center">
        <div style={{ marginBottom: 10 }}>
          Open Incidents: <strong>{openIncidents.length}</strong>
        </div>

        <div style={{ maxHeight: 220, overflowY: "auto" }}>
          {incidents.slice(0, 20).map((inc, i) => (
            <div key={i} style={incidentRow(inc.status)}>
              <strong>{inc.title || "Untitled Incident"}</strong>
              <span style={{ marginLeft: 12 }}>
                {inc.severity || "Unknown"} — {inc.status}
              </span>
            </div>
          ))}
          {incidents.length === 0 && (
            <div style={{ padding: "10px 0", opacity: 0.6, fontSize: 13 }}>
              No incidents currently. (Quiet is good.)
            </div>
          )}
        </div>
      </Panel>

      {/* ================= POSTURE + VULNS ================= */}
      <Panel title="Security Posture">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <KPI label="Risk Score" value={posture?.riskScore} status={moduleStatus.postureSummary} />
          <KPI label="Compliance Score" value={posture?.complianceScore} status={moduleStatus.postureSummary} />
          <KPI label="Critical Vulns" value={countBySeverity(vulns, "critical")} status={moduleStatus.vulnerabilities} />
          <KPI label="High Vulns" value={countBySeverity(vulns, "high")} status={moduleStatus.vulnerabilities} />
        </div>
      </Panel>

      {lastUpdated && (
        <div style={{ fontSize: 12, opacity: 0.55 }}>
          Auto Refreshed: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

/* ================= COMPONENTS ================= */

function Panel({ title, children }) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 14,
        background: "rgba(255,255,255,.03)",
        border: "1px solid rgba(255,255,255,.08)",
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function KPI({ label, value, status }) {
  const isOffline = status === "error";
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(255,255,255,.02)",
        opacity: isOffline ? 0.55 : 1,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>
        {isOffline ? "—" : value ?? "—"}
      </div>
      {isOffline && <div style={{ fontSize: 11, opacity: 0.6 }}>module offline</div>}
    </div>
  );
}

function SeverityBar({ counts }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

  return (
    <div style={{ display: "flex", height: 18, borderRadius: 999, overflow: "hidden" }}>
      {Object.entries(counts).map(([k, v], i) => (
        <div
          key={i}
          style={{
            width: `${(v / total) * 100}%`,
            background:
              k === "critical" ? "#ff3b30" : k === "high" ? "#ff9500" : k === "medium" ? "#f5b400" : "#16c784",
          }}
        />
      ))}
    </div>
  );
}

function eventRow(severity) {
  const color =
    String(severity).toLowerCase().includes("crit")
      ? "#ff3b30"
      : String(severity).toLowerCase().includes("high")
      ? "#ff9500"
      : String(severity).toLowerCase().includes("med")
      ? "#f5b400"
      : "#16c784";

  return {
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,.06)",
    fontSize: 13,
    color,
  };
}

function incidentRow(status) {
  const color =
    status === "Open"
      ? "#ff3b30"
      : status === "Investigating"
      ? "#ff9500"
      : status === "Resolved"
      ? "#16c784"
      : "#fff";

  return {
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,.06)",
    fontSize: 13,
    color,
  };
}

function countBySeverity(list, sev) {
  return (list || []).filter((v) => String(v?.severity || "").toLowerCase() === sev).length;
}

function fmtMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `$${x.toLocaleString()}`;
}
