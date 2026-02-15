import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeStr(v, fallback = "—") {
  return typeof v === "string" && v.trim() ? v : fallback;
}

/* ================= PAGE ================= */

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.policiesOverview().catch(() => ({}));
      setPolicies(safeArray(res?.policies));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: policies.length,
      approved: policies.filter(p => p.status === "approved").length,
      draft: policies.filter(p => p.status === "draft").length,
      expired: policies.filter(p => p.status === "expired").length,
    };
  }, [policies]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* HEADER */}
      <div>
        <h2 style={{ margin: 0 }}>Policies & Governance</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Policy lifecycle management and enforcement oversight
        </div>
      </div>

      {/* POLICY STATS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 20
        }}
      >
        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Total Policies</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{stats.total}</div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Approved</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#5EC6FF" }}>
            {stats.approved}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Draft</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ffd166" }}>
            {stats.draft}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Expired</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#ff5a5f" }}>
            {stats.expired}
          </div>
        </div>
      </div>

      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 24
        }}
      >

        {/* POLICY LIST */}
        <div className="card" style={{ padding: 24 }}>
          <h3>Policy Registry</h3>

          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            {safeArray(policies)
              .slice(0, 12)
              .map((p, i) => (
                <div
                  key={p?.id || i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: 14,
                    borderRadius: 12,
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.08)"
                  }}
                >
                  <div>
                    <strong>{safeStr(p?.title, "Policy Document")}</strong>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                      Owner: {safeStr(p?.owner, "Unassigned")}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 12,
                      padding: "6px 10px",
                      borderRadius: 999,
                      background:
                        p?.status === "approved"
                          ? "rgba(94,198,255,.15)"
                          : p?.status === "expired"
                          ? "rgba(255,90,95,.15)"
                          : "rgba(255,209,102,.15)"
                    }}
                  >
                    {safeStr(p?.status, "draft").toUpperCase()}
                  </span>
                </div>
              ))}

            {policies.length === 0 && (
              <div style={{ opacity: 0.6 }}>
                No policies registered
              </div>
            )}
          </div>
        </div>

        {/* WORKFLOW PANEL */}
        <div className="card" style={{ padding: 24 }}>
          <h3>Approval Workflow</h3>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "rgba(255,255,255,.05)"
              }}
            >
              <strong>Draft → Review</strong>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Awaiting stakeholder review
              </div>
            </div>

            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "rgba(255,255,255,.05)"
              }}
            >
              <strong>Review → Approval</strong>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Executive sign-off required
              </div>
            </div>

            <div
              style={{
                padding: 14,
                borderRadius: 12,
                background: "rgba(255,255,255,.05)"
              }}
            >
              <strong>Approval → Enforcement</strong>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                Policy distributed across systems
              </div>
            </div>
          </div>

          <button
            className="btn"
            onClick={load}
            disabled={loading}
            style={{ marginTop: 22 }}
          >
            {loading ? "Refreshing…" : "Reload Policies"}
          </button>
        </div>

      </div>

    </div>
  );
}
