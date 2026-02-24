import React, { useEffect, useState, useMemo } from "react";
import { api } from "../lib/api";

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

  async function triggerScan(id) {
    await api.req(`/api/assets/${id}/scan`, { method: "POST" });
    load();
  }

  const analytics = useMemo(() => {
    if (!assets.length)
      return {
        total: 0,
        critical: 0,
        avgRisk: 0,
        vulns: 0,
        types: {}
      };

    const total = assets.length;
    const critical = assets.filter(a => a.status === "CRITICAL").length;
    const avgRisk =
      Math.round(
        assets.reduce((sum, a) => sum + (a.riskScore || 0), 0) / total
      ) || 0;

    const vulns = assets.reduce(
      (sum, a) => sum + (a.vulnerabilities || 0),
      0
    );

    const types = {};
    assets.forEach(a => {
      types[a.type] = (types[a.type] || 0) + 1;
    });

    return { total, critical, avgRisk, vulns, types };
  }, [assets]);

  if (loading) return <div style={{ padding: 28 }}>Loading…</div>;

  return (
    <div style={{ padding: 28 }}>

      <h2>Asset Intelligence Center</h2>

      {/* 🔥 ANALYTICS STRIP */}
      <div style={strip}>
        <Stat label="Total Assets" value={analytics.total} />
        <Stat label="Critical Assets" value={analytics.critical} danger />
        <Stat label="Average Risk Score" value={analytics.avgRisk} />
        <Stat label="Total Vulnerabilities" value={analytics.vulns} />
      </div>

      {/* TYPE BREAKDOWN */}
      <div style={typeBox}>
        <strong>Asset Type Distribution:</strong>
        <div style={{ marginTop: 8 }}>
          {Object.entries(analytics.types).map(([type, count]) => (
            <div key={type}>
              {type}: {count}
            </div>
          ))}
        </div>
      </div>

      {/* GRID */}
      <div style={grid}>
        {assets.map(a => (
          <div key={a.id} style={card} onClick={() => setSelected(a)}>
            <div style={{ fontWeight: 700 }}>{a.name}</div>
            <div>{a.type}</div>
            <div>Risk: {a.riskScore}</div>
            <div style={{
              color:
                a.status === "CRITICAL"
                  ? "#ff3b30"
                  : a.status === "ELEVATED"
                  ? "#f5b400"
                  : "#16c784"
            }}>
              {a.status}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={drawer}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3>{selected.name}</h3>
            <button onClick={() => setSelected(null)}>X</button>
          </div>

          <p><strong>Type:</strong> {selected.type}</p>
          <p><strong>Risk Score:</strong> {selected.riskScore}</p>
          <p><strong>Vulnerabilities:</strong> {selected.vulnerabilities}</p>
          <p><strong>Status:</strong> {selected.status}</p>

          <button style={scanBtn} onClick={() => triggerScan(selected.id)}>
            Trigger Scan
          </button>
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
      minWidth: 180
    }}>
      <div style={{ fontSize: 12, opacity: .6 }}>{label}</div>
      <div style={{
        fontSize: 22,
        fontWeight: 700,
        color: danger ? "#ff3b30" : "#fff"
      }}>
        {value}
      </div>
    </div>
  );
}

const strip = {
  display: "flex",
  gap: 20,
  flexWrap: "wrap",
  marginBottom: 24
};

const typeBox = {
  marginBottom: 28,
  padding: 18,
  borderRadius: 12,
  background: "rgba(255,255,255,.04)",
  border: "1px solid rgba(255,255,255,.06)"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 20
};

const card = {
  padding: 20,
  borderRadius: 12,
  background: "rgba(255,255,255,.05)",
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,.06)"
};

const drawer = {
  position: "fixed",
  top: 0,
  right: 0,
  width: 360,
  height: "100%",
  background: "#111",
  padding: 24,
  borderLeft: "1px solid rgba(255,255,255,.1)"
};

const scanBtn = {
  padding: 12,
  marginTop: 20,
  background: "#4f8cff",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  borderRadius: 8
};
