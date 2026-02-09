// frontend/src/pages/Reports.jsx
// SOC Reports & Analytics — Phase 1
// Executive-ready reporting & trend visibility
// SAFE: UI-only, builds strictly on platform.css + existing layout

import React, { useEffect, useMemo, useState } from "react";

/* ================= PAGE ================= */

export default function Reports() {
  const [loading, setLoading] = useState(true);

  // Placeholder data until backend reporting APIs are wired
  const [metrics, setMetrics] = useState({
    posture: 82,
    incidents: 14,
    critical: 3,
    resolved: 21,
  });

  const [trends, setTrends] = useState([
    { label: "Security Score", value: "▲ +6%" },
    { label: "Incidents", value: "▼ -12%" },
    { label: "Critical Risks", value: "▼ -1" },
    { label: "MTTR", value: "▲ Improved" },
  ]);

  useEffect(() => {
    // Simulate report load
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const posturePct = useMemo(() => metrics.posture, [metrics]);

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      {/* ================= LEFT: REPORT SUMMARY ================= */}
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Security Reports</h2>
            <small>
              Executive overview and operational reporting
            </small>
          </div>

          <div className="postureScore">
            <div
              className="scoreRing"
              style={{ "--val": posturePct }}
            >
              {posturePct}%
            </div>
            <div className="scoreMeta">
              <b>Posture Score</b>
              <span>{loading ? "Calculating…" : "Current"}</span>
            </div>
          </div>
        </div>

        <div className="meter">
          <div style={{ width: `${posturePct}%` }} />
        </div>

        {/* ===== KPI BLOCK ===== */}
        <div className="coverGrid">
          <div>
            <div className="coverItemTop">
              <b>Total Incidents</b>
              <small>{metrics.incidents}</small>
            </div>
            <div className="coverBar">
              <div style={{ width: "70%" }} />
            </div>
          </div>

          <div>
            <div className="coverItemTop">
              <b>Critical Findings</b>
              <small>{metrics.critical}</small>
            </div>
            <div className="coverBar">
              <div style={{ width: "35%" }} />
            </div>
          </div>

          <div>
            <div className="coverItemTop">
              <b>Resolved Issues</b>
              <small>{metrics.resolved}</small>
            </div>
            <div className="coverBar">
              <div style={{ width: "85%" }} />
            </div>
          </div>

          <div>
            <div className="coverItemTop">
              <b>Risk Reduction</b>
              <small>Positive</small>
            </div>
            <div className="coverBar">
              <div style={{ width: "78%" }} />
            </div>
          </div>
        </div>

        <button style={{ marginTop: 18 }}>
          Export Report (PDF / CSV)
        </button>
      </section>

      {/* ================= RIGHT: TRENDS & GOVERNANCE ================= */}
      <aside className="postureCard">
        <h3>Trends & Governance</h3>
        <p className="muted">
          Directional insight for leadership and audits.
        </p>

        <ul className="list">
          {trends.map((t) => (
            <li key={t.label}>
              <span className="dot ok" />
              <div>
                <b>{t.label}</b>
                <small>{t.value}</small>
              </div>
            </li>
          ))}
        </ul>

        <p className="muted" style={{ marginTop: 14 }}>
          Use the assistant to ask:
          <br />• “How has our security posture changed?”
          <br />• “What should leadership focus on?”
          <br />• “Are we improving quarter over quarter?”
        </p>
      </aside>
    </div>
  );
}
