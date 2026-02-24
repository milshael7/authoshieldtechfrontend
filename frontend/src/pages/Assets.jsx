import React, { useEffect, useState } from "react";
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

  if (loading) return <div style={{ padding: 28 }}>Loading…</div>;

  return (
    <div style={{ padding: 28 }}>
      <h2>Asset Intelligence Center</h2>

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

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 20,
  marginTop: 24
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
