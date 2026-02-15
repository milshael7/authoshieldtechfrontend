import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeStr(v, fallback = "—") {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function severityColor(level) {
  switch (String(level).toLowerCase()) {
    case "critical":
      return "#ff4d4d";
    case "high":
      return "#ff884d";
    case "medium":
      return "#ffd166";
    case "low":
      return "#5EC6FF";
    default:
      return "#999";
  }
}

/* ================= PAGE ================= */

export default function Vulnerabilities() {
  const [vulns, setVulns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.vulnerabilities().catch(() => ({}));
      setVulns(safeArray(res?.vulnerabilities));
    } catch {
      setVulns([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    const list = safeArray(vulns);
    return {
      total: list.length,
      critical: list.filter(v => v?.severity === "critical").length,
      high: list.filter(v => v?.severity === "high").length,
      open: list.filter(v => v?.status === "open").length,
    };
  }, [vulns]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ================= HEADER ================= */}
      <div>
        <h2 style={{ margin: 0 }}>Vulnerability Command Center</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          CVE exposure tracking and remediation workflow
        </div>
      </div>

      {/* ================= SUMMARY ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 20,
        }}
      >
        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Total</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{summary.total}</div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Critical</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ff4d4d" }}>
            {summary.critical}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>High</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ff884d" }}>
            {summary.high}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Open</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ffd166" }}>
            {summary.open}
          </div>
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24,
        }}
      >

        {/* ================= LEFT PANEL ================= */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ maxHeight: 520, overflowY: "auto" }}>

            {loading ? (
              <div style={{ padding: 20 }}>Loading vulnerabilities...</div>
            ) : vulns.length === 0 ? (
              <div style={{ padding: 20 }}>No vulnerabilities detected.</div>
            ) : (
              safeArray(vulns).map((v, i) => (
                <div
                  key={v?.id || i}
                  onClick={() => setSelected(v)}
                  style={{
                    padding: 18,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                    background:
                      selected?.id === v?.id
                        ? "rgba(255,77,77,0.08)"
                        : "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{safeStr(v?.title, "Vulnerability")}</strong>

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: severityColor(v?.severity),
                      }}
                    >
                      {safeStr(v?.severity).toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
                    Asset: {safeStr(v?.asset)} • Status: {safeStr(v?.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className="card">
          {selected ? (
            <>
              <h3>{safeStr(selected?.title)}</h3>

              <div style={{ marginBottom: 10 }}>
                <strong>Severity: </strong>
                <span
                  style={{
                    color: severityColor(selected?.severity),
                    fontWeight: 700,
                  }}
                >
                  {safeStr(selected?.severity).toUpperCase()}
                </span>
              </div>

              <div style={{ marginBottom: 10 }}>
                <strong>Status:</strong> {safeStr(selected?.status)}
              </div>

              <div style={{ marginBottom: 10 }}>
                <strong>Asset:</strong> {safeStr(selected?.asset)}
              </div>

              <div style={{ marginBottom: 14 }}>
                <strong>Description:</strong>
                <div style={{ fontSize: 14, opacity: 0.7 }}>
                  {safeStr(selected?.description, "No details available")}
                </div>
              </div>

              <button className="btn" style={{ marginTop: 10 }}>
                Mark as Remediated
              </button>
            </>
          ) : (
            <div style={{ opacity: 0.6 }}>
              Select a vulnerability to review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
