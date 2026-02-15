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

function scoreFrom(framework = {}) {
  const total = framework?.totalControls || 0;
  const compliant = framework?.compliantControls || 0;
  if (!total) return 0;
  return Math.round((compliant / total) * 100);
}

/* ================= PAGE ================= */

export default function Compliance() {
  const [frameworks, setFrameworks] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.compliance().catch(() => ({}));
      setFrameworks(safeArray(data?.frameworks));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totalFrameworks = frameworks.length;

  const averageScore = useMemo(() => {
    if (!frameworks.length) return 0;
    const sum = frameworks.reduce(
      (acc, f) => acc + scoreFrom(f),
      0
    );
    return Math.round(sum / frameworks.length);
  }, [frameworks]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* HEADER */}
      <div>
        <h2 style={{ margin: 0 }}>Compliance Command Center</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Regulatory alignment & audit readiness overview
        </div>
      </div>

      {/* SUMMARY STRIP */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 18
        }}
      >
        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Frameworks Tracked
          </div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>
            {totalFrameworks}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Average Compliance Score
          </div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>
            {averageScore}%
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Audit Readiness
          </div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>
            {averageScore >= 80 ? "Ready" : "Needs Attention"}
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24
        }}
      >

        {/* ================= FRAMEWORK LIST ================= */}
        <div className="card">
          <h3>Framework Coverage</h3>

          {loading ? (
            <div>Loading compliance data...</div>
          ) : frameworks.length === 0 ? (
            <div style={{ opacity: 0.6 }}>
              No compliance frameworks configured.
            </div>
          ) : (
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 18 }}>
              {frameworks.map((f, index) => {
                const score = pct(scoreFrom(f));

                return (
                  <div
                    key={f?.id || index}
                    style={{
                      padding: 16,
                      borderRadius: 14,
                      background: "rgba(255,255,255,.04)",
                      border: "1px solid rgba(255,255,255,.08)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>{f?.name || "Framework"}</strong>
                      <span>{score}%</span>
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        height: 8,
                        background: "rgba(255,255,255,.08)",
                        borderRadius: 999,
                        overflow: "hidden"
                      }}
                    >
                      <div
                        style={{
                          width: `${score}%`,
                          height: "100%",
                          background:
                            score >= 80
                              ? "linear-gradient(90deg,#2bd576,#5EC6FF)"
                              : "linear-gradient(90deg,#ff5a5f,#ffd166)"
                        }}
                      />
                    </div>

                    <div style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>
                      {f?.compliantControls || 0} /{" "}
                      {f?.totalControls || 0} controls compliant
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= ACTION PANEL ================= */}
        <div className="card">
          <h3>Audit Actions</h3>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>

            <div>
              <strong>Control Gap Review</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Identify missing controls before audit cycle.
              </div>
            </div>

            <div>
              <strong>Policy Mapping</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Map policies to regulatory frameworks automatically.
              </div>
            </div>

            <div>
              <strong>Certification Preparation</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Generate audit evidence documentation.
              </div>
            </div>

            <button className="btn" onClick={load}>
              Refresh Compliance Data
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
