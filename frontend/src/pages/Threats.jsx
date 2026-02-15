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

export default function Threats() {
  const [feed, setFeed] = useState([]);
  const [globalLevel, setGlobalLevel] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.threatFeed().catch(() => ({}));
      setFeed(safeArray(res?.threats));
      setGlobalLevel(pct(res?.globalThreatLevel ?? 65));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const attackVectors = useMemo(() => {
    const map = {};
    feed.forEach(t => {
      const type = t?.type || "unknown";
      map[type] = (map[type] || 0) + 1;
    });
    return Object.entries(map);
  }, [feed]);

  /* ================= UI ================= */

  return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* HEADER */}
      <div>
        <h2 style={{ margin: 0 }}>Threat Intelligence Center</h2>
        <div style={{ fontSize: 13, opacity: 0.6 }}>
          Global & external cyber threat monitoring
        </div>
      </div>

      {/* GLOBAL THREAT LEVEL */}
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0 }}>Global Threat Level</h3>
            <div style={{ fontSize: 13, opacity: 0.6 }}>
              Aggregated external intelligence signals
            </div>
          </div>

          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: `conic-gradient(#ff5a5f ${globalLevel * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            {globalLevel}%
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            height: 8,
            background: "rgba(255,255,255,.08)",
            borderRadius: 999,
            overflow: "hidden"
          }}
        >
          <div
            style={{
              width: `${globalLevel}%`,
              height: "100%",
              background: "linear-gradient(90deg,#ff5a5f,#ffd166)"
            }}
          />
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

        {/* ================= ACTIVE THREATS ================= */}
        <div className="card" style={{ padding: 24 }}>
          <h3>Active Threat Feed</h3>

          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>

            {safeArray(feed)
              .slice(0, 8)
              .map((t, i) => (
                <div
                  key={t?.id || i}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.08)"
                  }}
                >
                  <strong>{t?.title || "Emerging Threat"}</strong>
                  <div style={{ fontSize: 13, opacity: 0.7 }}>
                    {t?.description || "Threat intelligence summary unavailable"}
                  </div>
                </div>
              ))}

            {feed.length === 0 && (
              <div style={{ opacity: 0.6 }}>
                No active intelligence feed data
              </div>
            )}

          </div>
        </div>

        {/* ================= ATTACK VECTORS ================= */}
        <div className="card" style={{ padding: 24 }}>
          <h3>Attack Vectors</h3>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            {attackVectors.map(([type, count]) => (
              <div key={type}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{type.toUpperCase()}</span>
                  <strong>{count}</strong>
                </div>

                <div
                  style={{
                    marginTop: 6,
                    height: 6,
                    background: "rgba(255,255,255,.08)",
                    borderRadius: 999,
                    overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      width: `${pct((count / (feed.length || 1)) * 100)}%`,
                      height: "100%",
                      background: "linear-gradient(90deg,#5EC6FF,#7aa2ff)"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn"
            onClick={load}
            disabled={loading}
            style={{ marginTop: 22 }}
          >
            {loading ? "Refreshing…" : "Refresh Intelligence"}
          </button>
        </div>

      </div>

    </div>
  );
}
