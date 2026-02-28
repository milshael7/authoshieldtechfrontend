import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function money(v) {
  if (v == null) return "—";
  return `$${Number(v).toLocaleString()}`;
}

/* ================= PAGE ================= */

export default function Reports() {
  const [summary, setSummary] = useState({});
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      // ✅ Use EXISTING API methods only
      const [posture, events] = await Promise.all([
        api.postureSummary().catch(() => ({})),
        api.securityEvents().catch(() => ({})),
      ]);

      setSummary(posture || {});
      setIncidents(safeArray(events?.events));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const incidentTrend = useMemo(() => {
    const open = incidents.filter(i => i?.status === "open").length;
    const resolved = incidents.filter(i => i?.status === "resolved").length;
    return { open, resolved };
  }, [incidents]);

  const riskScore = pct(summary?.riskScore ?? summary?.overallRisk ?? 0);
  const complianceScore = pct(summary?.complianceScore ?? 0);

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      <div>
        <h2 style={{ margin: 0 }}>Executive Analytics & Reporting</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Enterprise-level visibility & strategic oversight
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          gap: 18
        }}
      >
        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Enterprise Risk Score
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {riskScore}%
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Compliance Maturity
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {complianceScore}%
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Total Security Events
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {incidents.length}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Estimated Financial Exposure
          </div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {money(summary?.financialExposure)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24
        }}
      >
        <div className="card">
          <h3>Event Distribution</h3>

          <div style={{ marginTop: 20 }}>

            <div style={{ marginBottom: 14 }}>
              <strong>Open</strong>
              <div style={{
                marginTop: 6,
                height: 8,
                background: "rgba(255,255,255,.08)",
                borderRadius: 999,
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${pct(
                    (incidentTrend.open / (incidents.length || 1)) * 100
                  )}%`,
                  height: "100%",
                  background: "linear-gradient(90deg,#ff5a5f,#ffd166)"
                }} />
              </div>
            </div>

            <div>
              <strong>Resolved</strong>
              <div style={{
                marginTop: 6,
                height: 8,
                background: "rgba(255,255,255,.08)",
                borderRadius: 999,
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${pct(
                    (incidentTrend.resolved / (incidents.length || 1)) * 100
                  )}%`,
                  height: "100%",
                  background: "linear-gradient(90deg,#2bd576,#5EC6FF)"
                }} />
              </div>
            </div>

          </div>
        </div>

        <div className="card">
          <h3>Strategic Insights</h3>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <strong>Risk Trajectory</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Monitor long-term enterprise exposure trends.
              </div>
            </div>

            <div>
              <strong>Compliance Readiness</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Assess preparedness for audits & regulatory review.
              </div>
            </div>

            <div>
              <strong>Operational Stability</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Evaluate response effectiveness & resolution speed.
              </div>
            </div>

            <button className="btn" onClick={load} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh Report"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
