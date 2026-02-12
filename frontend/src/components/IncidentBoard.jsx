// frontend/src/components/IncidentBoard.jsx
// Executive Incident Response Board
// SOC-grade UI
// No backend required yet

import React, { useState } from "react";

const MOCK_CASES = [
  {
    id: "INC-1042",
    company: "Atlas Financial",
    severity: "high",
    status: "Investigating",
    analyst: "J. Carter",
    summary: "Suspicious login attempt from foreign IP.",
    updated: "10 mins ago",
  },
  {
    id: "INC-1038",
    company: "NovaTech Systems",
    severity: "medium",
    status: "Open",
    analyst: "M. Silva",
    summary: "Malware signature detected on endpoint.",
    updated: "45 mins ago",
  },
  {
    id: "INC-1021",
    company: "BrightCore Health",
    severity: "low",
    status: "Resolved",
    analyst: "A. Reed",
    summary: "Phishing email reported and contained.",
    updated: "2 hrs ago",
  },
];

export default function IncidentBoard() {
  const [cases] = useState(MOCK_CASES);

  return (
    <div className="postureCard">
      <h3>Incident Response Board</h3>
      <small className="muted">
        Active security investigations across tenant environments
      </small>

      <div style={{ marginTop: 20 }}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Company</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Analyst</th>
              <th>Last Update</th>
            </tr>
          </thead>

          <tbody>
            {cases.map((c) => (
              <tr key={c.id}>
                <td><b>{c.id}</b></td>
                <td>{c.company}</td>
                <td>
                  <span style={severityStyle(c.severity)}>
                    {c.severity.toUpperCase()}
                  </span>
                </td>
                <td>{c.status}</td>
                <td>{c.analyst}</td>
                <td className="muted">{c.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function severityStyle(sev) {
  return {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background:
      sev === "high"
        ? "rgba(255,90,95,0.25)"
        : sev === "medium"
        ? "rgba(255,209,102,0.25)"
        : "rgba(43,213,118,0.25)",
    color:
      sev === "high"
        ? "#ff5a5f"
        : sev === "medium"
        ? "#ffd166"
        : "#2bd576",
  };
}
