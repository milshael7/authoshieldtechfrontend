// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — ENTERPRISE STRUCTURE v2
// Chart Dominant • Execution Panel • AI Ops • Activity Feed
//
// ARCHITECTURAL NOTES:
// - WebSocket stream powers live ticks + AI signals.
// - Snapshot polling is REQUIRED fallback (do not remove).
// - Role enforcement must remain intact.
// - This room is Admin-owned, Manager-supervised.
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { api, getToken, getSavedUser } from "../lib/api.js";
import { Navigate } from "react-router-dom";
import "../styles/terminal.css";

/* ================= WS URL WITH TOKEN ================= */
/*
ARCHITECTURAL LOCK:
Using same-origin WS path so reverse proxies (Vercel → Render)
remain transparent. Do NOT hardcode backend host here.
*/
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
  /*
  ARCHITECTURAL LOCK:
  Admin owns trading authority.
  Manager may view but not override engine ownership logic.
  */
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
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState("");

  const [signals, setSignals] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  const [side, setSide] = useState("BUY");
  const [orderQty, setOrderQty] = useState(1);
  const [orderPrice, setOrderPrice] = useState("");

  /* ================= SNAPSHOT (Fallback Layer) ================= */
  /*
  ARCHITECTURAL LOCK:
  Snapshot polling ensures UI remains populated
  if WS disconnects. Do NOT remove.
  */
  async function loadSnapshot() {
    try {
      setSnapshotError("");
      setSnapshotLoading(true);
      const data = await api.tradingLiveSnapshot();
      setSnapshot(data);
    } catch (e) {
      setSnapshotError(e?.message || "Snapshot failed");
    } finally {
      setSnapshotLoading(false);
    }
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
  /*
  ARCHITECTURAL LOCK:
  Live trading visibility depends on tick + ai_signal stream.
  Removing this breaks real-time behavior.
  */
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

    ws.onerror = () => ws.close();

    return () => {
      ws.close();
    };
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
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={{ display: "flex", height: "75vh" }}>

        {/* CHART */}
        <div style={{ flex: 3, position: "relative" }}>
          <div
            ref={chartContainerRef}
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        {/* EXECUTION PANEL */}
        <div
          style={{
            flex: 1,
            background: "#111827",
            padding: 20,
            borderLeft: "1px solid rgba(255,255,255,.08)",
          }}
        >
          <h3 style={{ marginBottom: 10 }}>Execute Order</h3>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={{ flex: 1 }}
              onClick={() => setSide("BUY")}
            >
              BUY
            </button>
            <button
              style={{ flex: 1 }}
              onClick={() => setSide("SELL")}
            >
              SELL
            </button>
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
        </div>
      </div>

      {/* TAB CONTENT */}
      <div style={{ padding: 20 }}>

        {activeTab === "dashboard" && (
          <div>
            <h3>Open Positions</h3>
            <div>
              {snapshot?.positions?.length
                ? snapshot.positions.map((p, i) => (
                    <div key={i}>
                      {p.symbol} — {p.side} — PnL: {p.pnl}
                    </div>
                  ))
                : "No open positions"}
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div>
            <h3>AI Operations</h3>
            <div>Model Version: v1.0</div>
            <div>Last Signal Confidence:
              {signals[0]
                ? (Number(signals[0].confidence) * 100).toFixed(1) + "%"
                : "—"}
            </div>
            <div>Edge Score:
              {signals[0]
                ? Number(signals[0].edge || 0).toFixed(2)
                : "—"}
            </div>
            <div>Mode: PAPER TRADING</div>
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
