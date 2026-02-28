// ============================================================
// TRADING ROOM — BLUEPRINT MATCH STRUCTURE
// Exact visual layout replication
// Backend logic preserved
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { getSavedUser, getToken, req, api } from "../lib/api.js";
import { Navigate } from "react-router-dom";

function buildWsUrl() {
  const token = getToken();
  if (!token) return null;
  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  return `${protocol}${window.location.host}/ws/market?token=${encodeURIComponent(
    token
  )}`;
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
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const wsRef = useRef(null);
  const pollRef = useRef(null);
  const candleDataRef = useRef([]);

  const [symbol, setSymbol] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("1D");
  const [execOpen, setExecOpen] = useState(true);
  const [side, setSide] = useState("BUY");
  const [qty, setQty] = useState(1000);
  const [snapshot, setSnapshot] = useState({});

  /* ================= SNAPSHOT (KEEP) ================= */

  async function loadSnapshot() {
    try {
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
  }

  useEffect(() => {
    loadSnapshot();
    pollRef.current = setInterval(loadSnapshot, 5000);
    return () => clearInterval(pollRef.current);
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
        vertLines: { color: "rgba(255,255,255,.06)" },
        horzLines: { color: "rgba(255,255,255,.06)" },
      },
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

  /* ================= WS (KEEP) ================= */

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

  async function placeOrder() {
    const payload = {
      symbol,
      side,
      quantity: n(qty),
      mode: "paper",
    };

    if (typeof api?.placePaperOrder === "function") {
      await api.placePaperOrder(payload);
    } else {
      await req("/api/trading/order", { method: "POST", body: payload });
    }
  }

  /* ================= RENDER ================= */

  return (
    <div style={{ height: "calc(100vh - 60px)", padding: 12 }}>

      {/* TOP TOOLBAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: 52,
          padding: "0 14px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,.10)",
          background: "rgba(0,0,0,.35)",
          marginBottom: 12
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>☰</div>

          <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            <option>EURUSD</option>
            <option>BTCUSDT</option>
          </select>

          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            <option>1D</option>
            <option>4H</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Paper Trading</div>
          <button onClick={() => setExecOpen(true)}>Execute Order</button>
          <button>Publish</button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div style={{ display: "flex", gap: 12, height: "calc(100% - 180px)" }}>

        {/* LEFT TOOL RAIL */}
        <div
          style={{
            width: 56,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,.10)",
            background: "rgba(0,0,0,.35)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 10,
            gap: 12
          }}
        >
          {["↖", "✎", "╱", "T", "⌁", "⎘", "⊕", "⚲", "⌂", "👁"].map((i, idx) => (
            <div key={idx}>{i}</div>
          ))}
        </div>

        {/* CHART */}
        <div
          style={{
            flex: 1,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,.10)",
            background: "rgba(0,0,0,.35)",
            padding: 12,
            position: "relative"
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 8 }}>
            {symbol} • {timeframe} • PAPER
          </div>

          <div
            ref={chartContainerRef}
            style={{ width: "100%", height: "calc(100% - 24px)" }}
          />
        </div>

        {/* EXECUTE PANEL */}
        {execOpen && (
          <div
            style={{
              width: 320,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,.10)",
              background: "rgba(0,0,0,.35)",
              padding: 14
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 10 }}>
              Execute Order
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setSide("BUY")}>BUY</button>
              <button onClick={() => setSide("SELL")}>SELL</button>
            </div>

            <div style={{ marginTop: 10 }}>
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="Quantity"
              />
            </div>

            <button
              onClick={placeOrder}
              style={{ marginTop: 12, width: "100%" }}
            >
              Confirm {side}
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM TERMINAL */}
      <div
        style={{
          marginTop: 12,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,.10)",
          background: "rgba(0,0,0,.35)",
          padding: 12,
          height: 150
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <div>Positions</div>
          <div>Orders</div>
          <div>History</div>
          <div>Account</div>
        </div>
      </div>
    </div>
  );
}
