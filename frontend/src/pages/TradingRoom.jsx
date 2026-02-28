// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — DARK BLUEPRINT MATCH (FINAL STRUCTURE)
// Layout matched to AI blueprint
// Backend architecture preserved
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { getSavedUser, getToken, req, api } from "../lib/api.js";
import { Navigate } from "react-router-dom";

/* ================= SAME-ORIGIN WS (DO NOT TOUCH) ================= */
function buildWsUrl() {
  const token = getToken();
  if (!token) return null;
  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  return `${protocol}${window.location.host}/ws/market?token=${encodeURIComponent(
    token
  )}`;
}

function n(v, f = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : f;
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
  const [execOpen, setExecOpen] = useState(false);
  const [side, setSide] = useState("BUY");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderQty, setOrderQty] = useState("1000");
  const [bottomTab, setBottomTab] = useState("positions");

  /* ================= SNAPSHOT POLLING (LOCK) ================= */
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

  /* ================= CHART INIT ================= */
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#fff",
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

  /* ================= WS (LOCK) ================= */
  useEffect(() => {
    const wsUrl = buildWsUrl();
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "tick") updateCandle(msg.price, msg.ts);
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
      quantity: n(orderQty),
      price: orderPrice ? n(orderPrice) : undefined,
      mode: "paper",
    };

    if (typeof api?.placePaperOrder === "function") {
      await api.placePaperOrder(payload);
    } else {
      await req("/api/trading/order", { method: "POST", body: payload });
    }

    loadSnapshot();
  }

  /* ================= THEME ================= */
  const page = {
    height: "calc(100vh - 60px)",
    padding: 12,
    background: "linear-gradient(135deg,#0b0f19 0%,#111827 100%)",
    color: "#fff",
  };

  const card = {
    background: "rgba(17,24,39,.75)",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 12,
    backdropFilter: "blur(12px)",
  };

  const btn = {
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 8,
    padding: "6px 10px",
    color: "#fff",
    cursor: "pointer",
  };

  /* ================= RENDER ================= */

  return (
    <div style={page}>

      {/* ===== TOP TOOLBAR (Blueprint Style) ===== */}
      <div style={{ ...card, padding: 10, display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} style={btn}>
            <option>EURUSD</option>
            <option>BTCUSDT</option>
          </select>

          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} style={btn}>
            <option>1D</option>
            <option>4H</option>
          </select>
        </div>

        <button style={btn} onClick={() => setExecOpen(true)}>
          Execute Order
        </button>
      </div>

      {/* ===== MAIN GRID ===== */}
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>

        {/* LEFT TOOL RAIL */}
        <div style={{ ...card, width: 50, padding: 8, display: "flex", flexDirection: "column", gap: 10 }}>
          {["↖","✎","╱","T","⌁","⎘","⊕","⚲","⌂","👁"].map((i,idx)=>(
            <div key={idx}>{i}</div>
          ))}
        </div>

        {/* CHART */}
        <div style={{ ...card, flex: 1, padding: 12, position:"relative" }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>
            {symbol} • {timeframe} • PAPER
          </div>
          <div ref={chartContainerRef} style={{ height: 420 }} />
        </div>
      </div>

      {/* ===== BOTTOM TERMINAL ===== */}
      <div style={{ ...card, marginTop: 12, padding: 12 }}>
        <div style={{ display: "flex", gap: 12 }}>
          {["positions","orders","history","account"].map(t=>(
            <div key={t}
              style={{ cursor:"pointer", opacity: bottomTab===t?1:.6 }}
              onClick={()=>setBottomTab(t)}>
              {t.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* ===== FLOATING EXEC PANEL (TOP BUTTON TRIGGER) ===== */}
      {execOpen && (
        <div style={{
          position:"fixed",
          right:40,
          top:120,
          width:320,
          ...card,
          padding:14
        }}>
          <div style={{ fontWeight:900, marginBottom:10 }}>Execute Order</div>

          <div style={{ display:"flex", gap:6 }}>
            <button style={{ ...btn, background: side==="BUY"?"#22c55e":"rgba(255,255,255,.05)" }}
              onClick={()=>setSide("BUY")}>BUY</button>
            <button style={{ ...btn, background: side==="SELL"?"#ef4444":"rgba(255,255,255,.05)" }}
              onClick={()=>setSide("SELL")}>SELL</button>
          </div>

          <input
            value={orderPrice}
            onChange={(e)=>setOrderPrice(e.target.value)}
            placeholder="Order Price"
            style={{ ...btn, width:"100%", marginTop:8 }}
          />

          <input
            value={orderQty}
            onChange={(e)=>setOrderQty(e.target.value)}
            placeholder="Quantity"
            style={{ ...btn, width:"100%", marginTop:8 }}
          />

          <button
            onClick={placeOrder}
            style={{
              ...btn,
              width:"100%",
              marginTop:10,
              background: side==="BUY"?"#22c55e":"#ef4444"
            }}>
            Confirm {side}
          </button>

          <div style={{ marginTop:8, fontSize:11, opacity:.6 }}>
            Mode: PAPER • Owner: ADMIN • Supervisor: MANAGER
          </div>

          <div style={{ textAlign:"right", marginTop:8 }}>
            <button style={btn} onClick={()=>setExecOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
