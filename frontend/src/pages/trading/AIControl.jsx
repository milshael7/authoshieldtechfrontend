// frontend/src/pages/trading/AIControl.jsx
// ============================================================
// AI CONTROL ROOM — LIVE / PAPER KILL SWITCH + ENGINE CONFIG
// ============================================================

import React, { useEffect, useState } from "react";
import { getToken } from "../../lib/api.js";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

export default function AIControl() {

  const [enabled, setEnabled] = useState(true);
  const [tradingMode, setTradingMode] = useState("paper");

  const [maxTrades, setMaxTrades] = useState(5);
  const [riskPercent, setRiskPercent] = useState(1.5);
  const [positionMultiplier, setPositionMultiplier] = useState(1);
  const [aggressiveness, setAggressiveness] = useState("Balanced");

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  /* ================= LOAD CONFIG ================= */

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {

    try {

      const res = await fetch(`${API_BASE}/api/ai/config`, {
        headers: authHeader()
      });

      const data = await res.json();
      if (!data?.ok) return;

      const cfg = data.config || {};

      setEnabled(cfg.enabled);
      setTradingMode(cfg.tradingMode || "paper");
      setMaxTrades(cfg.maxTrades || 5);
      setRiskPercent(cfg.riskPercent || 1.5);
      setPositionMultiplier(cfg.positionMultiplier || 1);
      setAggressiveness(cfg.strategyMode || "Balanced");

    } catch {}

  }

  /* ================= SAVE CONFIG ================= */

  async function saveConfig() {

    setSaving(true);
    setStatusMsg("");

    try {

      const res = await fetch(`${API_BASE}/api/ai/config`, {

        method: "POST",

        headers: {
          ...authHeader(),
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          enabled,
          tradingMode,
          maxTrades: Number(maxTrades),
          riskPercent: Number(riskPercent),
          positionMultiplier: Number(positionMultiplier),
          strategyMode: aggressiveness

        })

      });

      const data = await res.json();

      if (data?.ok === false) {
        setStatusMsg("Configuration rejected by server");
      } else {
        setStatusMsg("Configuration saved");
      }

    } catch {

      setStatusMsg("Connection error");

    }

    setSaving(false);

  }

  /* ================= MODE SWITCH ================= */

  function switchMode(mode) {

    if (mode === tradingMode) return;

    setTradingMode(mode);

    if (mode === "live") {
      setStatusMsg("⚠ LIVE TRADING ENABLED");
    } else {
      setStatusMsg("Paper trading mode");
    }

  }

  /* ================= UI ================= */

  return (

    <div style={{ padding: 24, color: "#fff" }}>

      <h2 style={{ marginBottom: 20 }}>
        AI Control Room
      </h2>

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


        {/* ================= TRADING MODE ================= */}

        <div style={{ marginBottom: 20 }}>

          <label>Trading Mode:</label>

          <button
            onClick={() => switchMode("paper")}
            style={{
              marginLeft: 15,
              padding: "6px 14px",
              background: tradingMode === "paper"
                ? "#2563eb"
                : "#374151",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer"
            }}
          >
            PAPER
          </button>

          <button
            onClick={() => switchMode("live")}
            style={{
              marginLeft: 10,
              padding: "6px 14px",
              background: tradingMode === "live"
                ? "#16a34a"
                : "#374151",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer"
            }}
          >
            LIVE
          </button>

        </div>


        {/* ================= CONTROLS ================= */}

        <Control
          label="Max Trades Per Day"
          value={maxTrades}
          onChange={setMaxTrades}
        />

        <Control
          label="Risk % Per Trade"
          value={riskPercent}
          step="0.1"
          onChange={setRiskPercent}
        />

        <Control
          label="Position Multiplier"
          value={positionMultiplier}
          step="0.1"
          onChange={setPositionMultiplier}
        />


        {/* ================= STRATEGY ================= */}

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


        {/* ================= SAVE ================= */}

        <button
          onClick={saveConfig}
          disabled={saving}
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
          {saving ? "Saving..." : "Save Configuration"}
        </button>


        {/* ================= STATUS ================= */}

        {statusMsg && (
          <div style={{
            marginTop: 15,
            opacity: 0.7
          }}>
            {statusMsg}
          </div>
        )}

      </div>

    </div>

  );

}

/* ================= CONTROL COMPONENT ================= */

function Control({ label, value, onChange, step = 1 }) {

  return (

    <div style={{ marginBottom: 20 }}>

      <label>{label}:</label>

      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(e.target.value)}
        style={{
          marginLeft: 15,
          padding: 6,
          width: 100
        }}
      />

    </div>

  );

}

/* ================= AUTH HEADER ================= */

function authHeader() {

  const token = getToken();

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};

}
