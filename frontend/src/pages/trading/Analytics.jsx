// frontend/src/pages/trading/Analytics.jsx
// ============================================================
// ANALYTICS ROOM
// ============================================================

import React from "react";

export default function Analytics() {

  return (
    <div style={{ padding: 24, color: "#fff" }}>
      <h2 style={{ marginBottom: 20 }}>Analytics</h2>

      <div style={{
        background: "#111827",
        padding: 24,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,.08)",
        maxWidth: 1000
      }}>
        Performance metrics, historical trade logs,
        AI win rate, drawdown and behavior tracking will appear here.
      </div>
    </div>
  );
}
