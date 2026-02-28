// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — INSTITUTIONAL TERMINAL v2
// Full Layout Architecture Upgrade
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

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);

  const [symbol, setSymbol] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("1D");
  const [activeTab, setActiveTab] = useState("positions");
  const [execOpen, setExecOpen] = useState(false);

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
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: { background: { color: "#0a0f1c" }, textColor: "#d1d5db" },
      grid: {
        vertLines: { color: "rgba(255,255,255,.04)" },
        horzLines: { color: "rgba(255,255,255,.04)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,.08)" },
      timeScale: { borderColor: "rgba(255,255,255,.08)" },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    chartRef.current.addCandlestickSeries({
      upColor: "#16a34a",
      downColor: "#dc2626",
      wickUpColor: "#16a34a",
      wickDownColor: "#dc2626",
      borderVisible: false,
    });

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

  /* ================= WEBSOCKET ================= */

  useEffect(() => {
    const wsUrl = buildWsUrl();
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);

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

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      background: "#0a0f1c",
      color: "#d1d5db"
    }}>

      {/* ================= TOP BAR ================= */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        background: "#111827",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        borderBottom: "1px solid rgba(255,255,255,.06)",
        zIndex: 20
      }}>
        <div style={{ fontWeight: 700 }}>
          {symbol} · {timeframe}
        </div>

        <div style={{ marginLeft: 12 }}>
          <select value={symbol} onChange={(e)=>setSymbol(e.target.value)}>
            <option>EURUSD</option>
            <option>BTCUSDT</option>
          </select>
        </div>

        <div style={{ marginLeft: 6 }}>
          <select value={timeframe} onChange={(e)=>setTimeframe(e.target.value)}>
            <option>1D</option>
            <option>4H</option>
            <option>1H</option>
          </select>
        </div>

        <div style={{ marginLeft: "auto", color: priceColor, fontWeight: 700 }}>
          {lastPrice ? lastPrice.toFixed(5) : "--"}
        </div>
      </div>

      {/* ================= LEFT TOOL RAIL ================= */}
      <div style={{
        position: "absolute",
        top: 40,
        bottom: 200,
        left: 0,
        width: 46,
        background: "#111827",
        borderRight: "1px solid rgba(255,255,255,.06)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 8,
        gap: 12
      }}>
        {["✎","╱","T","⌁","⊕","⚲","👁"].map((i,idx)=>(
          <div key={idx} style={{
            width:32,
            height:32,
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            borderRadius:4,
            cursor:"pointer",
            opacity:.7
          }}>
            {i}
          </div>
        ))}
      </div>

      {/* ================= RIGHT WATCHLIST ================= */}
      <div style={{
        position: "absolute",
        top: 40,
        bottom: 200,
        right: 0,
        width: 220,
        background: "#111827",
        borderLeft: "1px solid rgba(255,255,255,.06)",
        padding: 12
      }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Watchlist</div>
        {["EURUSD","BTCUSDT"].map(s=>(
          <div key={s} style={{
            padding:"6px 4px",
            cursor:"pointer",
            fontSize:14
          }} onClick={()=>setSymbol(s)}>
            {s}
          </div>
        ))}
      </div>

      {/* ================= CHART AREA ================= */}
      <div
        ref={chartContainerRef}
        style={{
          position: "absolute",
          top: 40,
          left: 46,
          right: 220,
          bottom: 200
        }}
      />

      {/* ================= BOTTOM TERMINAL ================= */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
        background: "#111827",
        borderTop: "1px solid rgba(255,255,255,.06)"
      }}>
        <div style={{
          display: "flex",
          borderBottom: "1px solid rgba(255,255,255,.06)"
        }}>
          {["positions","orders","history"].map(tab=>(
            <div key={tab}
              onClick={()=>setActiveTab(tab)}
              style={{
                padding:"10px 16px",
                cursor:"pointer",
                background: activeTab===tab ? "#1f2937" : "transparent"
              }}>
              {tab.toUpperCase()}
            </div>
          ))}
        </div>

        <div style={{ padding: 12 }}>
          {activeTab==="positions" && (
            <div>Open Positions: {snapshot?.positions?.length ?? 0}</div>
          )}
          {activeTab==="orders" && (
            <div>Pending Orders</div>
          )}
          {activeTab==="history" && (
            <div>Trade History</div>
          )}
        </div>
      </div>

    </div>
  );
}
