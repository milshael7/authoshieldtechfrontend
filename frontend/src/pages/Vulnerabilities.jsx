// frontend/src/pages/Vulnerabilities.jsx
// SOC Vulnerabilities & Exposure Management — SOC BASELINE (UPGRADED)
// Prevention-focused • Human-driven remediation • Blueprint-aligned
//
// SAFE:
// - Full file replacement
// - UI only
// - No automation
// - No AI wording
// - AutoDev 6.5 compatible (observe + recommend, never act)

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

/* ================= HELPERS ================= */

function severityDot(sev) {
  if (sev === "critical") return "bad";
  if (sev === "high") return "warn";
  if (sev === "medium") return "warn";
  return "ok";
}

/* ================= PAGE ================= */

export default function Vulnerabilities() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getVulnerabilities?.();
      setItems(
        data?.items || [
          {
            id: "CVE-2024-1123",
            asset: "Workstation-023",
            severity: "critical",
            score: 9.8,
            status: "Open",
            scope: "company",
          },
          {
            id: "CVE-2023-8812",
            asset: "Production Server",
            severity: "high",
            score: 8.1,
            status: "Open",
            scope: "company",
          },
          {
            id: "CVE-2022-4431",
            asset: "Finance Server",
            severity: "medium",
            score: 6.4,
            status: "Mitigated",
            scope: "small-company",
          },
          {
            id: "CVE-2021-9021",
            asset: "User Mailbox",
            severity: "low",
            score: 3.2,
            status: "Accepted",
            scope: "individual",
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

  const stats = useMemo(
    () => ({
      total: items.length,
      critical: items.filter((i) => i.severity === "critical").length,
      high: items.filter((i) => i.severity === "high").length,
      open: items.filter((i) => i.status === "Open").length,
    }),
    [items]
  );

  const prioritized = useMemo(() => {
    const order = { critical: 3, high: 2, medium: 1, low: 0 };
    return [...items].sort(
      (a, b) =>
        (order[b.severity] || 0) - (order[a.severity] || 0)
    );
  }, [items]);

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      {/* ================= KPI STRIP ================= */}
      <div className="kpiGrid">
        <div className="kpiCard">
          <small>Total CVEs</small>
          <b>{stats.total}</b>
        </div>
        <div className="kpiCard">
          <small>Critical</small>
          <b>{stats.critical}</b>
        </div>
        <div className="kpiCard">
          <small>High</small>
          <b>{stats.high}</b>
        </div>
        <div className="kpiCard">
          <small>Open</small>
          <b>{stats.open}</b>
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="postureGrid">
        {/* ===== LEFT: VULNERABILITY LIST ===== */}
        <section className="postureCard">
          <div className="postureTop">
            <div>
              <h2>Vulnerabilities & Exposure</h2>
              <small>
                Preventive weaknesses requiring remediation
              </small>
            </div>

            <div className="scoreMeta">
              <b>{stats.open} Open</b>
              <span>
                {stats.critical} Critical • {stats.high} High
              </span>
            </div>
          </div>

          <div className="list" style={{ marginTop: 20 }}>
            {loading && (
              <p className="muted">
                Scanning environment for vulnerabilities…
              </p>
            )}

            {!loading &&
              prioritized.map((v) => (
                <div key={v.id} className="card" style={{ padding: 16 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 14,
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      setExpanded(
                        expanded === v.id ? null : v.id
                      )
                    }
                  >
                    <span
                      className={`dot ${severityDot(v.severity)}`}
                    />

                    <div>
                      <b>{v.id}</b>
                      <small
                        style={{
                          display: "block",
                          marginTop: 4,
                          color: "var(--p-muted)",
                        }}
                      >
                        Asset: {v.asset}
                      </small>
                      <small
                        style={{
                          display: "block",
                          marginTop: 2,
                          fontSize: 12,
                          color: "var(--p-muted)",
                        }}
                      >
                        Status: {v.status} • Scope: {v.scope}
                      </small>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <small
                        style={{
                          display: "block",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        CVSS {v.score}
                      </small>
                      <small
                        style={{
                          display: "block",
                          marginTop: 6,
                          fontSize: 12,
                        }}
                      >
                        {v.severity.toUpperCase()}
                      </small>
                    </div>
                  </div>

                  {/* ===== EXPANDED DETAILS ===== */}
                  {expanded === v.id && (
                    <div
                      style={{
                        marginTop: 14,
                        paddingTop: 14,
                        borderTop:
                          "1px solid var(--p-border)",
                        fontSize: 13,
                      }}
                    >
                      <p className="muted">
                        • Known exploitable weakness
                        <br />
                        • Could enable privilege escalation
                        <br />
                        • Patch or mitigation required
                      </p>

                      <p className="muted">
                        Recommended actions:
                        <br />– Apply vendor patch
                        <br />– Restrict exposure
                        <br />– Validate remediation
                      </p>

                      <p className="muted">
                        Ask the assistant:
                        <br />– “Is this exploitable?”
                        <br />– “What’s the safest fix?”
                      </p>
                    </div>
                  )}
                </div>
              ))}
          </div>

          <button
            onClick={load}
            disabled={loading}
            style={{ marginTop: 18 }}
          >
            {loading ? "Rescanning…" : "Run Vulnerability Scan"}
          </button>
        </section>

        {/* ===== RIGHT: RISK CONTEXT ===== */}
        <aside className="postureCard">
          <h3>Exposure Risk</h3>
          <p className="muted">
            Vulnerabilities are the most common breach entry
            point.
          </p>

          <ul className="list">
            <li>
              <span className="dot bad" />
              <div>
                <b>Immediate Remediation Required</b>
                <small>Critical CVEs are open</small>
              </div>
            </li>

            <li>
              <span className="dot warn" />
              <div>
                <b>Patch Gaps Detected</b>
                <small>Systems missing updates</small>
              </div>
            </li>

            <li>
              <span className="dot ok" />
              <div>
                <b>Risk Trending Down</b>
                <small>Mitigations in progress</small>
              </div>
            </li>
          </ul>

          <p className="muted" style={{ marginTop: 14 }}>
            Ask the assistant:
            <br />• “What should I patch first?”
            <br />• “Which CVEs are exploitable?”
          </p>
        </aside>
      </div>
    </div>
  );
}
