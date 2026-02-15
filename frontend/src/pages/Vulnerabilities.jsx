import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function severityColor(sev) {
  if (sev === "critical") return "#ff4d4d";
  if (sev === "high") return "#ff9f43";
  if (sev === "medium") return "#ffd166";
  return "#5EC6FF";
}

/* ================= PAGE ================= */

export default function Vulnerabilities() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.vulnerabilities().catch(() => ({}));
      setItems(safeArray(res?.vulnerabilities));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    return {
      total: items.length,
      critical: items.filter(v => v?.severity === "critical").length,
      high: items.filter(v => v?.severity === "high").length,
      medium: items.filter(v => v?.severity === "medium").length,
      low: items.filter(v => v?.severity === "low").length,
    };
  }, [items]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ================= HEADER ================= */}
      <div>
        <h2 style={{ margin: 0 }}>Vulnerability Risk Matrix</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Exposure analysis and remediation prioritization
        </div>
      </div>

      {/* ================= SUMMARY CARDS ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
          gap: 18,
        }}
      >
        {Object.entries(summary).map(([key, value]) => (
          <div key={key} className="card">
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              {key.toUpperCase()}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ================= MAIN GRID ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24,
        }}
      >

        {/* ================= LIST ================= */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ maxHeight: 520, overflowY: "auto" }}>

            {loading ? (
              <div style={{ padding: 20 }}>Loading vulnerabilities...</div>
            ) : items.length === 0 ? (
              <div style={{ padding: 20 }}>No vulnerabilities found.</div>
            ) : (
              safeArray(items).map((v, idx) => (
                <div
                  key={v?.id || idx}
                  onClick={() => setSelected(v)}
                  style={{
                    padding: 18,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer",
                    background:
                      selected?.id === v?.id
                        ? "rgba(94,198,255,0.08)"
                        : "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{v?.title || "Unknown Vulnerability"}</strong>

                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: severityColor(v?.severity),
                      }}
                    >
                      {String(v?.severity || "low").toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>
                    Asset: {v?.asset || "Unknown"} • CVSS: {v?.score ?? "—"}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ================= DETAIL PANEL ================= */}
        <div className="card">
          {selected ? (
            <>
              <h3>{selected?.title}</h3>

              <div style={{ marginBottom: 10 }}>
                Severity:{" "}
                <span style={{ color: severityColor(selected?.severity) }}>
                  {String(selected?.severity || "low").toUpperCase()}
                </span>
              </div>

              <div style={{ marginBottom: 10 }}>
                Asset: {selected?.asset || "Unknown"}
              </div>

              <div style={{ marginBottom: 10 }}>
                CVSS Score: {selected?.score ?? "—"}
              </div>

              <div style={{ marginBottom: 16 }}>
                {selected?.description ||
                  "No detailed description provided."}
              </div>

              <button className="btn">Start Remediation</button>
              <button className="btn" style={{ marginLeft: 10 }}>
                Mark as Accepted Risk
              </button>
            </>
          ) : (
            <div style={{ opacity: 0.6 }}>
              Select a vulnerability to view risk details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
