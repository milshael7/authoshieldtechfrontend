// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — STRUCTURAL DUPLICATE (TV STYLE)
// Absolute layered layout
// Backend logic preserved
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { getSavedUser, getToken, req, api } from "../lib/api.js";
import { Navigate } from "react-router-dom";

/* ================= SAME-ORIGIN WS ================= */
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

  /* ===== ROLE GUARD ===== */
  const user = getSavedUser();
  const role = String(user?.role || "").toLowerCase();
  if (!user || (role !== "admin" && role !== "manager")) {
    return <Navigate to="/admin" replace />;
  }

  /* ===== REFS ===== */
  const chartRef = useRef(null);
  const containerRef = useRef(null);
  const wsRef = useRef(null);
  const candleDataRef = useRef([]);

  /* ===== STATE ===== */
  const [symbol, setSymbol] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("1D");
  const [execOpen, setExecOpen] = useState(false);
  const [side, setSide] = useState("SELL");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderQty, setOrderQty] = useState("1000");

  /* ===== SNAPSHOT POLLING ===== */
  useEffect(() => {
    const load = async () => {
      if (api?.tradingLiveSnapshot) await api.tradingLiveSnapshot();
      else await req("/api/trading/live-snapshot");
    };
    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, []);

  /* ===== CHART INIT ===== */
  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = createChart(containerRef.current, {
      layout: {
        background: { color: "#0b0f19" },
        textColor: "#ffffff",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,.05)" },
        horzLines: { color: "rgba(255,255,255,.05)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,.15)" },
      timeScale: { borderColor: "rgba(255,255,255,.15)" },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    chartRef.current.addCandlestickSeries();

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

  /* ===== WS ===== */
  useEffect(() => {
    const wsUrl = buildWsUrl();
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "tick") {
          // simplified for structure phase
        }
      } catch {}
    };

    return () => ws.close();
  }, [symbol]);

  async function placeOrder() {
    const payload = {
      symbol,
      side,
      quantity: n(orderQty),
      price: orderPrice ? n(orderPrice) : undefined,
      mode: "paper",
    };

    if (api?.placePaperOrder) await api.placePaperOrder(payload);
    else await req("/api/trading/order", { method: "POST", body: payload });
  }

  /* ===== RENDER ===== */
  return (
    <div style={{
      height: "calc(100vh - 60px)",
      background: "#0b0f19",
      position: "relative",
      overflow: "hidden",
      color: "#fff"
    }}>

      {/* ===== TOP TOOLBAR ===== */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 48,
        background: "#111827",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        zIndex: 20
      }}>
        <select value={symbol} onChange={(e)=>setSymbol(e.target.value)}>
          <option>EURUSD</option>
          <option>BTCUSDT</option>
        </select>

        <select value={timeframe} onChange={(e)=>setTimeframe(e.target.value)} style={{ marginLeft:8 }}>
          <option>1D</option>
          <option>4H</option>
        </select>

        <button style={{ marginLeft:"auto" }} onClick={()=>setExecOpen(true)}>
          Execute Order
        </button>
      </div>

      {/* ===== LEFT TOOL RAIL ===== */}
      <div style={{
        position:"absolute",
        top:48,
        bottom:160,
        left:0,
        width:50,
        background:"#111827",
        display:"flex",
        flexDirection:"column",
        alignItems:"center",
        paddingTop:10,
        gap:10,
        zIndex:10
      }}>
        {["↖","✎","╱","T","⌁","⎘","⊕","⚲","⌂","👁"].map((i,idx)=>(
          <div key={idx}>{i}</div>
        ))}
      </div>

      {/* ===== CHART ===== */}
      <div
        ref={containerRef}
        style={{
          position:"absolute",
          top:48,
          left:50,
          right:0,
          bottom:160,
        }}
      />

      {/* ===== BOTTOM TERMINAL ===== */}
      <div style={{
        position:"absolute",
        bottom:0,
        left:0,
        right:0,
        height:160,
        background:"#111827",
        borderTop:"1px solid rgba(255,255,255,.1)",
        zIndex:15,
        padding:12
      }}>
        Positions | Orders | History | Account
      </div>

      {/* ===== FLOATING EXEC PANEL ===== */}
      {execOpen && (
        <div style={{
          position:"absolute",
          top:80,
          right:40,
          width:320,
          background:"#111827",
          padding:14,
          border:"1px solid rgba(255,255,255,.1)",
          zIndex:30
        }}>
          <div style={{ fontWeight:900 }}>Execute Order</div>

          <div style={{ display:"flex", gap:6, marginTop:8 }}>
            <button onClick={()=>setSide("BUY")}>BUY</button>
            <button onClick={()=>setSide("SELL")}>SELL</button>
          </div>

          <input
            placeholder="Order Price"
            value={orderPrice}
            onChange={(e)=>setOrderPrice(e.target.value)}
            style={{ width:"100%", marginTop:8 }}
          />

          <input
            placeholder="Quantity"
            value={orderQty}
            onChange={(e)=>setOrderQty(e.target.value)}
            style={{ width:"100%", marginTop:8 }}
          />

          <button onClick={placeOrder} style={{ width:"100%", marginTop:10 }}>
            Confirm {side}
          </button>

          <button onClick={()=>setExecOpen(false)} style={{ marginTop:8 }}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}
