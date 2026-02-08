import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function scoreFrom(checks = []) {
  if (!checks.length) return 0;
  const val = checks.reduce((s, c) => {
    if (c.status === "ok") return s + 1;
    if (c.status === "warn") return s + 0.5;
    return s;
  }, 0);
  return Math.round((val / checks.length) * 100);
}

/* ================= PAGE ================= */

export default function Posture() {
  const [summary, setSummary] = useState(null);
  const [checks, setChecks] = useState([]);
  const [recent, setRecent] = useState({ audit: [], notifications: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [s, c, r] = await Promise.all([
        api.postureSummary(),
        api.postureChecks(),
        api.postureRecent(50),
      ]);
      setSummary(s);
      setChecks(c?.checks || []);
      setRecent({
        audit: r?.audit || [],
        notifications: r?.notifications || [],
      });
    } catch (e) {
      setErr(e?.message || "Failed to load posture");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const score = useMemo(() => scoreFrom(checks), [checks]);

  const cover = useMemo(() => {
    const base = [
      { name: "Endpoint Security", val: 72 },
      { name: "Identity Protection", val: 64 },
      { name: "Email Security", val: 58 },
      { name: "Cloud Security", val: 61 },
    ];
    return base.map((x) => ({
      ...x,
      val: pct(x.val * 0.7 + score * 0.3),
    }));
  }, [score]);

  /* ================= UI ================= */

  return (
    <div className="posture-page">
      {/* ===== TOP SUMMARY ===== */}
      <section className="posture-summary">
        <div>
          <h2>Security Posture</h2>
          <small>
            {summary?.scope?.type
              ? `Scope: ${summary.scope.type}`
              : "Scope: —"}{" "}
            • Last update: {new Date().toLocaleTimeString()}
          </small>
        </div>

        <div className="score-card">
          <div className="score-ring">{pct(score)}</div>
          <div>
            <b>Overall Score</b>
            <div className="muted">
              {loading ? "Loading…" : err ? "Error" : "Live estimate"}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SCORE BAR ===== */}
      <div className="meter">
        <div style={{ width: `${pct(score)}%` }} />
      </div>

      {err && <p className="error">{err}</p>}

      {/* ===== COVERAGE ===== */}
      <section className="coverage-grid">
        {cover.map((x) => (
          <div key={x.name} className="coverage-card">
            <div className="coverage-top">
              <b>{x.name}</b>
              <small>{pct(x.val)}%</small>
            </div>
            <div className="coverBar">
              <div style={{ width: `${pct(x.val)}%` }} />
            </div>
          </div>
        ))}
      </section>

      {/* ===== RECOMMENDATIONS ===== */}
      <section className="card">
        <h3>Recommended Actions</h3>
        {checks.length === 0 && (
          <p className="muted">
            {loading ? "Loading…" : "No actions available."}
          </p>
        )}

        <ul className="list">
          {checks.slice(0, 6).map((c) => (
            <li key={c.id}>
              <span className={`dot ${c.status || "info"}`} />
              <div>
                <b>{c.title}</b>
                <div>
                  <small>{c.message}</small>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <button onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </section>
    </div>
  );
}
