import React from "react";

export default function IncidentModal({ incident, onClose }) {
  if (!incident) return null;

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={header}>
          <div>
            <h3>{incident.title}</h3>
            <div style={meta}>
              Severity: <b>{incident.severity}</b> • 
              Status: <b>{incident.status}</b>
            </div>
          </div>

          <button style={closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={section}>
          <h4>Description</h4>
          <p>{incident.description}</p>
        </div>

        <div style={section}>
          <h4>Impact Assessment</h4>
          <p>
            This incident has been classified as{" "}
            <b>{incident.severity}</b>.
            Immediate analyst review is recommended.
          </p>
        </div>

        <div style={section}>
          <h4>Recommended Action</h4>
          <ul>
            <li>Review affected assets</li>
            <li>Isolate impacted endpoints if necessary</li>
            <li>Escalate if lateral movement is detected</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.65)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modal = {
  width: "90%",
  maxWidth: 700,
  background: "rgba(15,15,20,0.95)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 16,
  padding: 24,
  color: "#fff",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
};

const meta = {
  fontSize: 13,
  opacity: 0.7,
  marginTop: 4,
};

const section = {
  marginTop: 20,
};

const closeBtn = {
  background: "transparent",
  border: "none",
  color: "#fff",
  fontSize: 18,
  cursor: "pointer",
};
