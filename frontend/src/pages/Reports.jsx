import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "—";
  }
}

/* ================= PAGE ================= */

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.reports().catch(() => ({}));
      setReports(safeArray(res?.reports));
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    return {
      total: reports.length,
      critical: reports.filter(r => r?.severity === "critical").length,
      high: reports.filter(r => r?.severity === "high").length,
      informational: reports.filter(r => r?.severity === "info").length,
    };
  }, [reports]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ================= HEADER ================= */}
      <div>
        <h2 style={{ margin: 0 }}>Reports Intelligence Center</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Executive security reports and operational summaries
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
          <div style={{ fontSize: 12, opacity: 0.6 }}>Total Reports</div>
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
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ffd166" }}>
            {summary.high}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Informational</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#5EC6FF" }}>
            {summary.informational}
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

        {/* ================= LEFT: REPORT LIST ================= */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ maxHeight: 520, overflowY: "auto" }}>

            {loading ? (
              <div style={{ padding: 20 }}>Loading reports...</div>
            ) : reports.length === 0 ? (
              <div style={{ padding: 20 }}>No reports available.</div>
            ) : (
              safeArray(reports).map((r, idx) => (
                <div
                  key={r?.id || idx}
                  onClick={() => setSelected(r)}
                  style={{
                    padding: 18,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                    background:
                      selected?.id === r?.id
                        ? "rgba(94,198,255,0.08)"
                        : "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{r?.title || "Security Report"}</strong>

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color:
                          r?.severity === "critical"
                            ? "#ff4d4d"
                            : r?.severity === "high"
                            ? "#ffd166"
                            : "#5EC6FF",
                      }}
                    >
                      {String(r?.severity || "info").toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
                    Created: {formatDate(r?.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ================= RIGHT: DETAIL ================= */}
        <div className="card">
          {selected ? (
            <>
              <h3>{selected?.title}</h3>

              <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 12 }}>
                Created: {formatDate(selected?.createdAt)}
              </div>

              <div style={{ marginBottom: 18 }}>
                {selected?.summary ||
                  "Detailed security analysis and recommendations."}
              </div>

              <button className="btn" style={{ marginBottom: 10 }}>
                Export PDF
              </button>

              <button className="btn" style={{ marginLeft: 10 }}>
                Share with Executive Team
              </button>
            </>
          ) : (
            <div style={{ opacity: 0.6 }}>
              Select a report to view executive summary.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
