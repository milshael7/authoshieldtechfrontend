// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — AI PAPER TRADING ENGINE
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

  // ================= PAPER WALLET =================

  const [wallet, setWallet] = useState({
    usd: 1000,
    btc: 0,
  });

  const [tradeHistory, setTradeHistory] = useState([]);
  const [positions, setPositions] = useState([]);

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
    });

    chartRef.current = chart;
    seriesRef.current = series;

    seedCandles();
    chart.timeScale().fitContent();

    setChartReady(true);

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
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

  // ================= SIMPLE AI STRATEGY =================

  function runAI(price) {
    setWallet((w) => {
      if (w.usd > 100 && Math.random() > 0.7) {
        const btcBought = 100 / price;

        setPositions((p) => [
          ...p,
          { side: "BUY", price, size: btcBought, time: Date.now() },
        ]);

        setTradeHistory((h) => [
          { side: "BUY", price, size: btcBought, time: Date.now() },
          ...h,
        ]);

        return { usd: w.usd - 100, btc: w.btc + btcBought };
      }

      if (w.btc > 0.0005 && Math.random() > 0.8) {
        const btcSell = 0.0005;

        setTradeHistory((h) => [
          { side: "SELL", price, size: btcSell, time: Date.now() },
          ...h,
        ]);

        return { usd: w.usd + btcSell * price, btc: w.btc - btcSell };
      }

      return w;
    });
  }

  // ================= WEBSOCKET =================

  useEffect(() => {
    if (!chartReady) return;

    const url = buildWsUrl();
    if (!url) return;

    const ws = new WebSocket(url);

    ws.onopen = () => setConnectionStatus("CONNECTED");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data?.type === "tick" && data?.price) {
        const p = Number(data.price);

        setLastPrice(p);
        setLastTickAt(Date.now());

        updateCandle(p);
        runAI(p);
      }
    };

    ws.onclose = () => setConnectionStatus("RECONNECTING");

    wsRef.current = ws;

    return () => ws.close();
  }, [chartReady]);

  // ================= UI =================

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0f1c", color: "#fff" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 20 }}>
        <div style={{ fontWeight: 700 }}>
          EURUSD • LIVE • {lastPrice ? lastPrice.toFixed(5) : "--"}
        </div>

        <div style={{ flex: 1, marginTop: 10 }}>
          <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        </div>

        <div style={{ marginTop: 20 }}>
          Wallet: ${wallet.usd.toFixed(2)} | BTC: {wallet.btc.toFixed(5)}
        </div>
      </div>

      <div style={{ width: 350, padding: 20, background: "#111827" }}>
        <h3>AI Trading Engine</h3>

        <div>Status: {connectionStatus}</div>
        <div>Last Price: {lastPrice}</div>

        <h4 style={{ marginTop: 20 }}>Trade History</h4>

        {tradeHistory.slice(0, 8).map((t, i) => (
          <div key={i}>
            {t.side} {t.size.toFixed(5)} @ {t.price.toFixed(5)}
          </div>
        ))}
      </div>
    </div>
  );
}
