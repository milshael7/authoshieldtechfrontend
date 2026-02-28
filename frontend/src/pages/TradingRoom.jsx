// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — DRAWING ENGINE PHASE 1
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { getSavedUser, getToken, req, api } from "../lib/api.js";
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

  const [drawingMode, setDrawingMode] = useState(null); // "trend" | "ruler"
  const [drawings, setDrawings] = useState([]);
  const [currentDraw, setCurrentDraw] = useState(null);

  const [symbol, setSymbol] = useState("EURUSD");
  const [lastPrice, setLastPrice] = useState(null);

  /* ================= CHART INIT ================= */

  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: { background: { color: "#0a0f1c" }, textColor: "#d1d5db" },
      grid: {
        vertLines: { color: "rgba(255,255,255,.04)" },
        horzLines: { color: "rgba(255,255,255,.04)" },
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

  /* ================= DRAWING ENGINE ================= */

  function chartToCanvasCoords(param) {
    if (!param || !param.point) return null;
    const price = seriesRef.current.coordinateToPrice(param.point.y);
    const time = param.time;
    return {
      x: param.point.x,
      y: param.point.y,
      price,
      time,
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

      const { start, end, mode } = draw;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();

      if (mode === "ruler") {
        const diff = end.price - start.price;
        const pct = ((diff / start.price) * 100).toFixed(2);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`${diff.toFixed(2)} (${pct}%)`, end.x + 6, end.y - 6);
      }
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

      {/* LEFT TOOL RAIL */}
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
        <div onClick={()=>setDrawingMode("trend")} style={{cursor:"pointer"}}>
          📈
        </div>
        <div onClick={()=>setDrawingMode("ruler")} style={{cursor:"pointer"}}>
          📏
        </div>
        <div onClick={()=>setDrawingMode(null)} style={{cursor:"pointer"}}>
          ✖
        </div>
      </div>

      {/* CHART */}
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

      {/* OVERLAY CANVAS */}
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
