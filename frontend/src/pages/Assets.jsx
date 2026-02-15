import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeStr(v, fallback = "—") {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function riskColor(level) {
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

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.assets().catch(() => ({}));
      setAssets(safeArray(res?.assets));
    } catch {
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    const list = safeArray(assets);
    return {
      total: list.length,
      critical: list.filter(a => a?.risk === "critical").length,
      high: list.filter(a => a?.risk === "high").length,
      internetFacing: list.filter(a => a?.internetFacing).length,
    };
  }, [assets]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ================= HEADER ================= */}
      <div>
        <h2 style={{ margin: 0 }}>Asset Command Center</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Enterprise asset visibility and exposure
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
          <div style={{ fontSize: 12, opacity: 0.6 }}>Total Assets</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{summary.total}</div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Critical Risk</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ff4d4d" }}>
            {summary.critical}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>High Risk</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ff884d" }}>
            {summary.high}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Internet Facing</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#5EC6FF" }}>
            {summary.internetFacing}
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
          <div style={{ maxHeight: 500, overflowY: "auto" }}>

            {loading ? (
              <div style={{ padding: 20 }}>Loading assets...</div>
            ) : assets.length === 0 ? (
              <div style={{ padding: 20 }}>No assets discovered.</div>
            ) : (
              safeArray(assets).map((asset, i) => (
                <div
                  key={asset?.id || i}
                  onClick={() => setSelected(asset)}
                  style={{
                    padding: 18,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                    background:
                      selected?.id === asset?.id
                        ? "rgba(94,198,255,0.08)"
                        : "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{safeStr(asset?.name, "Unnamed Asset")}</strong>

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: riskColor(asset?.risk),
                      }}
                    >
                      {safeStr(asset?.risk).toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
                    Type: {safeStr(asset?.type)} • Owner: {safeStr(asset?.owner)}
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
              <h3>{safeStr(selected?.name)}</h3>

              <div style={{ marginBottom: 10 }}>
                <strong>Risk Level: </strong>
                <span
                  style={{
                    color: riskColor(selected?.risk),
                    fontWeight: 700,
                  }}
                >
                  {safeStr(selected?.risk).toUpperCase()}
                </span>
              </div>

              <div style={{ marginBottom: 10 }}>
                <strong>Type:</strong> {safeStr(selected?.type)}
              </div>

              <div style={{ marginBottom: 10 }}>
                <strong>Owner:</strong> {safeStr(selected?.owner)}
              </div>

              <div style={{ marginBottom: 10 }}>
                <strong>Internet Facing:</strong>{" "}
                {selected?.internetFacing ? "Yes" : "No"}
              </div>

              <div style={{ fontSize: 13, opacity: 0.6 }}>
                Last Scan: {safeStr(selected?.lastScan)}
              </div>

              <button className="btn" style={{ marginTop: 20 }}>
                Initiate Deep Scan
              </button>
            </>
          ) : (
            <div style={{ opacity: 0.6 }}>
              Select an asset to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
