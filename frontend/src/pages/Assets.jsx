import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [type, setType] = useState("");

  async function loadAssets() {
    try {
      const res = await api.assets();
      setAssets(res?.assets || []);
    } catch (err) {
      console.error("Failed to load assets", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssets();
  }, []);

  async function createAsset() {
    if (!name || !type) return;

    try {
      await api.req("/api/assets", {
        method: "POST",
        body: { name, type }
      });

      setName("");
      setType("");
      loadAssets();
    } catch (err) {
      console.error("Create failed", err.message);
    }
  }

  async function deleteAsset(id) {
    try {
      await api.req(`/api/assets/${id}`, {
        method: "DELETE"
      });
      loadAssets();
    } catch (err) {
      console.error("Delete failed", err.message);
    }
  }

  if (loading) {
    return <div style={{ padding: 28 }}>Loading assets…</div>;
  }

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 24 }}>

      <h2>Asset Intelligence Center</h2>

      {/* CREATE ASSET */}
      <div style={{
        display: "flex",
        gap: 12,
        padding: 20,
        background: "rgba(255,255,255,.05)",
        borderRadius: 12
      }}>
        <input
          placeholder="Asset Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Asset Type (Server, Cloud, Endpoint)"
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={inputStyle}
        />
        <button onClick={createAsset} style={buttonStyle}>
          Add Asset
        </button>
      </div>

      {/* GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 20
      }}>
        {assets.map(asset => (
          <div key={asset.id} style={cardStyle}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {asset.name}
            </div>

            <div style={{ opacity: 0.6 }}>
              Type: {asset.type}
            </div>

            <div style={{ marginTop: 12 }}>
              <strong>Risk Score:</strong> {asset.riskScore}
            </div>

            <div>
              <strong>Status:</strong>{" "}
              <span style={{
                color:
                  asset.status === "CRITICAL"
                    ? "#ff3b30"
                    : asset.status === "ELEVATED"
                    ? "#f5b400"
                    : "#16c784"
              }}>
                {asset.status}
              </span>
            </div>

            <div>
              <strong>Vulnerabilities:</strong> {asset.vulnerabilities}
            </div>

            <div style={{ marginTop: 14 }}>
              <button
                onClick={() => deleteAsset(asset.id)}
                style={dangerButton}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

/* ================= STYLES ================= */

const inputStyle = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(0,0,0,.4)",
  color: "#fff",
  flex: 1
};

const buttonStyle = {
  padding: "10px 18px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  background: "#4f8cff",
  color: "#fff",
  fontWeight: 600
};

const dangerButton = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  background: "#ff3b30",
  color: "#fff"
};

const cardStyle = {
  padding: 20,
  borderRadius: 14,
  background: "rgba(255,255,255,.04)",
  border: "1px solid rgba(255,255,255,.06)"
};
