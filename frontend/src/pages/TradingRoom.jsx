// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — ENTERPRISE STRUCTURE v3
// Dockable + Draggable Execution Panel
//
// ARCHITECTURAL LOCKS:
// - Do NOT remove snapshot polling (fallback layer).
// - Do NOT remove WS live stream.
// - Execution panel must NOT affect chart layout permanently.
// - Admin owns trading authority.
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { api, getToken, getSavedUser } from "../lib/api.js";
import { Navigate } from "react-router-dom";
import "../styles/terminal.css";

/* ================= WS URL ================= */
function buildWsUrl() {
  const token = getToken();
  if (!token) return null;

  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  return (
    protocol +
    window.location.host +
    "/ws/market?token=" +
    encodeURIComponent(token)
  );
}

export default function TradingRoom() {
  /* ================= ROLE SAFETY ================= */
  const user = getSavedUser();
  const role = String(user?.role || "").toLowerCase();

  if (!user || (role !== "admin" && role !== "manager")) {
    return <Navigate to="/admin" replace />;
  }

  /* ================= STATE ================= */

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const candleDataRef = useRef([]);

  const wsRef = useRef(null);
  const pollingRef = useRef(null);

  const [snapshot, setSnapshot] = useState(null);
  const [signals, setSignals] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  /* ===== EXECUTION PANEL STATE ===== */
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelDocked, setPanelDocked] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [floatPos, setFloatPos] = useState({ x: 300, y: 120 });

  const [side, setSide] = useState("BUY");
  const [orderQty, setOrderQty] = useState(1);
  const [orderPrice, setOrderPrice] = useState("");

  /* ================= SNAPSHOT ================= */
  async function loadSnapshot() {
    try {
      const data = await api.tradingLiveSnapshot();
      setSnapshot(data);
    } catch {}
  }

  useEffect(() => {
    loadSnapshot();
    pollingRef.current = setInterval(loadSnapshot, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  /* ================= CHART ================= */
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#ffffff",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,.05)" },
        horzLines: { color: "rgba(255,255,255,.05)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    seriesRef.current = chartRef.current.addCandlestickSeries();

    const resize = () => {
      chartRef.current?.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    };

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chartRef.current?.remove();
    };
  }, []);

  /* ================= WEBSOCKET ================= */
  useEffect(() => {
    const wsUrl = buildWsUrl();
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "tick") {
          updateCandle(msg.price, msg.ts);
        }

        if (msg.type === "ai_signal") {
          setSignals((prev) => [
            {
              action: msg.action,
              confidence: msg.confidence,
              edge: msg.edge,
              ts: msg.ts,
            },
            ...prev.slice(0, 20),
          ]);
        }
      } catch {}
    };

    return () => ws.close();
  }, []);

  function updateCandle(price, ts) {
    if (!seriesRef.current) return;

    const time = Math.floor(Number(ts) / 1000);
    const p = Number(price);
    const last = candleDataRef.current[candleDataRef.current.length - 1];

    if (!last || time > last.time) {
      const candle = { time, open: p, high: p, low: p, close: p };
      candleDataRef.current.push(candle);
      seriesRef.current.update(candle);
    } else {
      last.high = Math.max(last.high, p);
      last.low = Math.min(last.low, p);
      last.close = p;
      seriesRef.current.update(last);
    }
  }

  /* ================= EXECUTION PANEL LOGIC ================= */

  function openPanel(type) {
    setSide(type);
    if (!panelOpen) {
      setPanelOpen(true);
      setPanelDocked(true);
    }
  }

  function startDrag() {
    setDragging(true);
    setPanelDocked(false);
  }

  function onDrag(e) {
    if (!dragging) return;
    setFloatPos({
      x: e.clientX - 200,
      y: e.clientY - 20,
    });
  }

  function stopDrag() {
    setDragging(false);
  }

  useEffect(() => {
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDrag);
    };
  }, [dragging]);

  /* ================= RENDER ================= */

  return (
    <div className="terminalRoot">

      {/* TOP BAR */}
      <div className="terminalTopbar">
        <div className="terminalSymbol">BTCUSDT</div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setActiveTab("dashboard")}>Dashboard</button>
          <button onClick={() => setActiveTab("ai")}>AI Ops</button>
          <button onClick={() => setActiveTab("activity")}>Activity</button>

          <button onClick={() => openPanel("BUY")}>BUY</button>
          <button onClick={() => openPanel("SELL")}>SELL</button>
        </div>
      </div>

      {/* CHART AREA */}
      <div style={{ height: "75vh", position: "relative" }}>
        <div
          ref={chartContainerRef}
          style={{ width: "100%", height: "100%" }}
        />

        {/* EXECUTION PANEL */}
        {panelOpen && (
          <div
            style={{
              position: panelDocked ? "absolute" : "fixed",
              right: panelDocked ? 0 : "auto",
              top: panelDocked ? 0 : floatPos.y,
              left: panelDocked ? "auto" : floatPos.x,
              width: 380,
              background: "#111827",
              borderLeft: panelDocked
                ? "1px solid rgba(255,255,255,.08)"
                : "none",
              borderRadius: panelDocked ? 0 : 8,
              padding: 20,
              zIndex: 1000,
              cursor: dragging ? "grabbing" : "default",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: 10,
                cursor: "grab",
              }}
              onMouseDown={startDrag}
            >
              Execute Order ({side})
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setSide("BUY")}>BUY</button>
              <button onClick={() => setSide("SELL")}>SELL</button>
            </div>

            <div style={{ marginTop: 15 }}>
              <label>Quantity</label>
              <input
                value={orderQty}
                onChange={(e) => setOrderQty(e.target.value)}
              />
            </div>

            <div style={{ marginTop: 10 }}>
              <label>Limit Price</label>
              <input
                value={orderPrice}
                onChange={(e) => setOrderPrice(e.target.value)}
              />
            </div>

            <button
              style={{
                marginTop: 20,
                width: "100%",
                background: side === "BUY" ? "#22c55e" : "#ef4444",
              }}
            >
              Confirm {side}
            </button>

            {!panelDocked && (
              <button
                style={{ marginTop: 10, width: "100%" }}
                onClick={() => setPanelDocked(true)}
              >
                Dock Right
              </button>
            )}

            <button
              style={{ marginTop: 10, width: "100%" }}
              onClick={() => setPanelOpen(false)}
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* TAB CONTENT */}
      <div style={{ padding: 20 }}>
        {activeTab === "dashboard" && (
          <div>
            <h3>Open Positions</h3>
            {snapshot?.positions?.length
              ? snapshot.positions.map((p, i) => (
                  <div key={i}>
                    {p.symbol} — {p.side} — PnL: {p.pnl}
                  </div>
                ))
              : "No open positions"}
          </div>
        )}

        {activeTab === "ai" && (
          <div>
            <h3>AI Operations</h3>
            <div>
              Confidence:
              {signals[0]
                ? (Number(signals[0].confidence) * 100).toFixed(1) + "%"
                : "—"}
            </div>
            <div>
              Edge:
              {signals[0]
                ? Number(signals[0].edge || 0).toFixed(2)
                : "—"}
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div>
            <h3>Signal Feed</h3>
            {signals.map((s, i) => (
              <div key={i}>
                {s.action} • {(Number(s.confidence) * 100).toFixed(1)}%
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
