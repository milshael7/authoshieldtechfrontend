// frontend/src/components/SecurityPipeline.jsx
// Enterprise Security Coverage Pipeline
// Visual SOC Capability Map — Upgrade Version

import React from "react";
import "./SecurityPipeline.css";

/*
Status options:
- protected
- monitoring
- risk
*/

const PIPELINE = [
  { key: "EDR", label: "Endpoint Detection & Response", status: "protected" },
  { key: "ITDR", label: "Identity Threat Detection", status: "monitoring" },
  { key: "EMAIL", label: "Email Protection", status: "protected" },
  { key: "DATA", label: "Data Loss Prevention", status: "monitoring" },
  { key: "SAT", label: "Security Awareness Training", status: "protected" },
  { key: "DARK_WEB", label: "Dark Web Monitoring", status: "risk" },
];

export default function SecurityPipeline() {
  return (
    <div className="security-pipeline-wrapper">
      <div className="pipeline-header">
        <h3>Security Coverage Pipeline</h3>
        <small>Operational defense layers across your environment</small>
      </div>

      <div className="security-pipeline">
        {PIPELINE.map((p, index) => (
          <div key={p.key} className="pipeline-item">
            <div className={`pipeline-node ${p.status}`}>
              <span className="pipeline-dot" />
            </div>

            <div className="pipeline-text">
              <b>{p.label}</b>
              <span className={`pipeline-status ${p.status}`}>
                {statusLabel(p.status)}
              </span>
            </div>

            {index !== PIPELINE.length - 1 && (
              <div className="pipeline-connector" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function statusLabel(status) {
  if (status === "protected") return "Protected";
  if (status === "monitoring") return "Monitoring";
  return "Attention Required";
}
