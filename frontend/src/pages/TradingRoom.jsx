// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — PRODUCTION CLEAN (NO DEBUG OUTPUT)
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { getSavedUser, getToken } from "../lib/api.js";
import { Navigate } from "react-router-dom";

function buildWsUrl() {
  const token = getToken();
  if (!token) return null;

  const base =
    import.meta.env.VITE_API_BASE?.trim() || window.location.origin;

  const wsBase = base
    .replace("https://", "wss://")
    .replace("http://", "ws://")
    .replace(/\/+$/, "");

  return `${wsBase}/ws/market?token=${encodeURIComponent(token)}`;
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
  const wsRef = useRef(null);
  const candleDataRef = useRef([]);

  const [timeframe] = useState("1M");
  const [activeTab, setActiveTab] = useState("positions");
  const [panelOpen, setPanelOpen] = useState(true);

  const [chartReady, setChartReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("CONNECTING");
  const [lastTickAt, setLastTickAt] = useState(null);
  const [lastPrice, setLastPrice] = useState(null);

  const [positions] = useState([]);
  const [orders] = useState([]);
  const [news] = useState([]);
  const [signal] = useState({
    side: "BUY",
    confidence: 92,
    reason: "Bullish structure confirmed",
  });

  // ================= CHART INIT =================
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "#0f1626" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,.04)" },
        horzLines: { color: "rgba(255,255,255,.04)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,.1)" },
      timeScale: {
        borderColor: "rgba(255,255,255,.1)",
        timeVisible: true,
        rightBarStaysOnScroll: true,
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    const series = chart.addCandlestickSeries({
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

    chartRef.current = chart;
    seriesRef.current = series;

    seedCandles();
    chart.timeScale().fitContent();

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    ro.observe(containerRef.current);

    setChartReady(true);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      setChartReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function seedCandles() {
    if (!seriesRef.current) return;

    const now = Math.floor(Date.now() / 1000);
    const tf = timeframeToSeconds(timeframe);
    const candles = [];
    let base = 1.1000;

    for (let i = 120; i > 0; i--) {
      const time = now - i * tf;
      const open = base;
      const close = open + (Math.random() - 0.5) * 0.002;
      const high = Math.max(open, close);
      const low = Math.min(open, close);
      candles.push({ time, open, high, low, close });
      base = close;
    }

    candleDataRef.current = candles;
    seriesRef.current.setData(candles);
  }

  function updateCandle(price) {
    if (!seriesRef.current || !chartRef.current) return;

    const tfSeconds = timeframeToSeconds(timeframe);
    const now = Math.floor(Date.now() / 1000);
    const bucket = Math.floor(now / tfSeconds) * tfSeconds;

    const last = candleDataRef.current[candleDataRef.current.length - 1];

    if (!last || last.time !== bucket) {
      const open = last ? last.close : price;
      const newCandle = { time: bucket, open, high: price, low: price, close: price };
      candleDataRef.current.push(newCandle);
      seriesRef.current.update(newCandle);
    } else {
      last.high = Math.max(last.high, price);
      last.low = Math.min(last.low, price);
      last.close = price;
      seriesRef.current.update({ ...last });
    }

    chartRef.current.timeScale().scrollToRealTime();
  }

  // ================= WEBSOCKET =================
  useEffect(() => {
    if (!chartReady) return;

    const url = buildWsUrl();
    if (!url) {
      setConnectionStatus("NO_TOKEN_OR_API_BASE");
      return;
    }

    let ws;
    let stopped = false;

    const connect = () => {
      if (stopped) return;

      setConnectionStatus("CONNECTING");
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnectionStatus("CONNECTED");

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.type === "tick" && data?.price != null) {
            const p = Number(data.price);
            setLastPrice(p);
            setLastTickAt(Date.now());
            updateCandle(p);
          }
        } catch {}
      };

      ws.onclose = () => {
        if (stopped) return;
        setConnectionStatus("RECONNECTING");
        setTimeout(connect, 2500);
      };

      ws.onerror = () => {
        try { ws.close(); } catch {}
      };
    };

    connect();

    return () => {
      stopped = true;
      try { ws?.close(); } catch {}
    };
  }, [chartReady]);

  // ================= UI =================
  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0f1c", color: "#fff" }}>
      <div style={{ width: 60, background: "#111827", borderRight: "1px solid rgba(255,255,255,.08)" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 28 }}>
          <div>
            <div style={{ fontWeight: 700 }}>EURUSD • {timeframe} • LIVE</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              WS: {connectionStatus}
              {lastPrice != null ? ` • ${lastPrice.toFixed(5)}` : ""}
              {lastTickAt ? ` • ${new Date(lastTickAt).toLocaleTimeString()}` : ""}
            </div>
          </div>

          <button
            onClick={() => setPanelOpen(!panelOpen)}
            style={{
              padding: "6px 14px",
              background: "#1e2536",
              border: "1px solid rgba(255,255,255,.1)",
              cursor: "pointer",
            }}
          >
            Execute Order
          </button>
        </div>

        <div style={{ flex: 1, background: "#111827", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,.08)", marginTop: 10 }}>
          <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        </div>

        <div style={{
          height: 220,
          marginTop: 20,
          background: "#111827",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,.08)",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
            {["positions", "orders", "news", "signals"].map((tab) => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "12px 18px",
                  cursor: "pointer",
                  background: activeTab === tab ? "#1e2536" : "transparent",
                  fontWeight: activeTab === tab ? 700 : 400,
                }}
              >
                {tab.toUpperCase()}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, padding: 16 }}>
            {activeTab === "positions" && <div>No open positions</div>}
            {activeTab === "orders" && <div>No pending orders</div>}
            {activeTab === "news" && <div>No live news</div>}
            {activeTab === "signals" && (
              <div>
                <div style={{ fontWeight: 700 }}>{signal.side} EURUSD</div>
                <div>Confidence: {signal.confidence}%</div>
                <div style={{ opacity: 0.7 }}>{signal.reason}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {panelOpen && (
        <div style={{ width: 360, background: "#111827", borderLeft: "1px solid rgba(255,255,255,.08)", padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>AI Engine Status</div>
          <div>State: {connectionStatus === "CONNECTED" ? "STREAMING" : "WAITING"}</div>
          <div style={{ marginTop: 10, opacity: 0.7 }}>
            Live engine status only. Analytics/history goes in Analytics page.
          </div>
        </div>
      )}
    </div>
  );
}
