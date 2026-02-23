import React, { useEffect, useMemo, useState } from "react";
import { api, getSavedUser } from "../lib/api.js";

/* ================= HELPERS ================= */

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function scoreFrom(checks = []) {
  if (!checks.length) return 0;
  const val = checks.reduce((s, c) => {
    if (c?.status === "ok") return s + 1;
    if (c?.status === "warn") return s + 0.5;
    return s;
  }, 0);
  return Math.round((val / checks.length) * 100);
}

/* ================= PAGE ================= */

export default function Posture() {
  const user = getSavedUser();
  const role = String(user?.role || "").toLowerCase();
  const isIndividual = role === "individual";

  const [summary, setSummary] = useState({});
  const [checks, setChecks] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    async function load() {
      try {
        const [s, c, i] = await Promise.all([
          api.postureSummary().catch(() => ({})),
          api.postureChecks().catch(() => ({})),
          api.incidents().catch(() => ({})),
        ]);

        setSummary(s || {});
        setChecks(c?.checks || []);
        setIncidents(i?.incidents || []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const score = useMemo(() => scoreFrom(checks), [checks]);
  const complianceScore = pct(summary?.complianceScore ?? 74);

  /* =====================================================
     INDIVIDUAL VIEW (unchanged logic)
  ===================================================== */

  if (isIndividual) {
    return (
      <div style={{ padding: 32 }}>
        <h2>Personal Security Overview</h2>
        <div className="card" style={{ padding: 28, marginTop: 20 }}>
          <div className="meter">
            <div style={{ width: `${pct(score)}%` }} />
          </div>
          <p style={{ marginTop: 10 }}>
            Overall security posture: {pct(score)}%
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     ENTERPRISE ADMIN / MANAGER VIEW
  ===================================================== */

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
        <StatCard title="Global Security Score" value={`${pct(score)}%`} />
        <StatCard title="Total Companies" value={summary?.totalCompanies ?? 14} />
        <StatCard title="Total Users" value={summary?.totalUsers ?? 482} />
        <StatCard title="Open Incidents" value={incidents.length} />
      </div>

      {/* ================= MAIN GRID ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24,
        }}
      >

        {/* Threat Exposure */}
        <div className="card" style={{ padding: 24 }}>
          <h3>Threat Exposure Overview</h3>

          <div style={{ marginTop: 20 }}>
            <div className="meter">
              <div style={{ width: `${pct(score)}%` }} />
            </div>
            <p style={{ marginTop: 10, opacity: 0.7 }}>
              Aggregated risk score across monitored environments.
            </p>
          </div>
        </div>

        {/* Incident Snapshot */}
        <div className="card" style={{ padding: 24 }}>
          <h3>Incident Snapshot</h3>

          {incidents.length === 0 && (
            <p style={{ marginTop: 20, opacity: 0.6 }}>
              No active incidents.
            </p>
          )}

          <ul style={{ marginTop: 16, padding: 0, listStyle: "none" }}>
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
          <h3>Compliance Readiness</h3>

          <div style={{ marginTop: 16 }}>
            <div className="meter">
              <div style={{ width: `${complianceScore}%` }} />
            </div>
            <p style={{ marginTop: 10, opacity: 0.7 }}>
              Current regulatory alignment progress.
            </p>
          </div>
        </div>

        {/* Vulnerability Snapshot */}
        <div className="card" style={{ padding: 24 }}>
          <h3>Vulnerability Snapshot</h3>

          <ul style={{ marginTop: 16, padding: 0, listStyle: "none" }}>
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

function StatCard({ title, value }) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ fontSize: 12, opacity: 0.6 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
