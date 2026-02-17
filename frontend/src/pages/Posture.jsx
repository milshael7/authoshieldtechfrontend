import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeStr(v, fallback = "—") {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function scoreFrom(checks = []) {
  if (!checks.length) return 0;
  const val = checks.reduce((s, c) => {
    if (c?.status === "ok") return s + 1;
    if (c?.status === "warn") return s + 0.5;
    return s;
  }, 0);
  return Math.round((val / checks.length) * 100);
}

/* ================= PAGE ================= */

export default function Posture() {
  const [summary, setSummary] = useState({});
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");

    try {
      const [s, c] = await Promise.all([
        api.postureSummary().catch(() => ({})),
        api.postureChecks().catch(() => ({})),
      ]);

      setSummary(s || {});
      setChecks(safeArray(c?.checks));
    } catch {
      setErr("Failed to load security posture");
      setSummary({});
      setChecks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const score = useMemo(() => scoreFrom(checks), [checks]);

  const degradedControls = checks.filter(
    (c) => c?.status && c.status !== "ok"
  );

  const severityCounts = useMemo(() => {
    const base = { critical: 0, high: 0, medium: 0, low: 0 };
    safeArray(checks).forEach((c) => {
      if (base[c?.severity] !== undefined) {
        base[c.severity]++;
      }
    });
    return base;
  }, [checks]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 32 }}>

      {/* ================= GLOBAL ADMIN STRIP ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 20,
        }}
      >
        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Global Companies</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {summary.totalCompanies ?? 0}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Small Companies</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {summary.totalSmallCompanies ?? 0}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Global Users</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {summary.totalUsers ?? 0}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>System Health</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {pct(score)}%
          </div>
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 1.2fr",
          gap: 28,
        }}
      >

        {/* LEFT PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          <div className="card" style={{ padding: 28 }}>
            <h2 style={{ margin: 0 }}>Enterprise Security Overview</h2>

            <div
              style={{
                marginTop: 20,
                height: 10,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct(score)}%`,
                  height: "100%",
                  background:
                    "linear-gradient(90deg,#5EC6FF,#7aa2ff)",
                }}
              />
            </div>

            <div style={{ marginTop: 14, opacity: 0.7 }}>
              Global infrastructure operational readiness
            </div>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <h3>Threat Severity Distribution</h3>

            {Object.entries(severityCounts).map(([level, count]) => (
              <div key={level} style={{ marginTop: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    opacity: 0.8,
                  }}
                >
                  <span>{level.toUpperCase()}</span>
                  <span>{count}</span>
                </div>

                <div
                  style={{
                    marginTop: 6,
                    height: 6,
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 999,
                  }}
                >
                  <div
                    style={{
                      width: `${pct(
                        (count / (checks.length || 1)) * 100
                      )}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: "#5EC6FF",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          <div className="card" style={{ padding: 28 }}>
            <h3>Admin Control Panel</h3>

            <div style={{ marginTop: 16, lineHeight: 2 }}>
              <div>Suspended Companies: {summary.suspendedCompanies ?? 0}</div>
              <div>Suspended Users: {summary.suspendedUsers ?? 0}</div>
              <div>Pending Escalations: {summary.pendingEscalations ?? 0}</div>
            </div>

            <button
              onClick={load}
              disabled={loading}
              className="btn"
              style={{ marginTop: 18 }}
            >
              {loading ? "Refreshing…" : "Refresh Global State"}
            </button>

            {err && (
              <div style={{ marginTop: 14, color: "#ff4d4d" }}>
                {err}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 28 }}>
            <h3>Escalation Feed</h3>

            {safeArray(checks)
              .slice(0, 5)
              .map((c, i) => (
                <div
                  key={i}
                  style={{
                    paddingBottom: 14,
                    marginBottom: 14,
                    borderBottom:
                      "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <strong>{safeStr(c?.title)}</strong>
                  <div
                    style={{
                      fontSize: 13,
                      opacity: 0.7,
                      marginTop: 4,
                    }}
                  >
                    {safeStr(c?.message)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
