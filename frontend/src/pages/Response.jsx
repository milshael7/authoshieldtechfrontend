import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

/* ================= HELPERS ================= */

function pct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function money(v) {
  if (!Number.isFinite(Number(v))) return "—";
  return `$${Number(v).toFixed(2)}`;
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

/* ================= PAGE ================= */

export default function Reports() {
  const [summary, setSummary] = useState({});
  const [checks, setChecks] = useState([]);
  const [trading, setTrading] = useState({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [s, c, t] = await Promise.all([
        api.postureSummary().catch(() => ({})),
        api.postureChecks().catch(() => ({})),
        fetch("/api/trading/paper/snapshot")
          .then(r => r.json())
          .catch(() => ({})),
      ]);

      setSummary(s || {});
      setChecks(safeArray(c?.checks));
      setTrading(t?.snapshot || {});
    } catch {
      setSummary({});
      setChecks([]);
      setTrading({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const securityScore = useMemo(() => {
    if (!checks.length) return 0;
    const val = checks.reduce((s, c) => {
      if (c?.status === "ok") return s + 1;
      if (c?.status === "warn") return s + 0.5;
      return s;
    }, 0);
    return Math.round((val / checks.length) * 100);
  }, [checks]);

  const highRisk = checks.filter(c => c?.status !== "ok").length;

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ================= HEADER ================= */}
      <div>
        <h2 style={{ margin: 0 }}>Executive Intelligence Overview</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          High-level security & trading performance summary
        </div>
      </div>

      {/* ================= SCORE STRIP ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
          gap: 20,
        }}
      >
        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Security Score</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>
            {pct(securityScore)}%
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>High-Risk Controls</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>
            {highRisk}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Trading Equity</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>
            {money(trading?.equity)}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 12, opacity: 0.6 }}>Active Positions</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>
            {trading?.position ? 1 : 0}
          </div>
        </div>
      </div>

      {/* ================= STRATEGIC SUMMARY ================= */}
      <div className="card">
        <h3>Strategic Risk Summary</h3>

        {loading ? (
          <div>Analyzing...</div>
        ) : (
          <>
            <p style={{ opacity: 0.85 }}>
              Overall security posture is currently operating at{" "}
              <strong>{pct(securityScore)}%</strong>.
              {securityScore >= 85
                ? " Risk exposure is controlled."
                : securityScore >= 65
                ? " Moderate exposure detected."
                : " Elevated exposure requires executive attention."}
            </p>

            <p style={{ opacity: 0.85 }}>
              {highRisk > 0
                ? `${highRisk} security controls require review.`
                : "All critical security controls are stable."}
            </p>

            <p style={{ opacity: 0.85 }}>
              Trading equity currently stands at{" "}
              <strong>{money(trading?.equity)}</strong>.
              {trading?.equity > 0
                ? " Portfolio is operational."
                : " Trading engine inactive or initializing."}
            </p>
          </>
        )}
      </div>

      {/* ================= ACTION PANEL ================= */}
      <div className="card">
        <h3>Executive Actions</h3>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <button className="btn">Generate PDF Report</button>
          <button className="btn">Export Security Metrics</button>
          <button className="btn">Export Trading Metrics</button>
          <button className="btn">Schedule Board Summary</button>
        </div>
      </div>
    </div>
  );
}
