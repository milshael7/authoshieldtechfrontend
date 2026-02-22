// frontend/src/components/SecurityPipeline.jsx
// Enterprise Security Coverage Pipeline — Dynamic Intelligence Version

import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import "./SecurityPipeline.css";

function mapStatusFromCoverage(coverage) {
  const c = Number(coverage) || 0;

  if (c >= 85) return "protected";
  if (c >= 65) return "monitoring";
  return "risk";
}

function statusLabel(status) {
  if (status === "protected") return "Protected";
  if (status === "monitoring") return "Monitoring";
  return "Attention Required";
}

export default function SecurityPipeline() {
  const [domains, setDomains] = useState([]);
  const [status, setStatus] = useState("Loading…");

  async function load() {
    try {
      const data = await api.postureSummary();
      const realDomains = Array.isArray(data?.domains)
        ? data.domains
        : [];

      const mapped = realDomains.map((d) => ({
        key: d.key || d.label,
        label: d.label || d.key || "Unknown",
        status: mapStatusFromCoverage(d.coverage),
      }));

      setDomains(mapped);
      setStatus("LIVE");
    } catch (e) {
      console.error("SecurityPipeline error:", e);
      setStatus("ERROR");
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="security-pipeline-wrapper">
      <div className="pipeline-header">
        <h3>Security Coverage Pipeline</h3>
        <small>
          Operational defense layers across your environment
        </small>
        <span className={`badge ${status === "LIVE" ? "ok" : ""}`}>
          {status}
        </span>
      </div>

      <div className="security-pipeline">
        {domains.map((p, index) => (
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

            {index !== domains.length - 1 && (
              <div className="pipeline-connector" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
