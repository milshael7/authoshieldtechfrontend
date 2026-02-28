// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — TV STYLE PRO DARK (INSTITUTIONAL BUILD)
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

  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const wsRef = useRef(null);

  const [symbol, setSymbol] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("1D");
  const [execOpen, setExecOpen] = useState(false);

  const [side, setSide] = useState("BUY");
  const [orderType, setOrderType] = useState("LIMIT");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderQty, setOrderQty] = useState("1000");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  const [snapshot, setSnapshot] = useState({});
  const [lastPrice, setLastPrice] = useState(null);
  const [priceColor, setPriceColor] = useState("#ffffff");

  /* ================= SNAPSHOT ================= */

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

  /* ================= CHART ================= */

  useEffect(() => {
    if (!containerRef.current) return;

    chartRef.current = createChart(containerRef.current, {
      layout: { background: { color: "#0a0f1c" }, textColor: "#d1d5db" },
      grid: {
        vertLines: { color: "rgba(255,255,255,.04)" },
        horzLines: { color: "rgba(255,255,255,.04)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,.1)" },
      timeScale: { borderColor: "rgba(255,255,255,.1)" },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    chartRef.current.addCandlestickSeries({
      upColor: "#16a34a",
      downColor: "#dc2626",
      borderVisible: false,
      wickUpColor: "#16a34a",
      wickDownColor: "#dc2626",
    });

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

  /* ================= WS ================= */

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

    await req("/api/trading/order", { method: "POST", body: payload });
    setExecOpen(false);
  }

  return (
    <div style={{
      height: "100%",
      width: "100%",
      background: "#0a0f1c",
      position: "relative",
      color: "#d1d5db"
    }}>

      {/* ================= TOP BAR ================= */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 48,
        background: "#111827",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        borderBottom: "1px solid rgba(255,255,255,.05)",
        zIndex: 20
      }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>
          {symbol} · {timeframe} · PAPER
        </div>

        <div style={{ marginLeft: 20 }}>
          <select value={symbol} onChange={(e)=>setSymbol(e.target.value)}>
            <option>EURUSD</option>
            <option>BTCUSDT</option>
          </select>
        </div>

        <div style={{ marginLeft: 8 }}>
          <select value={timeframe} onChange={(e)=>setTimeframe(e.target.value)}>
            <option>1D</option>
            <option>4H</option>
            <option>1H</option>
          </select>
        </div>

        <div style={{ marginLeft: "auto", color: priceColor, fontWeight: 700 }}>
          {lastPrice ? lastPrice.toFixed(5) : "--"}
        </div>

        <button
          onClick={()=>setExecOpen(true)}
          style={{
            marginLeft: 16,
            padding: "6px 14px",
            background: "#2563eb",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            borderRadius: 4
          }}
        >
          Trade
        </button>
      </div>

      {/* ================= LEFT TOOL RAIL ================= */}
      <div style={{
        position: "absolute",
        top: 48,
        bottom: 160,
        left: 0,
        width: 52,
        background: "#0f172a",
        borderRight: "1px solid rgba(255,255,255,.05)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 14,
        gap: 18
      }}>
        {["✎","╱","T","⌁","⊕","⚲","👁"].map((i,idx)=>(
          <div key={idx} style={{ opacity:.6, cursor:"pointer" }}>{i}</div>
        ))}
      </div>

      {/* ================= CHART ================= */}
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          top: 48,
          left: 52,
          right: 0,
          bottom: 160
        }}
      />

      {/* ================= BOTTOM TERMINAL ================= */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 160,
        background: "#111827",
        borderTop: "1px solid rgba(255,255,255,.05)",
        padding: 12
      }}>
        <div style={{ display:"flex", gap:30, fontSize:14 }}>
          <div>Balance: {snapshot?.balance ?? "--"}</div>
          <div>Equity: {snapshot?.equity ?? "--"}</div>
          <div>Open PnL: {snapshot?.openProfit ?? "--"}</div>
          <div>Positions: {snapshot?.positions?.length ?? 0}</div>
        </div>
      </div>

      {/* ================= EXECUTION PANEL ================= */}
      {execOpen && (
        <div style={{
          position: "absolute",
          top: 90,
          right: 40,
          width: 360,
          background: "#111827",
          border: "1px solid rgba(255,255,255,.08)",
          padding: 18,
          zIndex: 40,
          borderRadius: 6
        }}>

          <div style={{ fontWeight: 800, marginBottom: 14 }}>
            {symbol} · Paper Trading
          </div>

          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            <button onClick={()=>setSide("BUY")} style={{ flex:1, background: side==="BUY"?"#16a34a":"#1f2937" }}>BUY</button>
            <button onClick={()=>setSide("SELL")} style={{ flex:1, background: side==="SELL"?"#dc2626":"#1f2937" }}>SELL</button>
          </div>

          <input placeholder="Quantity" value={orderQty} onChange={e=>setOrderQty(e.target.value)} />
          <input placeholder="Price" value={orderPrice} onChange={e=>setOrderPrice(e.target.value)} />
          <input placeholder="Take Profit" value={takeProfit} onChange={e=>setTakeProfit(e.target.value)} />
          <input placeholder="Stop Loss" value={stopLoss} onChange={e=>setStopLoss(e.target.value)} />

          <button
            onClick={placeOrder}
            style={{
              marginTop:12,
              width:"100%",
              padding:"10px",
              background:"#2563eb",
              border:"none",
              color:"#fff",
              cursor:"pointer"
            }}
          >
            Place Order
          </button>
        </div>
      )}

    </div>
  );
}
