// frontend/src/pages/trading/AIControl.jsx
// ============================================================
// AI CONTROL ROOM — CORE MANAGEMENT PANEL
// ============================================================

import React, { useState } from "react";

export default function AIControl() {

  const [enabled, setEnabled] = useState(true);
  const [maxTrades, setMaxTrades] = useState(5);
  const [riskPercent, setRiskPercent] = useState(1.5);
  const [positionMultiplier, setPositionMultiplier] = useState(1);
  const [aggressiveness, setAggressiveness] = useState("Balanced");

  return (
    <div style={{ padding: 24, color: "#fff" }}>

      <h2 style={{ marginBottom: 20 }}>AI Control Room</h2>

      <div style={{
        background: "#111827",
        padding: 24,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,.08)",
        maxWidth: 800
      }}>

        {/* AI STATUS */}
        <div style={{ marginBottom: 20 }}>
          <strong>AI Status:</strong>
          <button
            onClick={() => setEnabled(!enabled)}
            style={{
              marginLeft: 15,
              padding: "6px 14px",
              background: enabled ? "#16a34a" : "#dc2626",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              borderRadius: 6
            }}
          >
            {enabled ? "ACTIVE" : "PAUSED"}
          </button>
        </div>

        {/* MAX TRADES */}
        <div style={{ marginBottom: 20 }}>
          <label>Max Trades Per Day:</label>
          <input
            type="number"
            value={maxTrades}
            onChange={(e) => setMaxTrades(e.target.value)}
            style={{
              marginLeft: 15,
              padding: 6,
              width: 100
            }}
          />
        </div>

        {/* RISK */}
        <div style={{ marginBottom: 20 }}>
          <label>Risk % Per Trade:</label>
          <input
            type="number"
            step="0.1"
            value={riskPercent}
            onChange={(e) => setRiskPercent(e.target.value)}
            style={{
              marginLeft: 15,
              padding: 6,
              width: 100
            }}
          />
        </div>

        {/* POSITION MULTIPLIER */}
        <div style={{ marginBottom: 20 }}>
          <label>Position Multiplier:</label>
          <input
            type="number"
            step="0.1"
            value={positionMultiplier}
            onChange={(e) => setPositionMultiplier(e.target.value)}
            style={{
              marginLeft: 15,
              padding: 6,
              width: 100
            }}
          />
        </div>

        {/* AGGRESSIVENESS */}
        <div style={{ marginBottom: 20 }}>
          <label>Strategy Mode:</label>
          <select
            value={aggressiveness}
            onChange={(e) => setAggressiveness(e.target.value)}
            style={{ marginLeft: 15, padding: 6 }}
          >
            <option>Conservative</option>
            <option>Balanced</option>
            <option>Aggressive</option>
          </select>
        </div>

        <button
          style={{
            marginTop: 10,
            padding: "8px 18px",
            background: "#2563eb",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            borderRadius: 6
          }}
        >
          Save Configuration
        </button>

      </div>
    </div>
  );
}
