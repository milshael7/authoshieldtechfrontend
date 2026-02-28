// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — CLEAN BASE + PROFESSIONAL TOOLS
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
  const [timeframe, setTimeframe] = useState("1D");
  const [candleType, setCandleType] = useState("candles");

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

      {/* LEFT RAIL (UNCHANGED SIZE) */}
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
          display: "flex",
          flexDirection: "column",
          gap: 6
        }}>

          {/* ROW 1 */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: 28
          }}>
            <div style={{fontWeight:700}}>
              EURUSD • {timeframe} • PAPER
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

          {/* ROW 2 — TOOLS */}
          <div style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,.05)",
            paddingTop: 6,
            fontSize: 13
          }}>

            {["1M","5M","15M","30M","1H","4H","1D"].map(tf => (
              <div
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  cursor: "pointer",
                  opacity: timeframe === tf ? 1 : 0.6,
                  fontWeight: timeframe === tf ? 700 : 400
                }}
              >
                {tf}
              </div>
            ))}

            <div style={{
              width: 1,
              height: 16,
              background: "rgba(255,255,255,.15)",
              marginLeft: 8,
              marginRight: 8
            }} />

            {["candles","line","area"].map(type => (
              <div
                key={type}
                onClick={() => setCandleType(type)}
                style={{
                  cursor: "pointer",
                  opacity: candleType === type ? 1 : 0.6,
                  textTransform: "capitalize"
                }}
              >
                {type}
              </div>
            ))}

          </div>
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

        {/* BOTTOM PANEL (UNCHANGED) */}
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

          <div style={{ flex: 1, padding: 16 }}>
            {activeTab === "positions" && <div>No open positions</div>}
            {activeTab === "orders" && <div>No pending orders</div>}
            {activeTab === "news" && <div>News feed active</div>}
            {activeTab === "signals" && <div>AI Signal: BUY • Confidence: 82%</div>}
          </div>

        </div>
      </div>

      {/* RIGHT PANEL (UNCHANGED SIZE) */}
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
