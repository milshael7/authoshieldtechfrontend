// frontend/src/components/tools/ThreatIntelPanel.jsx
// Executive Threat Intelligence Console
// AuthoShield Tech SOC Layer

import React, { useState } from "react";

function severityColor(score) {
  if (score >= 80) return "#ff5a5f";
  if (score >= 60) return "#ffd166";
  return "#2bd576";
}

function severityLabel(score) {
  if (score >= 80) return "High Risk";
  if (score >= 60) return "Moderate Risk";
  return "Low Risk";
}

export default function ThreatIntelPanel() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!input.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/threat/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ value: input.trim() }),
      });

      const data = await res.json();
      setResult(data);
    } catch {
      setResult({
        ok: false,
        error: "Analysis failed",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="postureCard">
      <div className="postureTop">
        <div>
          <h2>Threat Intelligence Console</h2>
          <small>IOC / Domain / IP / Email Analyzer</small>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <input
          type="text"
          placeholder="Enter IP, domain, email, or hash..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.35)",
            color: "#fff",
            marginBottom: 12,
          }}
        />

        <button className="btn ok" onClick={analyze} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Threat"}
        </button>
      </div>

      {result && result.ok && (
        <div style={{ marginTop: 20 }}>
          <div style={{ marginBottom: 8 }}>
            <b>Type:</b> {result.type}
          </div>

          <div style={{ marginBottom: 8 }}>
            <b>Reputation Score:</b>{" "}
            <span
              style={{
                color: severityColor(result.score),
                fontWeight: 800,
              }}
            >
              {result.score}/100
            </span>
          </div>

          <div style={{ marginBottom: 8 }}>
            <b>Risk Level:</b>{" "}
            <span
              style={{
                color: severityColor(result.score),
                fontWeight: 700,
              }}
            >
              {severityLabel(result.score)}
            </span>
          </div>

          <div style={{ marginTop: 12 }}>
            <b>Analysis Summary:</b>
            <div style={{ marginTop: 6, opacity: 0.8 }}>
              {result.summary}
            </div>
          </div>
        </div>
      )}

      {result && !result.ok && (
        <div style={{ marginTop: 20 }} className="error">
          {result.error}
        </div>
      )}
    </div>
  );
}
