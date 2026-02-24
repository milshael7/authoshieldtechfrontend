import React, { useEffect, useState, useMemo } from "react";
import { api } from "../lib/api";

function getColor(risk) {
  if (risk >= 80) return "#16c784";       // healthy green
  if (risk >= 60) return "#f5b400";       // elevated yellow
  if (risk >= 40) return "#ff9500";       // high orange
  return "#ff3b30";                       // critical red
}

function getSize(exposure) {
  if (exposure === "external") return 90;
  if (exposure === "public") return 80;
  return 70;
}

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.assets();
      setAssets(res?.assets || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const analytics = useMemo(() => {
    const total = assets.length;
    const critical = assets.filter(a => a.status === "CRITICAL").length;
    const avgRisk =
      total > 0
        ? Math.round(
            assets.reduce((sum, a) => sum + (a.riskScore || 0), 0) / total
          )
        : 0;

    return { total, critical, avgRisk };
  }, [assets]);

  if (loading) return <div style={{ padding: 28 }}>Loading…</div>;

  return (
    <div style={{ padding: 28 }}>

      <h2>Asset Intelligence Heatmap</h2>

      {/* TOP STRIP */}
      <div style={{
        display: "flex",
        gap: 20,
        marginBottom: 28,
        flexWrap: "wrap"
      }}>
        <Stat label="Total Assets" value={analytics.total} />
        <Stat label="Critical Assets" value={analytics.critical} danger />
        <Stat label="Average Risk Score" value={analytics.avgRisk} />
      </div>

      {/* HEATMAP GRID */}
      <div style={heatmapGrid}>
        {assets.map(asset => {
          const color = getColor(asset.riskScore || 0);
          const size = getSize(asset.exposureLevel);
          const hasThreat = asset.activeThreats > 0;

          return (
            <div
              key={asset.id}
              onClick={() => setSelected(asset)}
              style={{
                width: size,
                height: size,
                borderRadius: 12,
                background: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#000",
                fontWeight: 700,
                cursor: "pointer",
                position: "relative",
                boxShadow: hasThreat
                  ? `0 0 20px ${color}`
                  : "0 4px 12px rgba(0,0,0,.4)",
                transition: "all .2s ease"
              }}
            >
              {asset.type}

              {hasThreat && (
                <div style={pulseDot} />
              )}
            </div>
          );
        })}
      </div>

      {/* DETAIL PANEL */}
      {selected && (
        <div style={drawer}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3>{selected.name}</h3>
            <button onClick={() => setSelected(null)}>X</button>
          </div>

          <p><strong>Type:</strong> {selected.type}</p>
          <p><strong>Exposure:</strong> {selected.exposureLevel}</p>
          <p><strong>Risk Score:</strong> {selected.riskScore}</p>
          <p><strong>Status:</strong> {selected.status}</p>
          <p><strong>Active Threats:</strong> {selected.activeThreats}</p>
          <p><strong>Monitoring:</strong> {selected.monitoringEnabled ? "On" : "Off"}</p>
          <p><strong>AutoProtect:</strong> {selected.autoProtectEnabled ? "On" : "Off"}</p>
        </div>
      )}

    </div>
  );
}

function Stat({ label, value, danger }) {
  return (
    <div style={{
      padding: 18,
      borderRadius: 12,
      background: "rgba(255,255,255,.05)",
      border: "1px solid rgba(255,255,255,.06)",
      minWidth: 200
    }}>
      <div style={{ fontSize: 12, opacity: .6 }}>{label}</div>
      <div style={{
        fontSize: 24,
        fontWeight: 700,
        color: danger ? "#ff3b30" : "#fff"
      }}>
        {value}
      </div>
    </div>
  );
}

const heatmapGrid = {
  display: "flex",
  flexWrap: "wrap",
  gap: 20
};

const drawer = {
  position: "fixed",
  top: 0,
  right: 0,
  width: 380,
  height: "100%",
  background: "#111",
  padding: 28,
  borderLeft: "1px solid rgba(255,255,255,.1)",
  overflowY: "auto"
};

const pulseDot = {
  position: "absolute",
  top: 6,
  right: 6,
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "#fff",
  animation: "pulse 1.2s infinite"
};
