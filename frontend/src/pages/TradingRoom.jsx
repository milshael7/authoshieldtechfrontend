// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — NEWS PANEL UPGRADE
// SAME STRUCTURE • NO SIZE CHANGES
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { getSavedUser, getToken } from "../lib/api.js";
import { Navigate } from "react-router-dom";

function buildWsUrl() {
  const token = getToken();
  if (!token) return null;
  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  return `${protocol}${window.location.host}/ws/market?token=${encodeURIComponent(token)}`;
}

export default function TradingRoom() {

  const user = getSavedUser();
  const role = String(user?.role || "").toLowerCase();
  if (!user || (role !== "admin" && role !== "manager")) {
    return <Navigate to="/admin" replace />;
  }

  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const containerRef = useRef(null);
  const candleDataRef = useRef([]);

  const [panelOpen, setPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("positions");
  const [timeframe] = useState("1M");

  /* ================= MOCK NEWS DATA ================= */

  const [news] = useState([
    {
      id: 1,
      title: "US CPI Comes in Higher Than Expected",
      impact: "HIGH",
      sentiment: "Bearish",
      time: "2 min ago"
    },
    {
      id: 2,
      title: "Federal Reserve Signals Possible Rate Pause",
      impact: "MEDIUM",
      sentiment: "Bullish",
      time: "15 min ago"
    },
    {
      id: 3,
      title: "Oil Prices Rise Amid Supply Concerns",
      impact: "LOW",
      sentiment: "Neutral",
      time: "1 hr ago"
    }
  ]);

  /* ================= CHART INIT ================= */

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = createChart(containerRef.current, {
      layout: {
        background: { color: "#0f1626" },
        textColor: "#d1d5db",
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    seriesRef.current = chartRef.current.addCandlestickSeries();

    const now = Math.floor(Date.now() / 1000);
    const candles = [];
    let base = 1.1000;

    for (let i = 200; i > 0; i--) {
      const time = now - i * 60;
      const open = base;
      const close = open + (Math.random() - 0.5) * 0.01;
      const high = Math.max(open, close);
      const low = Math.min(open, close);
      candles.push({ time, open, high, low, close });
      base = close;
    }

    candleDataRef.current = candles;
    seriesRef.current.setData(candles);

  }, []);

  /* ================= UI ================= */

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0f1c", color: "#fff" }}>

      <div style={{ width: 60, background: "#111827", borderRight: "1px solid rgba(255,255,255,.08)" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 20 }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 28 }}>
          <div style={{ fontWeight: 700 }}>
            EURUSD • {timeframe} • LIVE
          </div>

          <button
            onClick={() => setPanelOpen(!panelOpen)}
            style={{
              padding: "6px 14px",
              background: "#1e2536",
              border: "1px solid rgba(255,255,255,.1)",
              cursor: "pointer"
            }}
          >
            Execute Order
          </button>
        </div>

        <div style={{
          flex: 1,
          background: "#111827",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,.08)",
          marginTop: 10
        }}>
          <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        </div>

        {/* ================= BOTTOM PANEL ================= */}

        <div style={{
          height: 220,
          marginTop: 20,
          background: "#111827",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,.08)",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
            {["positions","orders","news","signals"].map(tab => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "12px 18px",
                  cursor: "pointer",
                  background: activeTab === tab ? "#1e2536" : "transparent",
                  fontWeight: activeTab === tab ? 700 : 400
                }}
              >
                {tab.toUpperCase()}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>

            {activeTab === "news" && news.map(item => (
              <div key={item.id} style={{
                marginBottom: 12,
                paddingBottom: 8,
                borderBottom: "1px solid rgba(255,255,255,.05)"
              }}>
                <div style={{ fontWeight: 600 }}>{item.title}</div>

                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  {item.time}
                </div>

                <div style={{ marginTop: 6, display: "flex", gap: 10 }}>
                  <span style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    background:
                      item.impact === "HIGH"
                        ? "#dc2626"
                        : item.impact === "MEDIUM"
                        ? "#d97706"
                        : "#374151",
                    borderRadius: 4
                  }}>
                    {item.impact}
                  </span>

                  <span style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    background:
                      item.sentiment === "Bullish"
                        ? "#16a34a"
                        : item.sentiment === "Bearish"
                        ? "#dc2626"
                        : "#6b7280",
                    borderRadius: 4
                  }}>
                    {item.sentiment}
                  </span>
                </div>
              </div>
            ))}

            {activeTab !== "news" && <div>No data available</div>}

          </div>
        </div>

      </div>

      {panelOpen && (
        <div style={{
          width: 360,
          background: "#111827",
          borderLeft: "1px solid rgba(255,255,255,.08)",
          padding: 20
        }}>
          <div style={{ fontWeight: 700, marginBottom: 20 }}>
            Execute Order
          </div>
          Trading controls ready.
        </div>
      )}

    </div>
  );
}
