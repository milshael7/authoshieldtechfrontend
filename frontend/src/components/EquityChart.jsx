// ============================================================
// FILE: frontend/src/components/EquityChart.jsx
// EQUITY LINE CHART — ANALYTICS VERSION
// PURPOSE:
// Full equity curve used in analytics dashboards.
//
// FIXES:
// - Handles NaN values safely
// - Prevents single-point division errors
// - Keeps identical visual design
// ============================================================

import React from "react";

/*
 * Lightweight SVG Equity Curve Chart
 * No external libraries
 * Fully self-contained
 */

export default function EquityChart({ data = [] }) {

  if (!Array.isArray(data) || data.length === 0)
    return null;

  const cleanData = data.filter(v => Number.isFinite(v));
  if (cleanData.length === 0) return null;

  const width = 500;
  const height = 200;
  const padding = 20;

  const max = Math.max(...cleanData);
  const min = Math.min(...cleanData);

  const length = cleanData.length;

  const scaleX = (index) => {

    if (length === 1) return width / 2;

    return (
      padding +
      (index / (length - 1)) *
        (width - padding * 2)
    );
  };

  const scaleY = (value) => {

    const range = max - min || 1;

    return (
      height -
      padding -
      ((value - min) / range) *
        (height - padding * 2)
    );
  };

  const points = cleanData
    .map((v, i) => `${scaleX(i)},${scaleY(v)}`)
    .join(" ");

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ marginTop: 15 }}
    >
      <polyline
        fill="none"
        stroke="#5EC6FF"
        strokeWidth="2"
        points={points}
      />

      {/* Peak line */}

      <line
        x1={padding}
        y1={scaleY(max)}
        x2={width - padding}
        y2={scaleY(max)}
        stroke="rgba(255,255,255,.15)"
        strokeDasharray="4"
      />

      {/* Chart border */}

      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill="none"
        stroke="rgba(255,255,255,.05)"
      />
    </svg>
  );
}
