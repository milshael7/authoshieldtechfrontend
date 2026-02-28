// frontend/src/pages/TradingRoom.jsx
// ============================================================
// TRADING ROOM — RESTORED BASELINE (YOUR TERMINAL LAYOUT)
// - Keeps terminal.css structure (NO layout remixes)
// - Visible candles (seed + live WS tick updates)
// - Execute Order panel: smaller + dock/float + toggle
// - Snapshot polling NOT included here (add back later if you want)
//   (You can paste your snapshot polling back in once UI is stable.)
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { getSavedUser, getToken, api, req } from "../lib/api.js";
import { Navigate } from "react-router-dom";
import "../styles/terminal.css";

/* ================= WS URL (SAME ORIGIN) ================= */
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
  const candleSeriesRef = useRef(null);
  const candleDataRef = useRef([]);
  const wsRef = useRef(null);

  /* ================= UI STATE ================= */
  const [symbol] = useState("EURUSD"); // keep simple for now
  const [execOpen, setExecOpen] = useState(false);
  const [execDocked, setExecDocked] = useState(true);
  const [execPos, setExecPos] = useState({ x: 260, y: 120 });
  const [dragging, setDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // SMALLER panel (this is what you asked for)
  const [panelWidth] = useState(300);

  const [side, setSide] = useState("SELL");
  const [orderType, setOrderType] = useState("LIMIT");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderQty, setOrderQty] = useState("1000");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  const [toast, setToast] = useState("");

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
      rightPriceScale: {
        borderColor: "rgba(255,255,255,.12)",
        scaleMargins: { top: 0.12, bottom: 0.12 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,.12)",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,.15)" },
        horzLine: { color: "rgba(255,255,255,.15)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    candleSeriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: "#2bd576",
      downColor: "#ff5a5f",
      wickUpColor: "#2bd576",
      wickDownColor: "#ff5a5f",
      borderVisible: false,
    });

    // Make candles look normal (not fat)
    chartRef.current.timeScale().applyOptions({
      barSpacing: 6,
      rightOffset: 2,
    });

    seedInitialCandles();

    const handleResize = () => {
      if (!chartRef.current || !chartContainerRef.current) return;
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      try {
        chartRef.current?.remove();
      } catch {}
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, []);

  function seedInitialCandles() {
    if (!candleSeriesRef.current) return;

    const now = Math.floor(Date.now() / 1000);
    const candles = [];
    let base = 1.1000;

    for (let i = 120; i > 0; i--) {
      const time = now - i * 3600; // hourly history
      const open = base;
      const close = open + (Math.random() - 0.5) * 0.004;
      const high = Math.max(open, close) + Math.random() * 0.0015;
      const low = Math.min(open, close) - Math.random() * 0.0015;
      candles.push({ time, open, high, low, close });
      base = close;
    }

    candleDataRef.current = candles;
    candleSeriesRef.current.setData(candles);
  }

  /* ================= LIVE WS UPDATES ================= */
  useEffect(() => {
    const wsUrl = buildWsUrl();
    if (!wsUrl) return;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg?.type === "tick") {
          updateCandle(msg.price, msg.ts);
        }
      } catch {}
    };

    ws.onerror = () => {
      try {
        ws.close();
      } catch {}
    };

    return () => {
      try {
        ws.close();
      } catch {}
      wsRef.current = null;
    };
  }, []);

  function updateCandle(price, ts) {
    if (!candleSeriesRef.current) return;

    const t = Math.floor(n(ts) / 1000);
    const p = n(price);

    if (!Number.isFinite(t) || !Number.isFinite(p) || p <= 0) return;

    const data = candleDataRef.current;
    const last = data[data.length - 1];

    if (!last || t > last.time) {
      const candle = { time: t, open: p, high: p, low: p, close: p };
      data.push(candle);
      candleSeriesRef.current.update(candle);
      // keep memory small
      if (data.length > 800) data.shift();
    } else {
      last.high = Math.max(last.high, p);
      last.low = Math.min(last.low, p);
      last.close = p;
      candleSeriesRef.current.update(last);
    }
  }

  /* ================= EXEC PANEL DRAG ================= */
  function startDrag(e) {
    if (execDocked) return;
    setDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  useEffect(() => {
    function onMove(e) {
      if (!dragging) return;
      setExecPos({
        x: Math.max(60, e.clientX - dragOffsetRef.current.x),
        y: Math.max(70, e.clientY - dragOffsetRef.current.y),
      });
    }
    function onUp() {
      if (!dragging) return;
      setDragging(false);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  /* ================= ORDER ACTION (SAFE PLACEHOLDER) ================= */
  async function placeOrder() {
    try {
      setToast("");

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

      let res = {};
      if (typeof api?.placePaperOrder === "function") {
        res = await api.placePaperOrder(payload);
      } else {
        res =
          (await req("/api/trading/paper/order", { method: "POST", body: payload })) ||
          (await req("/api/trading/order", { method: "POST", body: payload })) ||
          {};
      }

      setToast(res?.message || "Paper order submitted.");
      setTimeout(() => setToast(""), 2500);
    } catch (e) {
      setToast(e?.message || "Order failed.");
      setTimeout(() => setToast(""), 3000);
    }
  }

  /* ================= RENDER ================= */
  return (
    <div className="terminalRoot">
      {/* TOP BAR (KEEP SIMPLE + YOUR THEME) */}
      <div className="terminalTopbar">
        <div className="terminalSymbol">{symbol}</div>

        <div className="terminalActions">
          <button
            className="terminalBuy"
            onClick={() => {
              setSide("BUY");
              setExecOpen((v) => !v);
            }}
          >
            Execute Order
          </button>
        </div>
      </div>

      <div className="terminalBody">
        {/* LEFT RAIL (NO “T7” — just icons, no links) */}
        <div className="terminalRail" aria-label="Tools">
          {["✏", "📐", "📊", "⤿", "⊕", "⌖", "⚙"].map((ic, i) => (
            <div key={i} className="terminalRailItem" title="Tool">
              {ic}
            </div>
          ))}
        </div>

        {/* CHART AREA (panel spacing handled cleanly) */}
        <div
          className="terminalChartArea"
          style={{
            marginRight: execOpen && execDocked ? panelWidth : 0,
          }}
        >
          <div ref={chartContainerRef} className="terminalChartSurface" />

          {toast && (
            <div style={{ position: "absolute", left: 16, bottom: 16, opacity: 0.92 }}>
              <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(0,0,0,.35)", border: "1px solid rgba(255,255,255,.10)" }}>
                {toast}
              </div>
            </div>
          )}
        </div>

        {/* DOCKED EXEC PANEL */}
        {execOpen && execDocked && (
          <div className="terminalPanel" style={{ width: panelWidth }}>
            <div className="terminalPanelHeader">
              Execute Order
              <span style={{ float: "right", display: "flex", gap: 8 }}>
                <button
                  style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}
                  onClick={() => setExecDocked(false)}
                  title="Float"
                >
                  ⇱
                </button>
                <button
                  style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}
                  onClick={() => setExecOpen(false)}
                  title="Close"
                >
                  ✕
                </button>
              </span>
            </div>

            <div className="terminalPanelBody">
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="terminalBuy"
                  onClick={() => setSide("BUY")}
                  style={{ flex: 1, opacity: side === "BUY" ? 1 : 0.7 }}
                >
                  BUY
                </button>
                <button
                  className="terminalSell"
                  onClick={() => setSide("SELL")}
                  style={{ flex: 1, opacity: side === "SELL" ? 1 : 0.7 }}
                >
                  SELL
                </button>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {["LIMIT", "MARKET", "STOP"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,.10)",
                      background: orderType === t ? "rgba(94,167,255,.18)" : "rgba(255,255,255,.05)",
                      color: "rgba(255,255,255,.92)",
                      cursor: "pointer",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Order Price</div>
                <input
                  value={orderPrice}
                  onChange={(e) => setOrderPrice(e.target.value)}
                  placeholder={orderType === "MARKET" ? "Market" : "Enter price"}
                  disabled={orderType === "MARKET"}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Quantity</div>
                <input value={orderQty} onChange={(e) => setOrderQty(e.target.value)} />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Take Profit</div>
                  <input value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} placeholder="Optional" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Stop Loss</div>
                  <input value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} placeholder="Optional" />
                </div>
              </div>

              <button
                className={`terminalConfirm ${side === "BUY" ? "buy" : "sell"}`}
                onClick={placeOrder}
              >
                Confirm {side}
              </button>

              <div className="terminalAIMetrics">
                Status: Ready for backend connection<br />
                Mode: Paper (UI only right now)
              </div>
            </div>
          </div>
        )}

        {/* FLOATING EXEC PANEL */}
        {execOpen && !execDocked && (
          <div
            className="terminalPanel floating"
            style={{
              width: panelWidth,
              left: execPos.x,
              top: execPos.y,
              cursor: dragging ? "grabbing" : "grab",
            }}
          >
            <div className="terminalPanelHeader" onMouseDown={startDrag}>
              Execute Order
              <span style={{ float: "right", display: "flex", gap: 8 }}>
                <button
                  style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}
                  onClick={() => setExecDocked(true)}
                  title="Dock"
                >
                  ⇲
                </button>
                <button
                  style={{ background: "transparent", border: "none", color: "inherit", cursor: "pointer" }}
                  onClick={() => setExecOpen(false)}
                  title="Close"
                >
                  ✕
                </button>
              </span>
            </div>

            <div className="terminalPanelBody">
              <div style={{ display: "flex", gap: 8 }}>
                <button className="terminalBuy" onClick={() => setSide("BUY")} style={{ flex: 1 }}>
                  BUY
                </button>
                <button className="terminalSell" onClick={() => setSide("SELL")} style={{ flex: 1 }}>
                  SELL
                </button>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {["LIMIT", "MARKET", "STOP"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,.10)",
                      background: orderType === t ? "rgba(94,167,255,.18)" : "rgba(255,255,255,.05)",
                      color: "rgba(255,255,255,.92)",
                      cursor: "pointer",
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <input
                value={orderPrice}
                onChange={(e) => setOrderPrice(e.target.value)}
                placeholder={orderType === "MARKET" ? "Market" : "Order price"}
                disabled={orderType === "MARKET"}
              />
              <input value={orderQty} onChange={(e) => setOrderQty(e.target.value)} placeholder="Quantity" />
              <button className={`terminalConfirm ${side === "BUY" ? "buy" : "sell"}`} onClick={placeOrder}>
                Confirm {side}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
