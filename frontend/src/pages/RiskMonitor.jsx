// frontend/src/pages/RiskMonitor.jsx
// Global Risk Command Console
// Live Risk Stream • Exposure Breakdown • Trend Buffer • Escalation Detection

import React, { useEffect, useMemo, useState } from "react";
import { useSecurity } from "../context/SecurityContext.jsx";

function getRiskLevel(score) {
  const n = Number(score || 0);

  if (n >= 85) return { label: "CRITICAL", color: "#ff4d4f" };
  if (n >= 70) return { label: "ELEVATED", color: "#ff9800" };
  if (n >= 40) return { label: "MODERATE", color: "#facc15" };
  return { label: "STABLE", color: "#22c55e" };
}

export default function RiskMonitor() {
  const {
    riskScore,
    assetExposure,
    systemStatus,
  } = useSecurity();

  const [history, setHistory] = useState([]);

  // buffer last 50 risk values
  useEffect(() => {
    setHistory((prev) => {
      const next = [...prev, { value: riskScore, ts: Date.now() }];
      return next.slice(-50);
    });
  }, [riskScore]);

  const level = useMemo(() => getRiskLevel(riskScore), [riskScore]);

  const sortedExposure = useMemo(() => {
    return Object.entries(assetExposure || {})
      .sort((a, b) => Number(b[1]) - Number(a[1]));
  }, [assetExposure]);

  const escalation = riskScore >= 85;

  return (
    <div style={{ padding: 30, display: "flex", flexDirection: "column", gap: 30 }}>

      <div className="sectionTitle">Global Risk Command Console</div>

      {/* ================= RISK SCORE ================= */}
      <div
        className="postureCard executivePanel"
        style={{
          border: `1px solid ${level.color}40`,
          boxShadow: `0 0 30px ${level.color}20`
        }}
      >
        <h3>Live Risk Score</h3>

        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: level.color,
            transition: "all .4s ease"
          }}
        >
          {Number(riskScore || 0)}
        </div>

        <div
          style={{
            marginTop: 10,
            padding: "4px 12px",
            display: "inline-block",
            borderRadius: 20,
            background: level.color,
            color: "#000",
            fontWeight: 700
          }}
        >
          {level.label}
        </div>

        {escalation && (
          <div
            style={{
              marginTop: 20,
              padding: 15,
              borderRadius: 10,
              background: "rgba(255,77,79,.15)",
              border: "1px solid rgba(255,77,79,.5)"
            }}
          >
            🚨 Escalation Threshold Breached  
            Immediate investigation recommended.
          </div>
        )}

        {systemStatus === "compromised" && (
          <div
            style={{
              marginTop: 15,
              padding: 12,
              borderRadius: 10,
              background: "rgba(255,140,0,.15)",
              border: "1px solid rgba(255,140,0,.5)"
            }}
          >
            ⚠ System Integrity Compromised
          </div>
        )}
      </div>

      {/* ================= RISK TREND ================= */}
      <div className="postureCard">
        <h3>Risk Trend (Live Buffer)</h3>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
          {history.map((point, i) => {
            const height = Math.min(100, Number(point.value));
            const color = getRiskLevel(point.value).color;

            return (
              <div
                key={i}
                style={{
                  width: 6,
                  height: `${height}%`,
                  background: color,
                  borderRadius: 2,
                  transition: "height .3s ease"
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ================= ASSET EXPOSURE ================= */}
      <div className="postureCard">
        <h3>Asset Exposure Breakdown</h3>

        {sortedExposure.length === 0 ? (
          <div className="muted">No exposure data available.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sortedExposure.map(([asset, score]) => {
              const width = Math.min(100, Number(score));
              return (
                <div key={asset}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{asset}</span>
                    <b>{score}</b>
                  </div>

                  <div
                    style={{
                      height: 8,
                      background: "rgba(255,255,255,.08)",
                      borderRadius: 6,
                      overflow: "hidden",
                      marginTop: 4
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${width}%`,
                        background: getRiskLevel(score).color,
                        transition: "width .4s ease"
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
