// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — LIVE ENGINE + LIVE AI SIDEBAR
// HEADER ALIGNMENT FIXED + PROFESSIONAL STATUS PANEL
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

  // ================= TABLE STYLES =================

  const tableHeader = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
    fontWeight: 600,
    paddingBottom: 8,
    borderBottom: "1px solid rgba(255,255,255,.1)",
    marginBottom: 10,
  };

  const tableRow = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,.05)",
    alignItems: "center",
  };

  const cancelBtn = {
    padding: "4px 10px",
    background: "#dc2626",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  };

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
      rightPriceScale: {
        borderColor: "rgba(255,255,255,.1)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,.1)",
        timeVisible: true,
        rightBarStaysOnScroll: true,
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    seriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: "#16a34a",
      downColor: "#dc2626",
      wickUpColor: "#16a34a",
      wickDownColor: "#dc2626",
      borderUpColor: "#16a34a",
      borderDownColor: "#dc2626",
      borderVisible: true,
      wickVisible: true,
      priceLineVisible: true,
      lastValueVisible: true,
    });

    seedCandles();
    chartRef.current.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      chartRef.current.applyOptions({ width, height });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chartRef.current?.remove();
    };
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

  useEffect(() => {
    const url = buildWsUrl();
    if (!url) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data?.price) return;
        updateCandle(n(data.price));
      } catch {}
    };

    return () => ws.close();
  }, [timeframe]);

  function animatePrice(from, to, onUpdate) {
    const duration = 120;
    const start = performance.now();
    function frame(now) {
      const progress = Math.min((now - start) / duration, 1);
      const value = from + (to - from) * progress;
      onUpdate(value);
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function updateCandle(price) {
    if (!seriesRef.current) return;

    const tfSeconds = timeframeToSeconds(timeframe);
    const now = Math.floor(Date.now() / 1000);
    const bucket = Math.floor(now / tfSeconds) * tfSeconds;

    const last = candleDataRef.current[candleDataRef.current.length - 1];
    if (!last) return;

    if (last.time === bucket) {
      animatePrice(last.close, price, (p) => {
        last.high = Math.max(last.high, p);
        last.low = Math.min(last.low, p);
        last.close = p;
        seriesRef.current.update({ ...last });
      });
    } else {
      const newCandle = {
        time: bucket,
        open: last.close,
        high: price,
        low: price,
        close: price,
      };

      candleDataRef.current.push(newCandle);
      seriesRef.current.update(newCandle);
    }

    chartRef.current.timeScale().scrollToRealTime();
  }

  // ================= STATUS ROW COMPONENT =================

  function StatusRow({ label, value, color }) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 13,
        paddingBottom: 6,
        borderBottom: "1px solid rgba(255,255,255,.05)"
      }}>
        <span style={{ opacity: 0.6 }}>{label}</span>
        <span style={{ color: color || "#fff", fontWeight: 600 }}>
          {value}
        </span>
      </div>
    );
  }

  // ================= UI =================

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0f1c", color: "#fff" }}>

      <div style={{ width: 60, background: "#111827", borderRight: "1px solid rgba(255,255,255,.08)" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 20 }}>

        {/* ===== FIXED HEADER ===== */}
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

        {/* ===== CHART ===== */}
        <div style={{
          flex: 1,
          background: "#111827",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,.08)"
        }}>
          <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        </div>

        {/* ===== BOTTOM PANEL (UNCHANGED) ===== */}
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
            {activeTab === "positions" && <div>No open positions</div>}
            {activeTab === "orders" && <div>No pending orders</div>}
            {activeTab === "news" && <div>News feed active</div>}
            {activeTab === "signals" && <div>AI Signal: BUY • Confidence: 82%</div>}
          </div>
        </div>

      </div>

      {/* ===== RIGHT SIDEBAR ===== */}
      {panelOpen && (
        <div style={{
          width: 360,
          background: "#111827",
          borderLeft: "1px solid rgba(255,255,255,.08)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 18
        }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            AI Engine Status
          </div>

          <StatusRow label="State" value="SCANNING MARKET" color="#22c55e" />
          <StatusRow label="Bias" value="Bullish" />
          <StatusRow label="Confidence" value="82%" />
          <StatusRow label="Trades Today" value="3 / 5" />
          <StatusRow label="Risk Mode" value="Moderate" />
          <StatusRow label="Spread" value="0.8 pips" />
          <StatusRow label="Latency" value="24ms" />
          <StatusRow label="Last Action" value="02:31:08" />
        </div>
      )}

    </div>
  );
}
