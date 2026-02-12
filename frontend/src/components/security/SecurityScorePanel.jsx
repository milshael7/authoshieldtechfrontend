import React, { useEffect, useState } from "react";

function apiBase() {
  return (
    (import.meta.env.VITE_API_BASE ||
      import.meta.env.VITE_BACKEND_URL ||
      "").trim()
  );
}

function trendArrow(trend) {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
}

function trendColor(trend) {
  if (trend === "up") return "#2bd576";
  if (trend === "down") return "#ff5a5f";
  return "#ffd166";
}

export default function SecurityScorePanel() {
  const [posture, setPosture] = useState(null);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("Loading");

  useEffect(() => {
    const base = apiBase();
    if (!base) {
      setStatus("Missing API");
      return;
    }

    async function load() {
      try {
        const p = await fetch(`${base}/api/security/posture`, {
          credentials: "include",
        }).then((r) => r.json());

        const h = await fetch(`${base}/api/security/score-history`, {
          credentials: "include",
        }).then((r) => r.json());

        setPosture(p.posture);
        setHistory(h.history || []);
        setStatus("LIVE");
      } catch {
        setStatus("ERROR");
      }
    }

    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  const score = posture?.score || 0;
  const tier = posture?.tier || "Unknown";
  const risk = posture?.risk || "Unknown";
  const trend = posture?.trend || "stable";

  const lastFive = history.slice(-5);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, opacity: 0.6 }}>
            Executive Security Rating
          </div>
          <div style={{ fontSize: 56, fontWeight: 900 }}>
            {score}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: trendColor(trend),
            }}
          >
            {trendArrow(trend)}
          </div>
          <div
            style={{
              marginTop: 6,
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              fontWeight: 700,
            }}
          >
            {tier}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.6 }}>
            Risk Level: {risk}
          </div>
        </div>
      </div>

      {/* Mini Trend Bar */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: 24,
          alignItems: "flex-end",
          height: 60,
        }}
      >
        {lastFive.map((entry, i) => (
          <div
            key={i}
            style={{
              width: 16,
              height: `${entry.score || 0}%`,
              background:
                entry.score >= 75
                  ? "#2bd576"
                  : entry.score >= 50
                  ? "#ffd166"
                  : "#ff5a5f",
              borderRadius: 6,
              transition: "all .3s ease",
            }}
            title={`Score: ${entry.score}`}
          />
        ))}
      </div>

      <div style={{ marginTop: 18, fontSize: 13, opacity: 0.7 }}>
        Score recalculates automatically when controls are installed or removed.
        Trend reflects change from last assessment window.
      </div>

      <div style={{ marginTop: 12 }}>
        <span className={`badge ${status === "LIVE" ? "ok" : ""}`}>
          {status}
        </span>
      </div>
    </div>
  );
}
