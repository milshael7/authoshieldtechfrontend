// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — TV STYLE STRUCTURAL DUPLICATE
// Exact Proportions + Dark Order Panel
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

  /* ===== STATE ===== */
  const [symbol, setSymbol] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("1D");
  const [execOpen, setExecOpen] = useState(false);
  const [side, setSide] = useState("SELL");
  const [orderType, setOrderType] = useState("LIMIT");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderQty, setOrderQty] = useState("1000");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");

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
          // Live logic can be wired later
        }
      } catch {}
    };

    return () => ws.close();
  }, [symbol]);

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

  /* ===== RENDER ===== */
  return (
    <div style={{
      height: "100%",
      width: "100%",
      background: "#0b0f19",
      position: "relative",
      overflow: "hidden",
      color: "#fff"
    }}>

      {/* ===== TOP TOOLBAR (48px) ===== */}
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
        borderBottom: "1px solid rgba(255,255,255,.08)",
        zIndex: 20
      }}>
        <select value={symbol} onChange={(e)=>setSymbol(e.target.value)}
          style={{ background:"#0b0f19", color:"#fff", border:"1px solid #222", padding:"4px 8px" }}>
          <option>EURUSD</option>
          <option>BTCUSDT</option>
        </select>

        <select value={timeframe} onChange={(e)=>setTimeframe(e.target.value)}
          style={{ marginLeft:8, background:"#0b0f19", color:"#fff", border:"1px solid #222", padding:"4px 8px" }}>
          <option>1D</option>
          <option>4H</option>
        </select>

        <button
          style={{
            marginLeft:"auto",
            background:"#1f2937",
            color:"#fff",
            border:"1px solid rgba(255,255,255,.15)",
            padding:"6px 12px",
            cursor:"pointer"
          }}
          onClick={()=>setExecOpen(true)}
        >
          Execute Order
        </button>
      </div>

      {/* ===== LEFT TOOL RAIL (50px) ===== */}
      <div style={{
        position:"absolute",
        top:48,
        bottom:160,
        left:0,
        width:50,
        background:"#111827",
        borderRight:"1px solid rgba(255,255,255,.08)",
        display:"flex",
        flexDirection:"column",
        alignItems:"center",
        paddingTop:10,
        gap:14,
        zIndex:10
      }}>
        {["↖","✎","╱","T","⌁","⎘","⊕","⚲","⌂","👁"].map((i,idx)=>(
          <div key={idx} style={{ cursor:"pointer", opacity:.8 }}>{i}</div>
        ))}
      </div>

      {/* ===== CHART AREA ===== */}
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

      {/* ===== BOTTOM TERMINAL (160px) ===== */}
      <div style={{
        position:"absolute",
        bottom:0,
        left:0,
        right:0,
        height:160,
        background:"#111827",
        borderTop:"1px solid rgba(255,255,255,.1)",
        zIndex:15,
        padding:"10px 16px",
        display:"flex",
        alignItems:"flex-start"
      }}>
        <div style={{ display:"flex", gap:18, fontSize:13 }}>
          <div style={{ fontWeight:700 }}>Positions</div>
          <div>Orders</div>
          <div>History</div>
          <div>Account</div>
        </div>
      </div>

      {/* ===== FLOATING EXEC PANEL ===== */}
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

          <div style={{ display:"flex", marginTop:12 }}>
            <button
              onClick={()=>setSide("BUY")}
              style={{
                flex:1,
                background: side==="BUY" ? "#16a34a" : "#1f2937",
                color:"#fff",
                border:"none",
                padding:"8px",
                fontWeight:600
              }}
            >
              Buy
            </button>
            <button
              onClick={()=>setSide("SELL")}
              style={{
                flex:1,
                background: side==="SELL" ? "#dc2626" : "#1f2937",
                color:"#fff",
                border:"none",
                padding:"8px",
                fontWeight:600
              }}
            >
              Sell
            </button>
          </div>

          <div style={{ display:"flex", gap:6, marginTop:12 }}>
            {["LIMIT","MARKET","STOP"].map(type=>(
              <div key={type}
                onClick={()=>setOrderType(type)}
                style={{
                  flex:1,
                  textAlign:"center",
                  padding:"6px",
                  background: orderType===type ? "#1f2937" : "#0b0f19",
                  border:"1px solid rgba(255,255,255,.08)",
                  fontSize:12,
                  cursor:"pointer"
                }}>
                {type}
              </div>
            ))}
          </div>

          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:12, opacity:.6 }}>Order Price</div>
            <input
              value={orderPrice}
              onChange={(e)=>setOrderPrice(e.target.value)}
              style={{
                width:"100%",
                marginTop:4,
                padding:"8px",
                background:"#0b0f19",
                border:"1px solid rgba(255,255,255,.08)",
                color:"#fff"
              }}
            />
          </div>

          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:12, opacity:.6 }}>Quantity</div>
            <input
              value={orderQty}
              onChange={(e)=>setOrderQty(e.target.value)}
              style={{
                width:"100%",
                marginTop:4,
                padding:"8px",
                background:"#0b0f19",
                border:"1px solid rgba(255,255,255,.08)",
                color:"#fff"
              }}
            />
          </div>

          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, opacity:.6 }}>Take Profit</div>
              <input
                value={takeProfit}
                onChange={(e)=>setTakeProfit(e.target.value)}
                style={{
                  width:"100%",
                  marginTop:4,
                  padding:"8px",
                  background:"#0b0f19",
                  border:"1px solid rgba(255,255,255,.08)",
                  color:"#fff"
                }}
              />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, opacity:.6 }}>Stop Loss</div>
              <input
                value={stopLoss}
                onChange={(e)=>setStopLoss(e.target.value)}
                style={{
                  width:"100%",
                  marginTop:4,
                  padding:"8px",
                  background:"#0b0f19",
                  border:"1px solid rgba(255,255,255,.08)",
                  color:"#fff"
                }}
              />
            </div>
          </div>

          <button
            onClick={placeOrder}
            style={{
              width:"100%",
              marginTop:16,
              padding:"10px",
              background: side==="BUY" ? "#16a34a" : "#dc2626",
              border:"none",
              color:"#fff",
              fontWeight:700
            }}
          >
            Place {side} Order
          </button>

          <button
            onClick={()=>setExecOpen(false)}
            style={{
              width:"100%",
              marginTop:8,
              padding:"6px",
              background:"#1f2937",
              border:"none",
              color:"#fff"
            }}
          >
            Close
          </button>

        </div>
      )}
    </div>
  );
}
