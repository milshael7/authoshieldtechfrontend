// frontend/src/components/SecurityPipeline.jsx
// Security Coverage Pipeline — VISUAL BASELINE
// Blueprint-aligned (EDR / ITDR / Email / Data / SAT / Dark Web)
// UI-only, no logic, no API

import React from "react";
import "./SecurityPipeline.css";

const PIPELINE = [
  { key: "EDR", label: "EDR" },
  { key: "ITDR", label: "ITDR" },
  { key: "EMAIL", label: "EMAIL" },
  { key: "DATA", label: "DATA" },
  { key: "SAT", label: "SAT" },
  { key: "DARK_WEB", label: "DARK WEB" },
];

export default function SecurityPipeline() {
  return (
    <div className="security-pipeline">
      {PIPELINE.map((p) => (
        <div key={p.key} className="pipeline-item">
          <div className="pipeline-node">
            <span className="pipeline-dot" />
          </div>
          <span className="pipeline-label">{p.label}</span>
        </div>
      ))}
    </div>
  );
}
