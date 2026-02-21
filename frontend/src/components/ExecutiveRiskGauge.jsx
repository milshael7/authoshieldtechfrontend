import React, { useEffect, useState } from "react";
import { api } from "../lib/api";

/**
 * ExecutiveRiskGauge
 * Layer 1 — Executive Risk Index Dial
 */

export default function ExecutiveRiskGauge() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const res = await api.adminExecutiveRisk();
      setData(res?.executiveRisk || null);
    } catch (e) {
      console.error("ExecutiveRisk error:", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="postureCard">
        <b>Executive Risk Index</b>
        <div style={{ marginTop: 16 }}>
          Loading platform risk analytics…
        </div>
      </div>
    );
  }

  if (!data) return null;

  const score = data.riskIndex || 0;
  const level = data.level || "LOW";

  const color =
    level === "CRITICAL"
      ? "#ff4d4f"
      : level === "ELEVATED"
      ? "#faad14"
      : level === "MODERATE"
      ? "#ffd666"
      : "#52c41a";

  return (
    <div className="postureCard">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <b>Executive Risk Index</b>
        <small className="muted">Real-Time Platform Stability</small>
      </div>

      <div style={{ height: 24 }} />

      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: "50%",
          border: `8px solid ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto",
          fontSize: 28,
          fontWeight: 600,
          color,
        }}
      >
        {score}
      </div>

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <span
          style={{
            padding: "6px 14px",
            borderRadius: 20,
            background: color,
            color: "#000",
            fontWeight: 600,
          }}
        >
          {level}
        </span>
      </div>
    </div>
  );
}
