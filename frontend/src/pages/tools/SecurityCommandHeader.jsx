import React from "react";

/*
  Global Security Command Header
  Executive SOC Overview
*/

export default function SecurityCommandHeader({
  score = 78,
  activeControls = 6,
  incidents = 4,
}) {
  function riskLevel(score) {
    if (score >= 85) return { label: "LOW RISK", color: "#2bd576" };
    if (score >= 65) return { label: "MODERATE", color: "#ffd166" };
    return { label: "HIGH RISK", color: "#ff5a5f" };
  }

  const risk = riskLevel(score);

  return (
    <div className="platformCard" style={{ marginBottom: 30 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 24,
        }}
      >
        {/* Score */}
        <div>
          <small className="muted">Global Security Score</small>
          <div style={{ fontSize: 42, fontWeight: 900 }}>
            {score}
          </div>
        </div>

        {/* Active Controls */}
        <div>
          <small className="muted">Active Controls</small>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {activeControls}
          </div>
        </div>

        {/* Incidents */}
        <div>
          <small className="muted">Open Incidents</small>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {incidents}
          </div>
        </div>

        {/* Risk Badge */}
        <div style={{ alignSelf: "center" }}>
          <span
            className="badge"
            style={{
              background: risk.color + "22",
              color: risk.color,
              fontSize: 14,
            }}
          >
            {risk.label}
          </span>
        </div>
      </div>
    </div>
  );
}
