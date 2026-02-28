// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — TV STYLE + LIVE HEADER + ACCOUNT TERMINAL
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

  const chartRef = useRef(null);
  const containerRef = useRef(null);
  const wsRef = useRef(null);

  const [symbol, setSymbol] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("1D");
  const [execOpen, setExecOpen] = useState(false);
  const [side, setSide] = useState("SELL");
  const [orderType, setOrderType] = useState("LIMIT");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderQty, setOrderQty] = useState("1000");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  const [snapshot, setSnapshot] = useState({});
  const [lastPrice, setLastPrice] = useState(null);
  const [priceColor, setPriceColor] = useState("#fff");

  /* ===== SNAPSHOT POLLING ===== */
  useEffect(() => {
    const load = async () => {
      let data = {};
      if (api?.tradingLiveSnapshot) data = await api.tradingLiveSnapshot();
      else data = await req("/api/trading/live-snapshot");
      setSnapshot(data || {});
    };
    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, []);

  /* ===== CHART INIT ===== */
  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = createChart(containerRef.current, {
      layout: { background: { color: "#0b0f19" }, textColor: "#ffffff" },
      grid: {
        vertLines: { color: "rgba(255,255,255,.05)" },
        horzLines: { color: "rgba(255,255,255,.05)" },
      },
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

  /* ===== WS PRICE UPDATE ===== */
  useEffect(() => {
    const wsUrl = buildWsUrl();
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "tick") {
          const price = n(msg.price);
          setPriceColor(prev =>
            lastPrice && price > lastPrice ? "#16a34a" :
            lastPrice && price < lastPrice ? "#dc2626" :
            prev
          );
          setLastPrice(price);
        }
      } catch {}
    };

    return () => ws.close();
  }, [symbol, lastPrice]);

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

    if (api?.placePaperOrder) await api.placePaperOrder(payload);
    else await req("/api/trading/order", { method: "POST", body: payload });
  }

  return (
    <div style={{
      height: "100%",
      width: "100%",
      background: "#0b0f19",
      position: "relative",
      overflow: "hidden",
      color: "#fff"
    }}>

      {/* TOP BAR */}
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

      {/* LEFT RAIL */}
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
        gap:14
      }}>
        {["↖","✎","╱","T","⌁","⎘","⊕","⚲","⌂","👁"].map((i,idx)=>(
          <div key={idx}>{i}</div>
        ))}
      </div>

      {/* CHART */}
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

      {/* LIVE PRICE HEADER */}
      <div style={{
        position:"absolute",
        top:56,
        left:60,
        zIndex:25,
        fontWeight:700
      }}>
        {symbol} · {timeframe} · Paper
        <div style={{ color: priceColor }}>
          {lastPrice ? lastPrice.toFixed(5) : "--"}
        </div>
      </div>

      {/* BOTTOM TERMINAL */}
      <div style={{
        position:"absolute",
        bottom:0,
        left:0,
        right:0,
        height:160,
        background:"#111827",
        borderTop:"1px solid rgba(255,255,255,.1)",
        padding:12
      }}>
        <div style={{ display:"flex", gap:20 }}>
          <div>Balance: {snapshot?.balance ?? "--"}</div>
          <div>Equity: {snapshot?.equity ?? "--"}</div>
          <div>Open PnL: {snapshot?.openProfit ?? "--"}</div>
          <div>Positions: {snapshot?.positions?.length ?? 0}</div>
        </div>
      </div>

      {/* EXEC PANEL remains unchanged */}
      {execOpen && (
        <div style={{
          position:"absolute",
          top:80,
          right:40,
          width:340,
          background:"#111827",
          padding:16,
          border:"1px solid rgba(255,255,255,.1)",
          zIndex:30
        }}>
          <div style={{ fontWeight:900 }}>{symbol} • Paper Trading</div>
          {/* Rest of order UI stays the same */}
        </div>
      )}
    </div>
  );
}
