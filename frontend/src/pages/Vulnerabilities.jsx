// frontend/src/pages/Vulnerabilities.jsx
// SOC Vulnerabilities & Exposures — FINAL SOC BASELINE
// Analyst-first • Priority-driven • Blueprint-aligned
// SAFE: UI-only upgrade using existing platform styles

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

/* ================= HELPERS ================= */

function severityDot(sev) {
  if (sev === "critical") return "bad";
  if (sev === "high") return "warn";
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
          },
          {
            id: "CVE-2023-8812",
            asset: "Production Server",
            severity: "high",
            score: 8.1,
            status: "Open",
          },
          {
            id: "CVE-2022-4431",
            asset: "John Smith",
            severity: "medium",
            score: 6.4,
            status: "Mitigated",
          },
          {
            id: "CVE-2021-9021",
            asset: "AWS S3 Bucket",
            severity: "low",
            score: 3.2,
            status: "Accepted",
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

  const stats = useMemo(() => ({
    total: items.length,
    critical: items.filter(i => i.severity === "critical").length,
    high: items.filter(i => i.severity === "high").length,
    open: items.filter(i => i.status === "Open").length,
  }), [items]);

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
              <h2>Vulnerabilities & Exposures</h2>
              <small>Prioritized weaknesses requiring remediation</small>
            </div>

            <div className="scoreMeta">
              <b>{stats.open} Open</b>
              <span>{stats.critical} Critical • {stats.high} High</span>
            </div>
          </div>

          <div className="list" style={{ marginTop: 20 }}>
            {loading && <p className="muted">Scanning for vulnerabilities…</p>}

            {!loading && items.map(v => (
              <div key={v.id} className="card" style={{ padding: 16 }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }}
                  onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                >
                  <div>
                    <b>{v.id}</b>
                    <small style={{ display: "block", marginTop: 4, color: "var(--p-muted)" }}>
                      Asset: {v.asset} • Status: {v.status}
                    </small>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span className={`dot ${severityDot(v.severity)}`} />
                    <small style={{ display: "block", marginTop: 6, fontSize: 12 }}>
                      {v.severity.toUpperCase()} • CVSS {v.score}
                    </small>
                  </div>
                </div>

                {expanded === v.id && (
                  <div style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: "1px solid var(--p-border)",
                    fontSize: 13
                  }}>
                    <p className="muted">
                      • Known exploitable weakness<br />
                      • Asset exposed to lateral movement<br />
                      • Patch or mitigation recommended
                    </p>
                    <p className="muted">
                      Ask the assistant:<br />
                      – “Is this exploitable?”<br />
                      – “What’s the fastest fix?”
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={load} disabled={loading} style={{ marginTop: 18 }}>
            {loading ? "Rescanning…" : "Run Vulnerability Scan"}
          </button>
        </section>

        {/* ===== RIGHT: RISK CONTEXT ===== */}
        <aside className="postureCard">
          <h3>Exposure Risk</h3>
          <p className="muted">
            Vulnerabilities are the most common breach entry point.
          </p>

          <ul className="list">
            <li>
              <span className="dot bad" />
              <div>
                <b>Immediate Remediation Needed</b>
                <small>Critical CVEs are open</small>
              </div>
            </li>
            <li>
              <span className="dot warn" />
              <div>
                <b>Patch Lag Detected</b>
                <small>Some systems missing updates</small>
              </div>
            </li>
            <li>
              <span className="dot ok" />
              <div>
                <b>Risk Reducing</b>
                <small>Mitigations in progress</small>
              </div>
            </li>
          </ul>

          <p className="muted" style={{ marginTop: 14 }}>
            Ask the assistant:<br />
            • “What should I patch first?”<br />
            • “Which CVEs are exploitable?”
          </p>
        </aside>
      </div>
    </div>
  );
}
