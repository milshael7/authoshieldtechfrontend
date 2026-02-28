// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — DRAWING ENGINE PHASE 2
// Candles Fixed • Visible • Live Updating
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

  const chartContainerRef = useRef(null);
  const overlayRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const candleDataRef = useRef([]);
  const wsRef = useRef(null);

  const [drawingMode, setDrawingMode] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [currentDraw, setCurrentDraw] = useState(null);

  /* ================= CHART INIT ================= */

  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "#0a0f1c" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,.04)" },
        horzLines: { color: "rgba(255,255,255,.04)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,.1)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,.1)",
        timeVisible: true,
        secondsVisible: false,
        rightBarStaysOnScroll: true,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    seriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: "#16a34a",
      downColor: "#dc2626",
      wickUpColor: "#16a34a",
      wickDownColor: "#dc2626",
      borderVisible: false,
    });

    // 👇 IMPORTANT: Set bar spacing so candles are visible
    chartRef.current.timeScale().applyOptions({
      barSpacing: 8,
    });

    seedInitialCandles();

    const resize = () => {
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
      drawOverlay();
    };

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      chartRef.current?.remove();
    };
  }, []);

  /* ================= INITIAL CANDLES ================= */

  function seedInitialCandles() {
    const now = Math.floor(Date.now() / 1000);
    const candles = [];

    let base = 1.1000;

    for (let i = 50; i > 0; i--) {
      const time = now - i * 86400;
      const open = base;
      const close = open + (Math.random() - 0.5) * 0.01;
      const high = Math.max(open, close) + Math.random() * 0.005;
      const low = Math.min(open, close) - Math.random() * 0.005;

      candles.push({ time, open, high, low, close });
      base = close;
    }

    candleDataRef.current = candles;
    seriesRef.current.setData(candles);
  }

  /* ================= LIVE UPDATE ================= */

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
      };
      candleDataRef.current.push(newCandle);
      seriesRef.current.update(newCandle);
    } else {
      last.high = Math.max(last.high, p);
      last.low = Math.min(last.low, p);
      last.close = p;
      seriesRef.current.update(last);
    }
  }

  /* ================= WEBSOCKET ================= */

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

  /* ================= DRAWING ENGINE ================= */

  function chartToCanvasCoords(param) {
    if (!param || !param.point) return null;
    return {
      x: param.point.x,
      y: param.point.y,
      price: seriesRef.current.coordinateToPrice(param.point.y),
      time: param.time,
    };
  }

  function handleMouseDown(param) {
    if (!drawingMode) return;
    const coords = chartToCanvasCoords(param);
    if (!coords) return;

    setCurrentDraw({
      mode: drawingMode,
      start: coords,
      end: coords,
    });
  }

  function handleMouseMove(param) {
    if (!currentDraw) return;
    const coords = chartToCanvasCoords(param);
    if (!coords) return;

    setCurrentDraw(prev => ({
      ...prev,
      end: coords,
    }));
  }

  function handleMouseUp() {
    if (!currentDraw) return;
    setDrawings(prev => [...prev, currentDraw]);
    setCurrentDraw(null);
  }

  useEffect(() => {
    if (!chartRef.current) return;

    chartRef.current.subscribeCrosshairMove(handleMouseMove);
    chartRef.current.subscribeClick(handleMouseDown);

    const container = chartContainerRef.current;
    container.addEventListener("mouseup", handleMouseUp);

    return () => {
      chartRef.current.unsubscribeCrosshairMove(handleMouseMove);
      chartRef.current.unsubscribeClick(handleMouseDown);
      container.removeEventListener("mouseup", handleMouseUp);
    };
  }, [currentDraw, drawingMode]);

  function drawOverlay() {
    const canvas = overlayRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5;

    [...drawings, currentDraw].forEach(draw => {
      if (!draw) return;
      const { start, end } = draw;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    });
  }

  useEffect(() => {
    drawOverlay();
  }, [drawings, currentDraw]);

  /* ================= UI ================= */

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      background: "#0a0f1c",
      color: "#d1d5db"
    }}>

      <div style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        width: 46,
        background: "#111827",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 12,
        gap: 12,
        zIndex: 20
      }}>
        <div onClick={()=>setDrawingMode("trend")} style={{cursor:"pointer"}}>📈</div>
        <div onClick={()=>setDrawingMode("ruler")} style={{cursor:"pointer"}}>📏</div>
        <div onClick={()=>setDrawingMode(null)} style={{cursor:"pointer"}}>✖</div>
      </div>

      <div
        ref={chartContainerRef}
        style={{
          position: "absolute",
          left: 46,
          right: 0,
          top: 0,
          bottom: 0,
        }}
      />

      <canvas
        ref={overlayRef}
        style={{
          position: "absolute",
          left: 46,
          right: 0,
          top: 0,
          bottom: 0,
          pointerEvents: "none"
        }}
      />
    </div>
  );
}
