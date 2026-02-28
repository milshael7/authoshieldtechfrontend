// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — FULL WORKSTATION WITH TOOL SIDEBAR
// Live Chart + Drawing Engine + Volume + Tabs + Execute Panel
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

  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const candleDataRef = useRef([]);

  const [activeTool, setActiveTool] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [currentDraw, setCurrentDraw] = useState(null);
  const [magnet, setMagnet] = useState(false);
  const [locked, setLocked] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
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
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    candleSeriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: "#2bd576",
      downColor: "#ff5a5f",
      wickUpColor: "#2bd576",
      wickDownColor: "#ff5a5f",
      borderVisible: false,
    });

    if (showVolume) {
      volumeSeriesRef.current = chartRef.current.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "",
        scaleMargins: { top: 0.8, bottom: 0 },
      });
    }

    seedData();
  }, []);

  function seedData() {
    const now = Math.floor(Date.now() / 1000);
    let base = 1.1;
    const data = [];

    for (let i = 200; i > 0; i--) {
      const time = now - i * 3600;
      const open = base;
      const close = open + (Math.random() - 0.5) * 0.01;
      const high = Math.max(open, close) + 0.003;
      const low = Math.min(open, close) - 0.003;
      const volume = Math.floor(Math.random() * 1000);
      data.push({ time, open, high, low, close, volume });
      base = close;
    }

    candleDataRef.current = data;
    candleSeriesRef.current.setData(data);

    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(
        data.map(c => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? "#2bd57655" : "#ff5a5f55"
        }))
      );
    }
  }

  /* ================= DRAWING ENGINE ================= */

  function drawOverlay() {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    [...drawings, currentDraw].forEach(d => {
      if (!d) return;
      ctx.strokeStyle = "#5ea7ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(d.start.x, d.start.y);
      ctx.lineTo(d.end.x, d.end.y);
      ctx.stroke();
    });
  }

  useEffect(() => { drawOverlay(); }, [drawings, currentDraw]);

  function handleMouseDown(e) {
    if (!activeTool || locked) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentDraw({ tool: activeTool, start: { x, y }, end: { x, y } });
  }

  function handleMouseMove(e) {
    if (!currentDraw) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentDraw(prev => ({ ...prev, end: { x, y } }));
  }

  function handleMouseUp() {
    if (!currentDraw) return;
    setDrawings(prev => [...prev, currentDraw]);
    setCurrentDraw(null);
  }

  /* ================= UI ================= */

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0a0f1c", color: "#fff" }}>

      {/* LEFT TOOL SIDEBAR */}
      <div style={{
        width: 60,
        background: "#111827",
        borderRight: "1px solid rgba(255,255,255,.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 12,
        gap: 12
      }}>
        {["trend","rect","arrow","text","ruler"].map(tool => (
          <button
            key={tool}
            onClick={() => setActiveTool(tool)}
            style={{
              width: 36,
              height: 36,
              background: activeTool === tool ? "#1e2536" : "#1a2133",
              border: "none",
              borderRadius: 8,
              cursor: "pointer"
            }}
          >
            {tool[0].toUpperCase()}
          </button>
        ))}
        <button onClick={() => setMagnet(!magnet)}>M</button>
        <button onClick={() => setLocked(!locked)}>L</button>
        <button onClick={() => setDrawings([])}>C</button>
      </div>

      {/* CENTER */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 20 }}>

        <div style={{ flex: 1, position: "relative", background: "#111827", borderRadius: 12 }}>
          <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
          <canvas
            ref={overlayRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ position: "absolute", inset: 0 }}
          />
        </div>

        {/* BOTTOM PANEL */}
        <div style={{
          height: 200,
          marginTop: 15,
          background: "#111827",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,.08)"
        }}>
          <div style={{ display: "flex" }}>
            {["positions","orders","news","signals"].map(tab => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                  background: activeTab === tab ? "#1e2536" : "transparent"
                }}
              >
                {tab.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EXECUTE PANEL */}
      {panelOpen && (
        <div style={{
          width: 320,
          background: "#111827",
          borderLeft: "1px solid rgba(255,255,255,.08)",
          padding: 20
        }}>
          <h3>Execute Order</h3>
          <p>Ready for backend connection</p>
        </div>
      )}

    </div>
  );
}
