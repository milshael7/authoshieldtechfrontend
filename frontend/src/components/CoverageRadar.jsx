// frontend/src/components/CoverageRadar.jsx
// SOC Coverage Radar — FINAL BASELINE (NO DEPENDENCIES)
//
// SAFE:
// - UI only
// - No API calls
// - No business logic
// - No external chart libraries
// - Vite + Vercel safe
// - Drop-in replacement for recharts version

import React from "react";

/**
 * Expected data format:
 * [
 *   { name: "Endpoint Security", coverage: 92 },
 *   { name: "Identity & Access", coverage: 85 },
 *   ...
 * ]
 */

export default function CoverageRadar({ data = [] }) {
  const size = 320;
  const center = size / 2;
  const radius = 120;
  const levels = 5;

  if (!data.length) {
    return (
      <div
        style={{
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
          fontSize: 13,
        }}
      >
        Coverage data unavailable
      </div>
    );
  }

  const angleStep = (Math.PI * 2) / data.length;

  function polar(angle, r) {
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
    };
  }

  // Radar polygon
  const points = data
    .map((d, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = (d.coverage / 100) * radius;
      const { x, y } = polar(angle, r);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width="100%"
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ marginTop: 10 }}
    >
      {/* Grid levels */}
      {[...Array(levels)].map((_, i) => {
        const r = ((i + 1) / levels) * radius;
        const levelPoints = data
          .map((_, idx) => {
            const angle = idx * angleStep - Math.PI / 2;
            const { x, y } = polar(angle, r);
            return `${x},${y}`;
          })
          .join(" ");

        return (
          <polygon
            key={i}
            points={levelPoints}
            fill="none"
            stroke="rgba(255,255,255,.08)"
          />
        );
      })}

      {/* Axes */}
      {data.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const { x, y } = polar(angle, radius);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,.08)"
          />
        );
      })}

      {/* Radar fill */}
      <polygon
        points={points}
        fill="rgba(122,167,255,.35)"
        stroke="rgba(122,167,255,.95)"
        strokeWidth={2}
      />

      {/* Labels */}
      {data.map((d, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const { x, y } = polar(angle, radius + 18);
        return (
          <text
            key={d.name}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,.75)"
            fontSize="11"
          >
            {d.name}
          </text>
        );
      })}
    </svg>
  );
}
