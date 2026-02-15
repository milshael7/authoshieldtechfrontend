import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

/* ================= PAGE ================= */

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api.policies().catch(() => ({}));
      setPolicies(safeArray(data?.policies));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totalPolicies = policies.length;

  const acknowledgedRate = useMemo(() => {
    if (!policies.length) return 0;

    const totalUsers = policies.reduce(
      (acc, p) => acc + (p?.totalUsers || 0),
      0
    );

    const acknowledgedUsers = policies.reduce(
      (acc, p) => acc + (p?.acknowledgedUsers || 0),
      0
    );

    if (!totalUsers) return 0;

    return Math.round((acknowledgedUsers / totalUsers) * 100);
  }, [policies]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* HEADER */}
      <div>
        <h2 style={{ margin: 0 }}>Policies Governance Center</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Internal security controls & compliance governance
        </div>
      </div>

      {/* SUMMARY STRIP */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 18
        }}
      >
        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Total Policies
          </div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>
            {totalPolicies}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Acknowledgement Rate
          </div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>
            {acknowledgedRate}%
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Governance Status
          </div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>
            {acknowledgedRate >= 85 ? "Healthy" : "Review Needed"}
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

        {/* ================= POLICY LIST ================= */}
        <div className="card">
          <h3>Policy Library</h3>

          {loading ? (
            <div>Loading policies...</div>
          ) : policies.length === 0 ? (
            <div style={{ opacity: 0.6 }}>
              No policies configured.
            </div>
          ) : (
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 18 }}>
              {policies.map((p, index) => {
                const rate = pct(
                  (p?.acknowledgedUsers || 0) /
                  (p?.totalUsers || 1) *
                  100
                );

                return (
                  <div
                    key={p?.id || index}
                    style={{
                      padding: 16,
                      borderRadius: 14,
                      background: "rgba(255,255,255,.04)",
                      border: "1px solid rgba(255,255,255,.08)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>{p?.title || "Policy"}</strong>
                      <span>v{p?.version || "1.0"}</span>
                    </div>

                    <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
                      {p?.description || "No description available"}
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        height: 8,
                        background: "rgba(255,255,255,.08)",
                        borderRadius: 999,
                        overflow: "hidden"
                      }}
                    >
                      <div
                        style={{
                          width: `${rate}%`,
                          height: "100%",
                          background:
                            rate >= 85
                              ? "linear-gradient(90deg,#2bd576,#5EC6FF)"
                              : "linear-gradient(90deg,#ff5a5f,#ffd166)"
                        }}
                      />
                    </div>

                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>
                      {p?.acknowledgedUsers || 0} /{" "}
                      {p?.totalUsers || 0} acknowledged
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= ACTION PANEL ================= */}
        <div className="card">
          <h3>Governance Actions</h3>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>

            <div>
              <strong>Issue New Policy</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Publish updated internal security policies.
              </div>
            </div>

            <div>
              <strong>Track Acknowledgements</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Monitor which users have not signed.
              </div>
            </div>

            <div>
              <strong>Version Control</strong>
              <div style={{ fontSize: 13, opacity: 0.7 }}>
                Maintain historical policy revisions.
              </div>
            </div>

            <button className="btn" onClick={load}>
              Refresh Policies
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}
