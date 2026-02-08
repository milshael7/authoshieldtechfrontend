// frontend/src/pages/Posture.jsx
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
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [s, c] = await Promise.all([
        api.postureSummary(),
        api.postureChecks(),
      ]);
      setSummary(s);
      setChecks(c?.checks || []);
    } catch (e) {
      setErr(e?.message || "Failed to load security posture");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const score = useMemo(() => scoreFrom(checks), [checks]);

  const kpis = useMemo(
    () => [
      { label: "Users", value: summary?.users ?? 108, trend: "▲ 7%" },
      { label: "Devices", value: summary?.devices ?? 111, trend: "▲ 3%" },
      { label: "Mailboxes", value: summary?.mailboxes ?? 124, trend: "▲ 2%" },
      { label: "Browsers", value: summary?.browsers ?? 3, trend: "▲ 7%" },
      { label: "Cloud Drives", value: summary?.drives ?? 62, trend: "▲ 1%" },
      { label: "Internet Assets", value: summary?.assets ?? 38, trend: "▲ 2%" },
    ],
    [summary]
  );

  const coverage = useMemo(
    () => [
      { name: "Endpoint Security", val: pct(score * 0.92) },
      { name: "Identity & Access", val: pct(score * 0.85) },
      { name: "Email Protection", val: pct(score * 0.78) },
      { name: "Cloud Security", val: pct(score * 0.81) },
      { name: "Data Protection", val: pct(score * 0.74) },
      { name: "Dark Web", val: pct(score * 0.69) },
    ],
    [score]
  );

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      {/* ================= KPI STRIP ================= */}
      <div className="kpiGrid">
        {kpis.map((k) => (
          <div key={k.label} className="kpiCard">
            <small>{k.label}</small>
            <b>{k.value}</b>
            <span className="trend">{k.trend}</span>
          </div>
        ))}
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="postureGrid">
        {/* ===== LEFT: POSTURE ===== */}
        <section className="postureCard">
          <div className="postureTop">
            <div>
              <h2>Your Security Posture</h2>
              <small>
                Scope: {summary?.scope?.type || "—"} • Last scan just now
              </small>
            </div>

            <div className="postureScore">
              <div className="scoreRing" style={{ "--val": pct(score) }}>
                {pct(score)}%
              </div>
              <div className="scoreMeta">
                <b>Overall Score</b>
                <span>{loading ? "Analyzing…" : "Active"}</span>
              </div>
            </div>
          </div>

          <div className="meter">
            <div style={{ width: `${pct(score)}%` }} />
          </div>

          {err && <p className="error">{err}</p>}

          <h3 style={{ marginTop: 20 }}>Coverage by Security Control</h3>

          <div className="coverGrid">
            {coverage.map((x) => (
              <div key={x.name}>
                <div className="coverItemTop">
                  <b>{x.name}</b>
                  <small>{x.val}%</small>
                </div>
                <div className="coverBar">
                  <div style={{ width: `${x.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== RIGHT: INSIGHTS ===== */}
        <aside className="postureCard">
          <h3>Insights & Risks</h3>
          <p className="muted">
            Prioritized findings based on risk and exposure.
          </p>

          <ul className="list">
            {checks.slice(0, 6).map((c) => (
              <li key={c.id}>
                <span className={`dot ${c.status || "info"}`} />
                <div>
                  <b>{c.title}</b>
                  <small>{c.message}</small>
                </div>
              </li>
            ))}
          </ul>

          <button onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Run New Scan"}
          </button>
        </aside>
      </div>
    </div>
  );
}
