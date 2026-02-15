import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

/* ================= PAGE ================= */

export default function Compliance() {
  const [frameworks, setFrameworks] = useState([]);
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.complianceOverview().catch(() => ({}));
      setFrameworks(safeArray(res?.frameworks));
      setControls(safeArray(res?.controls));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const failedControls = useMemo(
    () => controls.filter(c => c?.status === "failed"),
    [controls]
  );

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* HEADER */}
      <div>
        <h2 style={{ margin: 0 }}>Compliance & Audit Command</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Regulatory readiness and control coverage
        </div>
      </div>

      {/* FRAMEWORK STATUS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20
        }}
      >
        {frameworks.map((fw) => (
          <div key={fw.name} className="card" style={{ padding: 22 }}>
            <div style={{ fontWeight: 700 }}>{fw.name}</div>

            <div
              style={{
                marginTop: 12,
                height: 8,
                background: "rgba(255,255,255,.08)",
                borderRadius: 999,
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  width: `${pct(fw.coverage)}%`,
                  height: "100%",
                  background: "linear-gradient(90deg,#5EC6FF,#7aa2ff)"
                }}
              />
            </div>

            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
              {pct(fw.coverage)}% Coverage
            </div>
          </div>
        ))}

        {frameworks.length === 0 && (
          <div className="card" style={{ padding: 22 }}>
            No compliance data available
          </div>
        )}
      </div>

      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24
        }}
      >

        {/* CONTROL MATRIX */}
        <div className="card" style={{ padding: 24 }}>
          <h3>Control Coverage Matrix</h3>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {safeArray(controls)
              .slice(0, 10)
              .map((c, i) => (
                <div
                  key={c?.id || i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: 14,
                    borderRadius: 12,
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.08)"
                  }}
                >
                  <span>{c?.name || "Control"}</span>
                  <strong
                    style={{
                      color:
                        c?.status === "passed"
                          ? "#5EC6FF"
                          : c?.status === "failed"
                          ? "#ff5a5f"
                          : "#ffd166"
                    }}
                  >
                    {c?.status?.toUpperCase() || "UNKNOWN"}
                  </strong>
                </div>
              ))}
          </div>
        </div>

        {/* FAILED CONTROLS */}
        <div className="card" style={{ padding: 24 }}>
          <h3>Failed Controls</h3>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {failedControls.slice(0, 6).map((c, i) => (
              <div
                key={c?.id || i}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  background: "rgba(255,90,95,.12)",
                  border: "1px solid rgba(255,90,95,.35)"
                }}
              >
                <strong>{c?.name}</strong>
                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  Immediate remediation required
                </div>
              </div>
            ))}

            {failedControls.length === 0 && (
              <div style={{ opacity: 0.6 }}>
                No critical failures detected
              </div>
            )}
          </div>

          <button
            className="btn"
            onClick={load}
            disabled={loading}
            style={{ marginTop: 22 }}
          >
            {loading ? "Refreshing…" : "Recalculate Compliance"}
          </button>
        </div>

      </div>

    </div>
  );
}
