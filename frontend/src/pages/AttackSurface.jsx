import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function riskColor(level) {
  switch (level) {
    case "critical":
      return "#ff4d4d";
    case "high":
      return "#ff8a4d";
    case "medium":
      return "#ffd166";
    case "low":
      return "#5EC6FF";
    default:
      return "#999";
  }
}

/* ================= PAGE ================= */

export default function AttackSurface() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.attackSurfaceOverview().catch(() => ({}));
      setAssets(safeArray(res?.assets));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: assets.length,
      critical: assets.filter(a => a.risk === "critical").length,
      exposed: assets.filter(a => a.exposed === true).length,
      sslIssues: assets.filter(a => a.sslValid === false).length,
    };
  }, [assets]);

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* HEADER */}
      <div>
        <h2 style={{ margin: 0 }}>External Attack Surface</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Internet-facing assets and exposure monitoring
        </div>
      </div>

      {/* STAT CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 20
        }}
      >
        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Total Assets</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{stats.total}</div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Critical Risk</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ff4d4d" }}>
            {stats.critical}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Exposed Services</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ff8a4d" }}>
            {stats.exposed}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>SSL Issues</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ffd166" }}>
            {stats.sslIssues}
          </div>
        </div>
      </div>

      {/* ASSET TABLE */}
      <div className="card" style={{ padding: 24 }}>
        <h3>Internet-Facing Assets</h3>

        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          {safeArray(assets).slice(0, 20).map((a, i) => (
            <div
              key={a?.id || i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 14,
                borderRadius: 12,
                background: "rgba(255,255,255,.04)",
                border: "1px solid rgba(255,255,255,.08)"
              }}
            >
              <div>
                <strong>{a?.hostname || a?.ip || "Unknown Asset"}</strong>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  Ports: {safeArray(a?.ports).join(", ") || "—"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>

                <span
                  style={{
                    fontSize: 12,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.08)"
                  }}
                >
                  {a?.type || "service"}
                </span>

                <span
                  style={{
                    fontSize: 12,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: `${riskColor(a?.risk)}22`,
                    color: riskColor(a?.risk)
                  }}
                >
                  {(a?.risk || "unknown").toUpperCase()}
                </span>

                {!a?.sslValid && (
                  <span
                    style={{
                      fontSize: 12,
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "rgba(255,209,102,.15)"
                    }}
                  >
                    SSL ISSUE
                  </span>
                )}

                {a?.exposed && (
                  <span
                    style={{
                      fontSize: 12,
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "rgba(255,77,77,.15)"
                    }}
                  >
                    EXPOSED
                  </span>
                )}

              </div>
            </div>
          ))}

          {assets.length === 0 && (
            <div style={{ opacity: 0.6 }}>
              No external assets detected
            </div>
          )}
        </div>

        <button
          className="btn"
          onClick={load}
          disabled={loading}
          style={{ marginTop: 22 }}
        >
          {loading ? "Scanning…" : "Run New Scan"}
        </button>
      </div>

    </div>
  );
}
