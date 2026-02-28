// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — LIVE TERMINAL + NEWS + SIGNALS
// SAME LAYOUT • UPGRADED PROFESSIONAL CANDLES ONLY
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

    // 🔥 PROFESSIONAL CANDLE STYLE (NO SIZE CHANGES)
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

  /* ================= SEED DATA ================= */

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

  /* ================= LIVE WS ================= */

  useEffect(() => {
    const wsUrl = buildWsUrl();
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "tick") {
          updateCandle(msg.price, msg.ts);
        }
      } catch {}
    };

    return () => ws.close();
  }, []);

  function updateCandle(price, ts) {
    const time = Math.floor(n(ts) / 1000);
    const p = n(price);
    const last = candleDataRef.current[candleDataRef.current.length - 1];

    if (!last || time > last.time) {
      const newCandle = { time, open: p, high: p, low: p, close: p };
      candleDataRef.current.push(newCandle);
      seriesRef.current.update(newCandle);
    } else {
      last.high = Math.max(last.high, p);
      last.low = Math.min(last.low, p);
      last.close = p;
      seriesRef.current.update(last);
    }
  }

  /* ================= UI ================= */

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      background: "#0a0f1c",
      color: "#fff"
    }}>

      {/* LEFT RAIL */}
      <div style={{
        width: 60,
        background: "#111827",
        borderRight: "1px solid rgba(255,255,255,.08)",
      }} />

      {/* CENTER */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: 20,
      }}>

        {/* TOP BAR */}
        <div style={{
          height: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{fontWeight:700}}>
            EURUSD • 1D • PAPER
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

          <div style={{
            display: "flex",
            borderBottom: "1px solid rgba(255,255,255,.08)"
          }}>
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
            {activeTab === "positions" && <div>No open positions</div>}
            {activeTab === "orders" && <div>No pending orders</div>}
            {activeTab === "news" && <div>News feed active</div>}
            {activeTab === "signals" && <div>AI Signal: BUY • Confidence: 82%</div>}
          </div>

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
