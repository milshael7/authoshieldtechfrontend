import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function fmtPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${Math.round(x)}%`;
}

function gradeFromScore(score) {
  if (score >= 90)
    return { grade: "A", label: "Excellent", color: "#2bd576" };
  if (score >= 75)
    return { grade: "B", label: "Strong", color: "#5EC6FF" };
  if (score >= 60)
    return { grade: "C", label: "Moderate", color: "#ffd166" };
  return { grade: "D", label: "At Risk", color: "#ff5a5f" };
}

function riskTier(score) {
  if (score >= 90)
    return { level: "LOW", desc: "Hardened posture", color: "#2bd576" };
  if (score >= 75)
    return { level: "MODERATE", desc: "Stable with minor gaps", color: "#5EC6FF" };
  if (score >= 60)
    return { level: "ELEVATED", desc: "Security gaps detected", color: "#ffd166" };
  return { level: "CRITICAL", desc: "Immediate action required", color: "#ff5a5f" };
}

function buildRecommendations(domains) {
  if (!domains.length) return [];

  const sorted = [...domains].sort((a, b) => a.coverage - b.coverage);
  const weak = sorted.filter((d) => d.coverage < 75);

  return weak.slice(0, 3).map((d) => ({
    title: `Improve ${d.label}`,
    priority:
      d.coverage < 60
        ? "High Priority"
        : "Recommended Improvement",
    message:
      d.coverage < 60
        ? `Coverage is critically low. Immediate deployment of additional controls is advised to reduce exposure.`
        : `Coverage is below optimal levels. Strengthening this control will significantly improve your overall security posture.`,
  }));
}

export default function SecurityRadar() {
  const [status, setStatus] = useState("Loading…");
  const [posture, setPosture] = useState(null);
  const canvasRef = useRef(null);

  async function load() {
    try {
      const data = await api.postureSummary();
      setPosture(data);
      setStatus("LIVE");
    } catch (e) {
      console.error("SecurityRadar error:", e);
      setStatus("ERROR");
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener("security:refresh", handler);
    return () => window.removeEventListener("security:refresh", handler);
  }, []);

  const domains = useMemo(() => posture?.domains || [], [posture]);
  const score = posture?.score || 0;
  const gradeInfo = gradeFromScore(score);
  const tier = riskTier(score);
  const recommendations = buildRecommendations(domains);

  /* ================= RADAR DRAW ================= */

  useEffect(() => {
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
    bg.addColorStop(0, "rgba(20,25,35,0.7)");
    bg.addColorStop(1, "rgba(10,14,20,0.85)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cssW, cssH);

    const n = domains.length || 1;
    const cx = cssW * 0.5;
    const cy = cssH * 0.55;
    const R = Math.min(cssW, cssH) * 0.32;

    ctx.strokeStyle = "rgba(255,255,255,0.08)";
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

    ctx.fillStyle = "rgba(94,198,255,0.25)";
    ctx.strokeStyle = "rgba(94,198,255,0.95)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const d = domains[i];
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
  }, [domains]);

  /* ================= UI ================= */

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>
            Overall Security Score
          </div>

          <div
            style={{
              fontSize: 48,
              fontWeight: 900,
              color: gradeInfo.color,
            }}
          >
            {score}
          </div>

          <div style={{ fontSize: 14 }}>
            Grade {gradeInfo.grade} — {gradeInfo.label}
          </div>

          <div
            style={{
              marginTop: 10,
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              display: "inline-block",
              background: tier.color + "22",
              color: tier.color,
              border: `1px solid ${tier.color}55`,
            }}
          >
            {tier.level} RISK — {tier.desc}
          </div>
        </div>

        <span className={`badge ${status === "LIVE" ? "ok" : ""}`}>
          {status}
        </span>
      </div>

      <div style={{ marginTop: 20, height: 380 }}>
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

      {recommendations.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <h4 style={{ marginBottom: 12 }}>
            Executive Action Recommendations
          </h4>

          {recommendations.map((rec, i) => (
            <div
              key={i}
              style={{
                padding: 16,
                borderRadius: 14,
                marginBottom: 14,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontWeight: 700 }}>
                {rec.title}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {rec.priority}
              </div>
              <div style={{ marginTop: 6 }}>
                {rec.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
