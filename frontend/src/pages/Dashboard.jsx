// frontend/src/pages/Dashboard.jsx
// Stable Base Dashboard (Role Neutral Safe Build)

import React from "react";

export default function Dashboard() {
  return (
    <div style={{ padding: 28 }}>
      <h2 style={{ marginBottom: 12 }}>Platform Dashboard</h2>

      <div
        style={{
          padding: 20,
          borderRadius: 12,
          background: "rgba(255,255,255,.04)",
          border: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <p style={{ opacity: 0.8 }}>
          Dashboard is operational.
        </p>

        <p style={{ fontSize: 13, opacity: 0.6, marginTop: 10 }}>
          This is the stable fallback dashboard layer.
        </p>
      </div>
    </div>
  );
}
