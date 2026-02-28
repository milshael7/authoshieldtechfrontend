// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — DARK DASHBOARD MATCH
// Blueprint Layout + Platform Theme Integration
//
// ARCHITECTURAL LOCKS (DO NOT REMOVE):
// 1) Same-origin WS (/ws/market)
// 2) Snapshot polling fallback
// 3) Role guard enforcement
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { getSavedUser, getToken, req, api } from "../lib/api.js";
import { Navigate } from "react-router-dom";

/* ================= WS URL (KEEP SAME ORIGIN) ================= */
function buildWsUrl() {
  const token = getToken();
  if (!token) return null;
  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  return `${protocol}${window.location.host}/ws/market?token=${encodeURIComponent(
    token
  )}`;
}

function n(v, fallback = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export default function TradingRoom() {
  /* ================= ROLE GUARD ================= */
  const user = getSavedUser();
  const role = String(user?.role || "").toLowerCase();
  if (!user || (role !== "admin" && role !== "manager")) {
    return <Navigate to="/admin" replace />;
  }

  /* ================= REFS ================= */
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const wsRef = useRef(null);
  const pollRef = useRef(null);
  const candleDataRef = useRef([]);

  /* ================= STATE ================= */
  const [symbol, setSymbol] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("1D");

  const [snapshot, setSnapshot] = useState({});
  const [snapshotLoading, setSnapshotLoading] = useState(true);

  const [execOpen, setExecOpen] = useState(true);
  const [execDocked, setExecDocked] = useState(true);
  const [execPos, setExecPos] = useState({ x: 900, y: 110 });
  const [dragging, setDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const [side, setSide] = useState("BUY");
  const [orderType, setOrderType] = useState("LIMIT");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderQty, setOrderQty] = useState("1000");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  const [bottomTab, setBottomTab] = useState("positions");
  const [signals, setSignals] = useState([]);
  const [ticks, setTicks] = useState([]);

  const lastPrice = useMemo(() => {
    return snapshot?.lastPrice ?? ticks[0]?.price ?? null;
  }, [snapshot, ticks]);

  /* ================= SNAPSHOT (DO NOT REMOVE) ================= */
  async function loadSnapshot() {
    try {
      setSnapshotLoading(true);
      let data = {};
      if (typeof api?.tradingLiveSnapshot === "function") {
        data = await api.tradingLiveSnapshot();
      } else {
        data =
          (await req("/api/trading/live-snapshot")) ||
          (await req("/api/trading/snapshot")) ||
          {};
      }
      setSnapshot(data || {});
    } catch {}
    setSnapshotLoading(false);
  }

  useEffect(() => {
    loadSnapshot();
    pollRef.current = setInterval(loadSnapshot, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  /* ================= CHART INIT ================= */
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "rgba(255,255,255,.9)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,.05)" },
        horzLines: { color: "rgba(255,255,255,.05)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,.1)" },
      timeScale: { borderColor: "rgba(255,255,255,.1)" },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    seriesRef.current = chartRef.current.addCandlestickSeries();

    const resize = () => {
      chartRef.current.applyOptions({
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

  /* ================= WS (DO NOT REMOVE) ================= */
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
          setTicks((prev) => [{ price: n(msg.price), ts: msg.ts }, ...prev].slice(0, 20));
        }
      } catch {}
    };

    ws.onerror = () => ws.close();
    return () => ws.close();
  }, [symbol]);

  function updateCandle(price, ts) {
    if (!seriesRef.current) return;
    const time = Math.floor(n(ts) / 1000);
    const p = n(price);
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

  /* ================= ORDER SUBMIT ================= */
  async function placeOrder() {
    const payload = {
      symbol,
      side,
      type: orderType,
      quantity: n(orderQty),
      price: orderPrice ? n(orderPrice) : undefined,
      takeProfit: takeProfit ? n(takeProfit) : undefined,
      stopLoss: stopLoss ? n(stopLoss) : undefined,
      mode: "paper",
    };

    if (typeof api?.placePaperOrder === "function") {
      await api.placePaperOrder(payload);
    } else {
      await req("/api/trading/order", { method: "POST", body: payload });
    }

    loadSnapshot();
  }

  /* ================= STYLES ================= */

  const page = {
    height: "calc(100vh - 60px)",
    padding: 12,
    background: "linear-gradient(135deg, #0b0f19 0%, #111827 100%)",
    color: "rgba(255,255,255,.92)",
  };

  const card = {
    background: "rgba(17,24,39,.75)",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 12,
    backdropFilter: "blur(12px)",
  };

  const button = {
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#fff",
    cursor: "pointer",
  };

  /* ================= RENDER ================= */

  return (
    <div style={page}>
      {/* TOP BAR */}
      <div style={{ ...card, display: "flex", justifyContent: "space-between", padding: 10 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} style={button}>
            <option>EURUSD</option>
            <option>BTCUSDT</option>
          </select>

          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} style={button}>
            <option>1D</option>
            <option>4H</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={button} onClick={() => setExecOpen(true)}>
            Execute Order
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        {/* CHART */}
        <div style={{ ...card, flex: 1, padding: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>
            {symbol} • {timeframe} • PAPER
          </div>
          <div ref={chartContainerRef} style={{ height: 400 }} />
        </div>

        {/* EXEC PANEL */}
        {execOpen && (
          <div style={{ ...card, width: 320, padding: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>
              Execute Order
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <button
                style={{
                  ...button,
                  background: side === "BUY" ? "#22c55e" : "rgba(255,255,255,.05)",
                }}
                onClick={() => setSide("BUY")}
              >
                BUY
              </button>
              <button
                style={{
                  ...button,
                  background: side === "SELL" ? "#ef4444" : "rgba(255,255,255,.05)",
                }}
                onClick={() => setSide("SELL")}
              >
                SELL
              </button>
            </div>

            <input
              value={orderPrice}
              onChange={(e) => setOrderPrice(e.target.value)}
              placeholder="Order Price"
              style={{ ...button, width: "100%", marginTop: 8 }}
            />

            <input
              value={orderQty}
              onChange={(e) => setOrderQty(e.target.value)}
              placeholder="Quantity"
              style={{ ...button, width: "100%", marginTop: 8 }}
            />

            <button
              style={{
                ...button,
                width: "100%",
                marginTop: 10,
                background: side === "BUY" ? "#22c55e" : "#ef4444",
              }}
              onClick={placeOrder}
            >
              Confirm {side}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
