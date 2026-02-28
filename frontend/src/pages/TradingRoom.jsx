// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — LIVE TERMINAL + NEWS + SIGNALS
// SAME LAYOUT • PROFESSIONAL CANDLES • TOOL SIDEBAR ADDED
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

/* ================= SVG ICONS ================= */

const Icon = ({ children }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="rgba(255,255,255,.8)"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

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

  /* ================= CHART INIT ================= */

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
      priceFormat: {
        type: "price",
        precision: 5,
        minMove: 0.00001,
      }
    });

    chartRef.current.timeScale().applyOptions({
      barSpacing: 6,
      rightBarStaysOnScroll: true,
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
    const candles = [];
    let base = 1.1000;

    for (let i = 200; i > 0; i--) {
      const time = now - i * 3600;
      const open = base;
      const close = open + (Math.random() - 0.5) * 0.01;
      const high = Math.max(open, close) + Math.random() * 0.003;
      const low = Math.min(open, close) - Math.random() * 0.003;

      candles.push({ time, open, high, low, close });
      base = close;
    }

    candleDataRef.current = candles;
    seriesRef.current.setData(candles);
  }

  /* ================= UI ================= */

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "#0a0f1c",
      color: "#fff"
    }}>

      {/* LEFT RAIL — EXACT TOOL ORDER */}
      <div style={{
        width: 60,
        background: "#111827",
        borderRight: "1px solid rgba(255,255,255,.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 14,
        gap: 16
      }}>

        {/* Crosshair */}
        <Icon><line x1="4" y1="12" x2="20" y2="12"/><line x1="12" y1="4" x2="12" y2="20"/></Icon>

        {/* Trend Line */}
        <Icon><line x1="5" y1="19" x2="19" y2="5"/><circle cx="5" cy="19" r="1.5"/><circle cx="19" cy="5" r="1.5"/></Icon>

        {/* Brush */}
        <Icon><path d="M4 20c4-8 8-4 12-12"/></Icon>

        {/* Curve */}
        <Icon><path d="M4 16c4-8 8 8 16-4"/></Icon>

        {/* Text */}
        <Icon><line x1="4" y1="6" x2="20" y2="6"/><line x1="12" y1="6" x2="12" y2="20"/></Icon>

        {/* Pattern */}
        <Icon><circle cx="6" cy="6" r="1.5"/><circle cx="18" cy="6" r="1.5"/><circle cx="6" cy="18" r="1.5"/><circle cx="18" cy="18" r="1.5"/><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></Icon>

        {/* Parallel */}
        <Icon><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/></Icon>

        <div style={{ width:"60%", height:1, background:"rgba(255,255,255,.1)" }} />

        {/* Ruler */}
        <Icon><line x1="4" y1="16" x2="20" y2="8"/></Icon>

        {/* Zoom */}
        <Icon><circle cx="11" cy="11" r="6"/><line x1="20" y1="20" x2="16" y2="16"/></Icon>

        <div style={{ width:"60%", height:1, background:"rgba(255,255,255,.1)" }} />

        {/* Magnet */}
        <Icon><path d="M6 6v6a6 6 0 0 0 12 0V6"/></Icon>

        {/* Lock */}
        <Icon><rect x="6" y="10" width="12" height="10"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></Icon>

      </div>

      {/* CENTER */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: 20,
      }}>

        {/* TOP BAR — TOOLS INTEGRATED */}
        <div style={{
          height: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>

          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <div style={{fontWeight:700}}>
              EURUSD • 1D • PAPER
            </div>

            {/* Timeframe tools */}
            <div style={{ display:"flex", gap:10 }}>
              <button style={{background:"transparent", border:"none", color:"#fff", cursor:"pointer"}}>1m</button>
              <button style={{background:"transparent", border:"none", color:"#fff", cursor:"pointer"}}>30m</button>
              <button style={{background:"transparent", border:"none", color:"#fff", cursor:"pointer"}}>1h</button>
            </div>
          </div>

          <button
            onClick={() => setPanelOpen(!panelOpen)}
            style={{
              padding: "8px 16px",
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

      </div>

      {/* RIGHT PANEL */}
      {panelOpen && (
        <div style={{
          width: 360,
          background: "#111827",
          borderLeft: "1px solid rgba(255,255,255,.08)",
          padding: 20
        }}>
          <div style={{fontWeight:700, marginBottom:20}}>
            Execute Order
          </div>
          Trading controls ready for backend connection.
        </div>
      )}

    </div>
  );
}
