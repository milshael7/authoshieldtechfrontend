import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

function pct(v) {
  const x = Number(v);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.assets().catch(() => ({}));
      setAssets(Array.isArray(data?.assets) ? data.assets : []);
      setSummary(data?.summary || {});
    } catch {
      setAssets([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const riskBreakdown = useMemo(() => {
    return {
      critical: assets.filter(a => a?.risk === "critical").length,
      high: assets.filter(a => a?.risk === "high").length,
      medium: assets.filter(a => a?.risk === "medium").length,
      low: assets.filter(a => a?.risk === "low").length,
    };
  }, [assets]);

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ================= HEADER ================= */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0 }}>Asset Command Center</h2>
          <div style={{ opacity: 0.6, fontSize: 13 }}>
            Full infrastructure visibility
          </div>
        </div>

        <button className="btn" onClick={load}>
          {loading ? "Refreshing…" : "Refresh Assets"}
        </button>
      </div>

      {/* ================= KPI GRID ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
          gap: 18,
        }}
      >
        <div className="card">
          <small>Total Assets</small>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {assets.length}
          </div>
        </div>

        <div className="card">
          <small>Servers</small>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {summary.servers ?? 0}
          </div>
        </div>

        <div className="card">
          <small>Endpoints</small>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {summary.endpoints ?? 0}
          </div>
        </div>

        <div className="card">
          <small>Cloud Assets</small>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {summary.cloud ?? 0}
          </div>
        </div>
      </div>

      {/* ================= RISK DISTRIBUTION ================= */}
      <div className="card" style={{ padding: 24 }}>
        <h3>Risk Distribution</h3>

        {["critical", "high", "medium", "low"].map(level => {
          const count = riskBreakdown[level];
          const percent = pct((count / (assets.length || 1)) * 100);

          return (
            <div key={level} style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ textTransform: "capitalize" }}>
                  {level}
                </span>
                <strong>{count}</strong>
              </div>

              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: "rgba(255,255,255,.08)",
                  overflow: "hidden",
                  marginTop: 6,
                }}
              >
                <div
                  style={{
                    width: `${percent}%`,
                    height: "100%",
                    background:
                      level === "critical"
                        ? "#ff4d4d"
                        : level === "high"
                        ? "#ff914d"
                        : level === "medium"
                        ? "#ffd166"
                        : "#5EC6FF",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= TABLE ================= */}
      <div className="card" style={{ padding: 24 }}>
        <h3>Asset Inventory</h3>

        <div style={{ marginTop: 18, overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr style={{ opacity: 0.7 }}>
                <th align="left">Name</th>
                <th align="left">Type</th>
                <th align="left">Environment</th>
                <th align="left">Risk</th>
                <th align="left">Last Seen</th>
              </tr>
            </thead>

            <tbody>
              {assets.map((a, i) => (
                <tr
                  key={a.id || i}
                  style={{
                    borderTop: "1px solid rgba(255,255,255,.08)",
                  }}
                >
                  <td>{a.name || "—"}</td>
                  <td>{a.type || "—"}</td>
                  <td>{a.environment || "—"}</td>
                  <td style={{ textTransform: "capitalize" }}>
                    {a.risk || "low"}
                  </td>
                  <td>{a.lastSeen || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {assets.length === 0 && !loading && (
            <div style={{ marginTop: 20, opacity: 0.6 }}>
              No assets found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
