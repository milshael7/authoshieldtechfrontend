import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { getToken } from "../../lib/api.js";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function apiBase() {
  return (
    (import.meta.env.VITE_API_BASE ||
      import.meta.env.VITE_BACKEND_URL ||
      "").trim()
  );
}

function fmtPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${Math.round(x)}%`;
}

export default function SecurityRadar() {

  const base = apiBase();

  const [status, setStatus] = useState("Loading…");
  const [posture, setPosture] = useState(null);
  const [history, setHistory] = useState([]);

  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  /* ================= LOAD DATA ================= */

  const load = useCallback(async () => {

    const token = getToken();

    if (!base || !token) {
      setStatus("NO AUTH");
      return;
    }

    try {

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [pRes, hRes] = await Promise.all([
        fetch(`${base}/api/security/posture`, { headers }),
        fetch(`${base}/api/security/score-history`, { headers }),
      ]);

      if (!pRes.ok) throw new Error("posture failed");

      const pData = await pRes.json().catch(() => ({}));
      const hData = await hRes.json().catch(() => ({}));

      setPosture(pData?.posture || null);
      setHistory(Array.isArray(hData?.history) ? hData.history : []);
      setStatus("LIVE");

    } catch {

      setStatus("ERROR");

    }

  }, [base]);

  useEffect(() => {

    load();

    intervalRef.current = setInterval(load, 15000);

    const refreshListener = () => load();
    window.addEventListener("security:refresh", refreshListener);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener("security:refresh", refreshListener);
    };

  }, [load]);

  const domains = useMemo(() => {

    const d = posture?.domains || [];

    return Array.isArray(d) ? d : [];

  }, [posture]);

  const score = posture?.score ?? 0;
  const tier = posture?.tier ?? "—";
  const risk = posture?.risk ?? "—";
  const trend = posture?.trend ?? "—";
  const volatility = posture?.volatility ?? "low";

  const maxIssues = useMemo(
    () => Math.max(1, ...domains.map((d) => Number(d?.issues) || 0)),
    [domains]
  );

  /* ================= RADAR DRAW ================= */

  const drawRadar = useCallback(() => {

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;

    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, cssW, cssH);

    const bg = ctx.createLinearGradient(0, 0, 0, cssH);
    bg.addColorStop(0, "rgba(15,20,30,0.8)");
    bg.addColorStop(1, "rgba(5,8,12,0.95)");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cssW, cssH);

    const n = domains.length || 6;

    const cx = cssW * 0.5;
    const cy = cssH * 0.55;

    const R = Math.min(cssW, cssH) * 0.34;

    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;

    for (let k = 1; k <= 5; k++) {

      const r = (R * k) / 5;

      ctx.beginPath();

      for (let i = 0; i < n; i++) {

        const a = (Math.PI * 2 * i) / n - Math.PI / 2;

        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

      }

      ctx.closePath();
      ctx.stroke();

    }

    if (!domains.length) return;

    ctx.fillStyle = "rgba(94,198,255,0.28)";
    ctx.strokeStyle = "rgba(94,198,255,0.95)";
    ctx.lineWidth = 2;

    ctx.beginPath();

    for (let i = 0; i < n; i++) {

      const d = domains[i] || {};

      const cov = clamp((Number(d.coverage) || 0) / 100, 0, 1);

      const a = (Math.PI * 2 * i) / n - Math.PI / 2;

      const x = cx + Math.cos(a) * R * cov;
      const y = cy + Math.sin(a) * R * cov;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < n; i++) {

      const d = domains[i] || {};

      const cov = clamp((Number(d.coverage) || 0) / 100, 0, 1);
      const issues = clamp(Number(d.issues) || 0, 0, 999);

      const a = (Math.PI * 2 * i) / n - Math.PI / 2;

      const x = cx + Math.cos(a) * R * cov;
      const y = cy + Math.sin(a) * R * cov;

      const sz = 3 + (issues / maxIssues) * 6;

      ctx.fillStyle = issues > 0 ? "#ff5a5f" : "#2bd576";

      ctx.beginPath();
      ctx.arc(x, y, sz, 0, Math.PI * 2);
      ctx.fill();

    }

  }, [domains, maxIssues]);

  useEffect(() => {
    drawRadar();
  }, [drawRadar]);

  /* redraw on resize */

  useEffect(() => {

    const handleResize = () => drawRadar();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);

  }, [drawRadar]);

  /* ================= UI ================= */

  return (
    <div className="card">

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 22,
        }}
      >
        <div>

          <div style={{ fontSize: 12, opacity: 0.6 }}>
            Enterprise Security Score
          </div>

          <div style={{ fontSize: 36, fontWeight: 900 }}>
            {score}
          </div>

          <div style={{ fontSize: 13, marginTop: 6 }}>
            Tier: <b>{tier}</b> • Risk: <b>{risk}</b> • Trend:{" "}
            <b>{String(trend).toUpperCase()}</b> • Volatility:{" "}
            <b>{String(volatility).toUpperCase()}</b>
          </div>

        </div>

        <span className={`badge ${status === "LIVE" ? "ok" : ""}`}>
          {status}
        </span>

      </div>

      <div style={{ height: 380 }}>

        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        />

      </div>

      <div style={{ marginTop: 22 }}>

        <table className="table">

          <thead>
            <tr>
              <th>Control Domain</th>
              <th>Coverage</th>
              <th>Open Gaps</th>
            </tr>
          </thead>

          <tbody>

            {domains.map((d) => (
              <tr key={d.key}>
                <td>{d.label}</td>
                <td>{fmtPct(d.coverage)}</td>
                <td>{d.issues}</td>
              </tr>
            ))}

            {!domains.length && (
              <tr>
                <td colSpan="3" style={{ opacity: 0.6 }}>
                  No posture data available.
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}
