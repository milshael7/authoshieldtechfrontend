import React from "react";

/*
 * Lightweight SVG Equity Curve Chart
 * No external libraries
 * Fully self-contained
 */

export default function EquityChart({ data = [] }) {
  if (!data.length) return null;

  const width = 500;
  const height = 200;
  const padding = 20;

  const max = Math.max(...data);
  const min = Math.min(...data);

  const scaleX = (index) =>
    padding +
    (index / (data.length - 1)) * (width - padding * 2);

  const scaleY = (value) =>
    height -
    padding -
    ((value - min) / (max - min || 1)) *
      (height - padding * 2);

  const points = data
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

      {/* Zero padding border */}
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
