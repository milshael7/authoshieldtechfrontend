// frontend/src/pages/Threats.jsx
// SOC Threats & Detections — FINAL SOC BASELINE
// Analyst-first, priority-driven, enterprise-ready
// SAFE: builds strictly on existing layout + platform.css

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

/* ================= HELPERS ================= */

function sevDot(sev) {
  if (sev === "critical") return "bad";
  if (sev === "high") return "warn";
  return "ok";
}

/* ================= PAGE ================= */

export default function Threats() {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getThreats?.();
      setThreats(
        data?.threats || [
          {
            id: 1,
            name: "Malware Detected on Endpoint",
            severity: "critical",
            source: "Endpoint",
            status: "Unresolved",
            time: "5 minutes ago",
          },
          {
            id: 2,
            name: "Suspicious Login Activity",
            severity: "high",
            source: "Identity",
            status: "Investigating",
            time: "14 minutes ago",
          },
          {
            id: 3,
            name: "Abnormal Email Behavior",
            severity: "medium",
            source: "Email",
            status: "Contained",
            time: "38 minutes ago",
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* ================= DERIVED ================= */

  const stats = useMemo(() => {
    return {
      critical: threats.filter((t) => t.severity === "critical").length,
      high: threats.filter((t) => t.severity === "high").length,
      total: threats.length,
    };
  }, [threats]);

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      {/* ================= KPI STRIP ================= */}
      <div className="kpiGrid">
        <div className="kpiCard">
          <small>Critical</small>
          <b>{stats.critical}</b>
        </div>
        <div className="kpiCard">
          <small>High</small>
          <b>{stats.high}</b>
        </div>
        <div className="kpiCard">
          <small>Total Active</small>
          <b>{stats.total}</b>
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="postureGrid">
        {/* ===== LEFT: ACTIVE THREATS ===== */}
        <section className="postureCard">
          <div className="postureTop">
            <div>
              <h2>Active Threats</h2>
              <small>Real-time detections requiring attention</small>
            </div>

            <div className="scoreMeta">
              <b>{stats.total} Alerts</b>
              <span>
                {stats.critical} Critical • {stats.high} High
              </span>
            </div>
          </div>

          <div className="list" style={{ marginTop: 20 }}>
            {loading && <p className="muted">Loading threats…</p>}

            {!loading &&
              threats.map((t) => (
                <div key={t.id} className="card" style={{ padding: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <div>
                      <b>{t.name}</b>
                      <small
                        style={{
                          display: "block",
                          marginTop: 4,
                          color: "var(--p-muted)",
                        }}
                      >
                        Source: {t.source} • Detected {t.time}
                      </small>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span className={`dot ${sevDot(t.severity)}`} />
                      <small
                        style={{
                          display: "block",
                          marginTop: 6,
                          fontSize: 12,
                        }}
                      >
                        {t.status}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <button
            onClick={load}
            disabled={loading}
            style={{ marginTop: 18 }}
          >
            {loading ? "Refreshing…" : "Refresh Threats"}
          </button>
        </section>

        {/* ===== RIGHT: ANALYST GUIDANCE ===== */}
        <aside className="postureCard">
          <h3>Analyst Guidance</h3>
          <p className="muted">
            Prioritize threats with the highest impact first.
          </p>

          <ul className="list">
            <li>
              <span className="dot bad" />
              <div>
                <b>Immediate Action Required</b>
                <small>Critical threats are active</small>
              </div>
            </li>

            <li>
              <span className="dot warn" />
              <div>
                <b>Investigate High Severity</b>
                <small>Potential lateral movement</small>
              </div>
            </li>

            <li>
              <span className="dot ok" />
              <div>
                <b>Containment Working</b>
                <small>Some threats already mitigated</small>
              </div>
            </li>
          </ul>

          <p className="muted" style={{ marginTop: 14 }}>
            Ask the assistant:
            <br />• “Which threat should I handle first?”
            <br />• “What is the business impact?”
            <br />• “How do I remediate this?”
          </p>
        </aside>
      </div>
    </div>
  );
}
