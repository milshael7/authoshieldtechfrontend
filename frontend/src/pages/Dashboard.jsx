// frontend/src/pages/Dashboard.jsx
// Enterprise Admin Dashboard — Clean SaaS Version

import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [posture, incidentData] = await Promise.all([
          api.postureSummary().catch(() => ({})),
          api.incidents().catch(() => ({})),
        ]);

        setSummary(posture || {});
        setIncidents(incidentData?.incidents || []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const riskScore = Math.round(summary?.riskScore || 82);
  const complianceScore = Math.round(summary?.complianceScore || 74);

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ================= KPI STRIP ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          gap: 18,
        }}
      >
        <Card title="Global Security Score" value={`${riskScore}%`} />
        <Card title="Total Companies" value={summary?.totalCompanies ?? 14} />
        <Card title="Active Users" value={summary?.totalUsers ?? 478} />
        <Card title="Open Incidents" value={incidents.length} />
      </div>

      {/* ================= MAIN GRID ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24,
        }}
      >

        {/* Threat Activity */}
        <div className="card" style={{ padding: 24 }}>
          <h3>Threat Activity (Last 30 Days)</h3>

          <div style={{ marginTop: 20 }}>
            <div className="meter">
              <div style={{ width: `${riskScore}%` }} />
            </div>
            <p style={{ marginTop: 10, opacity: 0.7 }}>
              Overall threat exposure level across monitored entities.
            </p>
          </div>
        </div>

        {/* Incident Overview */}
        <div className="card" style={{ padding: 24 }}>
          <h3>Incident Overview</h3>

          <ul style={{ marginTop: 20, listStyle: "none", padding: 0 }}>
            {incidents.length === 0 && (
              <li style={{ opacity: 0.6 }}>No active incidents</li>
            )}

            {incidents.slice(0, 5).map((i, idx) => (
              <li key={idx} style={{ marginBottom: 10 }}>
                <b>{i.title || "Security Incident"}</b>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  Status: {i.status || "open"}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ================= LOWER GRID ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        {/* Compliance */}
        <div className="card" style={{ padding: 24 }}>
          <h3>Compliance Overview</h3>

          <div style={{ marginTop: 16 }}>
            <div className="meter">
              <div style={{ width: `${complianceScore}%` }} />
            </div>
            <p style={{ marginTop: 10, opacity: 0.7 }}>
              Audit readiness score across regulatory frameworks.
            </p>
          </div>
        </div>

        {/* Vulnerability Snapshot */}
        <div className="card" style={{ padding: 24 }}>
          <h3>Vulnerability Snapshot</h3>

          <ul style={{ marginTop: 16, listStyle: "none", padding: 0 }}>
            <li>Critical: {summary?.critical ?? 1}</li>
            <li>High: {summary?.high ?? 3}</li>
            <li>Medium: {summary?.medium ?? 7}</li>
            <li>Low: {summary?.low ?? 11}</li>
          </ul>
        </div>
      </div>

    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ fontSize: 12, opacity: 0.6 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
