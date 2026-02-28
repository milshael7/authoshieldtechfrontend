// frontend/src/pages/TradingRoom.jsx
// ============================================================
// AUTOSHIELD — FULL TRADING ROOM STRUCTURE
// Professional Tools • Chart Modes • Volume • Live Ready
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
  const containerRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const wsRef = useRef(null);

  const candleDataRef = useRef([]);

  const [symbol, setSymbol] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("candles");
  const [showVolume, setShowVolume] = useState(true);
  const [lastPrice, setLastPrice] = useState(null);

  /* ===================== CHART INIT ===================== */

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = createChart(containerRef.current, {
      layout: {
        background: { color: "#0a0f1c" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,.05)" },
        horzLines: { color: "rgba(255,255,255,.05)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,.1)",
        scaleMargins: { top: 0.1, bottom: showVolume ? 0.25 : 0.1 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,.1)",
        timeVisible: true,
      },
      crosshair: {
        mode: 1,
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    createSeries();

    seedInitialCandles();

    const resize = () => {
      chartRef.current.applyOptions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chartRef.current?.remove();
    };
  }, []);

  /* ===================== CREATE SERIES ===================== */

  function createSeries() {
    if (!chartRef.current) return;

    if (candleSeriesRef.current) {
      chartRef.current.removeSeries(candleSeriesRef.current);
    }

    if (chartType === "candles") {
      candleSeriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: "#16a34a",
        downColor: "#dc2626",
        wickUpColor: "#16a34a",
        wickDownColor: "#dc2626",
        borderVisible: false,
        priceLineVisible: true,
      });
    } else if (chartType === "line") {
      candleSeriesRef.current = chartRef.current.addLineSeries({
        color: "#5ea7ff",
        lineWidth: 2,
      });
    } else if (chartType === "area") {
      candleSeriesRef.current = chartRef.current.addAreaSeries({
        lineColor: "#5ea7ff",
        topColor: "rgba(94,167,255,.4)",
        bottomColor: "rgba(94,167,255,.05)",
      });
    }

    if (showVolume) {
      volumeSeriesRef.current = chartRef.current.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "",
        scaleMargins: { top: 0.75, bottom: 0 },
        color: "rgba(100,100,100,.4)",
      });
    }
  }

  /* ===================== INITIAL DATA ===================== */

  function seedInitialCandles() {
    const now = Math.floor(Date.now() / 1000);
    const candles = [];
    let base = 1.1;

    for (let i = 100; i > 0; i--) {
      const time = now - i * 3600;
      const open = base;
      const close = open + (Math.random() - 0.5) * 0.02;
      const high = Math.max(open, close) + Math.random() * 0.01;
      const low = Math.min(open, close) - Math.random() * 0.01;
      const volume = Math.random() * 1000;

      candles.push({ time, open, high, low, close, volume });
      base = close;
    }

    candleDataRef.current = candles;

    if (chartType === "candles") {
      candleSeriesRef.current.setData(candles);
    } else {
      candleSeriesRef.current.setData(
        candles.map(c => ({ time: c.time, value: c.close }))
      );
    }

    if (showVolume) {
      volumeSeriesRef.current.setData(
        candles.map(c => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? "#16a34a" : "#dc2626",
        }))
      );
    }
  }

  /* ===================== LIVE UPDATE ===================== */

  function updateCandle(price, ts) {
    const time = Math.floor(n(ts) / 1000);
    const p = n(price);

    const last = candleDataRef.current[candleDataRef.current.length - 1];

    if (!last || time > last.time) {
      const newCandle = {
        time,
        open: p,
        high: p,
        low: p,
        close: p,
        volume: Math.random() * 500,
      };
      candleDataRef.current.push(newCandle);
    } else {
      last.high = Math.max(last.high, p);
      last.low = Math.min(last.low, p);
      last.close = p;
    }

    seedInitialCandles();
    setLastPrice(p);
  }

  /* ===================== WEBSOCKET ===================== */

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

  /* ===================== UI ===================== */

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>

      {/* ===== TOP CHART BAR ===== */}
      <div style={{
        height: 42,
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 10,
        borderBottom: "1px solid rgba(255,255,255,.08)"
      }}>
        <strong>{symbol}</strong>

        {["1m","5m","15m","1h","4h","1D"].map(tf => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            style={{ opacity: timeframe === tf ? 1 : .5 }}
          >
            {tf}
          </button>
        ))}

        <button onClick={() => setChartType("candles")}>Candles</button>
        <button onClick={() => setChartType("line")}>Line</button>
        <button onClick={() => setChartType("area")}>Area</button>

        <button onClick={() => setShowVolume(v => !v)}>Volume</button>

        <div style={{ marginLeft: "auto" }}>
          {lastPrice ? lastPrice.toFixed(5) : "--"}
        </div>
      </div>

      {/* ===== BODY ===== */}
      <div style={{ display: "flex", height: "calc(100% - 42px)" }}>

        {/* LEFT TOOL RAIL */}
        <div style={{
          width: 50,
          borderRight: "1px solid rgba(255,255,255,.08)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 10,
          gap: 14
        }}>
          {["↖","✏","▭","T","📏","🧲","🔍","🔒","❌"].map((i,idx)=>(
            <div key={idx} style={{ cursor: "pointer" }}>{i}</div>
          ))}
        </div>

        {/* CHART */}
        <div
          ref={containerRef}
          style={{ flex: 1 }}
        />
      </div>
    </div>
  );
}
