// ============================================================
// FILE: frontend/src/components/EquityCurve.jsx
// EQUITY BAR CHART — COMPACT DASHBOARD VERSION
// PURPOSE:
// Small equity history bars used in compact UI panels.
//
// FIXES:
// - Added NaN protection
// - Added safe data filtering
// - Prevents negative or invalid heights
// - No layout changes
// ============================================================

import React from "react";

export default function EquityCurve({ equityHistory = [] }) {

  if (!Array.isArray(equityHistory) || equityHistory.length === 0)
    return null;

  // Remove invalid numbers
  const cleanData = equityHistory.filter(v => Number.isFinite(v));
  if (!cleanData.length) return null;

  const max = Math.max(...cleanData);
  const min = Math.min(...cleanData);
  const range = max - min || 1;

  return (
    <div
      style={{
        height: 160,
        background: "rgba(255,255,255,0.04)",
        borderRadius: 12,
        padding: 10,
        display: "flex",
        alignItems: "flex-end",
        gap: 2,
      }}
    >
      {cleanData.map((value, i) => {

        const height =
          Math.max(
            0,
            ((value - min) / range) * 100
          );

        return (
          <div
            key={i}
            style={{
              width: "4px",
              height: `${height}%`,
              background:
                value >= cleanData[0]
                  ? "#5EC6FF"
                  : "#ff5a5f",
              transition: "height .3s ease",
            }}
          />
        );
      })}
    </div>
  );
}
