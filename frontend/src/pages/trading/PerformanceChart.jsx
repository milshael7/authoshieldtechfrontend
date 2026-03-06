import React from "react";

/*
  PerformanceChart.jsx
  - Lightweight SVG equity curve
  - No chart libraries
  - Handles empty datasets safely
  - Displays current value
*/

export default function PerformanceChart({
  scalpHistory = [],
  sessionHistory = [],
}) {

  const width = 600;
  const height = 220;
  const padding = 30;

  const allValues = [...scalpHistory, ...sessionHistory];

  const max = allValues.length
    ? Math.max(...allValues)
    : 1000;

  const min = allValues.length
    ? Math.min(...allValues)
    : 0;

  const range = max - min || 1;

  function normalize(value) {
    return (
      height -
      padding -
      ((value - min) / range) * (height - padding * 2)
    );
  }

  function buildPath(history) {

    if (!history || history.length === 0) return "";

    const step =
      (width - padding * 2) /
      (history.length - 1 || 1);

    return history
      .map((value, i) => {

        const x = padding + i * step;
        const y = normalize(value);

        return `${i === 0 ? "M" : "L"} ${x} ${y}`;

      })
      .join(" ");

  }

  const lastValue =
    sessionHistory[sessionHistory.length - 1] ||
    scalpHistory[scalpHistory.length - 1] ||
    0;

  return (

    <div>

      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >

        {/* GRID */}

        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="rgba(255,255,255,.1)"
        />

        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="rgba(255,255,255,.1)"
        />

        {/* SCALP LINE */}

        <path
          d={buildPath(scalpHistory)}
          fill="none"
          stroke="#5EC6FF"
          strokeWidth="2"
        />

        {/* SESSION LINE */}

        <path
          d={buildPath(sessionHistory)}
          fill="none"
          stroke="#9B7CFF"
          strokeWidth="2"
        />

      </svg>

      {/* CURRENT VALUE */}

      <div
        style={{
          marginTop: 6,
          fontSize: 12,
          opacity: 0.7
        }}
      >

        Current Equity: ${Number(lastValue).toFixed(2)}

      </div>

    </div>

  );

}
