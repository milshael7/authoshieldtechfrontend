// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — LIVE ENGINE + LIVE AI SIDEBAR
// STRUCTURED FOR REAL BACKEND CONNECTION
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

function n(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function timeframeToSeconds(tf) {
  switch (tf) {
    case "1M": return 60;
    case "5M": return 300;
    case "15M": return 900;
    case "30M": return 1800;
    case "1H": return 3600;
    case "4H": return 14400;
    case "1D": return 86400;
    default: return 60;
  }
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
  const wsRef = useRef(null);

  const [panelOpen, setPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("positions");
  const [timeframe, setTimeframe] = useState("1M");

  // ================= LIVE DATA STATES =================

  const [positions, setPositions] = useState([
    {
      symbol: "EURUSD",
      entry: 1.1360,
      current: 1.1384,
      size: 0.2,
      pnl: 340,
    }
  ]);

  const [orders, setOrders] = useState([
    {
      symbol: "GBPUSD",
      side: "BUY",
      entry: 1.2645,
      size: 0.3,
    }
  ]);

  const [news, setNews] = useState([
    {
      title: "US Retail Sales Rise 0.0% in March",
      body: "Inflation easing as consumer demand stabilizes."
    }
  ]);

  const [signal, setSignal] = useState({
    side: "BUY",
    confidence: 92,
    reason: "Bullish structure confirmed",
  });

  // ================= CHART INIT =================

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = createChart(containerRef.current, {
      layout: {
        background: { color: "#0f1626" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,.04)" },
        horzLines: { color: "rgba(255,255,255,.04)" },
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    seriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: "#16a34a",
      downColor: "#dc2626",
      borderVisible: true,
      wickVisible: true,
    });

    seedCandles();
    chartRef.current.timeScale().fitContent();

    return () => chartRef.current?.remove();
  }, []);

  function seedCandles() {
    const now = Math.floor(Date.now() / 1000);
    const tf = timeframeToSeconds(timeframe);
    const candles = [];
    let base = 1.1000;

    for (let i = 200; i > 0; i--) {
      const time = now - i * tf;
      const open = base;
      const close = open + (Math.random() - 0.5) * 0.01;
      const high = Math.max(open, close);
      const low = Math.min(open, close);
      candles.push({ time, open, high, low, close });
      base = close;
    }

    candleDataRef.current = candles;
    seriesRef.current.setData(candles);
  }

  // ================= UI =================

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0f1c", color: "#fff" }}>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 20 }}>

        {/* HEADER */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: 8,
          marginBottom: 10,
          borderBottom: "1px solid rgba(255,255,255,.06)"
        }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
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

        {/* CHART */}
        <div style={{
          flex: 1,
          background: "#111827",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,.08)"
        }}>
          <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        </div>

        {/* BOTTOM PANEL */}
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

          <div style={{ flex: 1, padding: 16 }}>

            {activeTab === "positions" && (
              positions.length === 0
                ? <div>No open positions</div>
                : positions.map((p, i) => (
                    <div key={i}>
                      {p.symbol} | Entry: {p.entry} | Current: {p.current} | Size: {p.size} | 
                      <span style={{ color: p.pnl >= 0 ? "#16a34a" : "#dc2626" }}>
                        {p.pnl >= 0 ? ` +$${p.pnl}` : ` -$${Math.abs(p.pnl)}`}
                      </span>
                    </div>
                  ))
            )}

            {activeTab === "orders" && (
              orders.length === 0
                ? <div>No pending orders</div>
                : orders.map((o, i) => (
                    <div key={i}>
                      {o.symbol} | {o.side} | Entry: {o.entry} | Size: {o.size}
                    </div>
                  ))
            )}

            {activeTab === "news" && (
              news.map((n, i) => (
                <div key={i}>
                  <div style={{ fontWeight: 600 }}>{n.title}</div>
                  <div style={{ opacity: 0.7 }}>{n.body}</div>
                </div>
              ))
            )}

            {activeTab === "signals" && (
              <div>
                <div style={{ fontWeight: 700 }}>
                  {signal.side} EURUSD
                </div>
                <div>Confidence: {signal.confidence}%</div>
                <div style={{ opacity: 0.7 }}>{signal.reason}</div>
              </div>
            )}

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
          <div style={{ fontWeight: 700 }}>AI Engine Status</div>
          <div style={{ marginTop: 10 }}>State: SCANNING MARKET</div>
          <div>Bias: Bullish</div>
          <div>Confidence: 82%</div>
          <div>Trades Today: 3 / 5</div>
        </div>
      )}

    </div>
  );
}
