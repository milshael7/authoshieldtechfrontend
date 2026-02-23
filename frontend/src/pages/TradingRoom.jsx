// frontend/src/pages/TradingRoom.jsx

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { api } from "../lib/api.js";
import "../styles/terminal.css";

const WS_URL =
  (window.location.protocol === "https:" ? "wss://" : "ws://") +
  window.location.host +
  "/ws/market";

export default function TradingRoom() {

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const candleDataRef = useRef([]);
  const wsRef = useRef(null);
  const pollingRef = useRef(null);

  const [snapshot, setSnapshot] = useState(null);
  const [snapshotError, setSnapshotError] = useState("");
  const [snapshotLoading, setSnapshotLoading] = useState(true);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelDocked, setPanelDocked] = useState(true);
  const [panelWidth, setPanelWidth] = useState(420);
  const [side, setSide] = useState("BUY");

  const [dragging, setDragging] = useState(false);
  const [floatPos, setFloatPos] = useState({ x: 300, y: 120 });

  const [signals, setSignals] = useState([]);

  /* ================= SNAPSHOT (HARDENED) ================= */

  async function loadSnapshot() {
    try {
      setSnapshotError("");
      const data = await api.tradingSnapshot();
      setSnapshot(data);
    } catch (e) {
      console.error("Snapshot error:", e);
      setSnapshotError(e.message || "Failed to load snapshot");
    } finally {
      setSnapshotLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function initialLoad() {
      if (!mounted) return;
      await loadSnapshot();
    }

    initialLoad();

    pollingRef.current = setInterval(() => {
      loadSnapshot();
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(pollingRef.current);
    };
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
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      rightPriceScale: { borderColor: "rgba(255,255,255,.1)" },
      timeScale: { borderColor: "rgba(255,255,255,.1)" },
    });

    seriesRef.current = chartRef.current.addCandlestickSeries();

    const handleResize = () => {
      if (!chartRef.current) return;
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);

  }, []);

  /* ================= WEBSOCKET (HARDENED) ================= */

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Market WS connected");
    };

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
      } catch (e) {
        console.warn("WS parse error:", e);
      }
    };

    ws.onerror = (e) => {
      console.warn("WS error:", e);
    };

    ws.onclose = () => {
      console.warn("Market WS closed");
    };

    return () => {
      ws.close();
    };
  }, []);

  /* ================= CANDLE LOGIC ================= */

  function updateCandle(price, ts) {
    if (!seriesRef.current) return;

    const time = Math.floor(ts / 1000);
    const lastCandle = candleDataRef.current[candleDataRef.current.length - 1];

    if (!lastCandle || time > lastCandle.time) {
      const newCandle = {
        time,
        open: price,
        high: price,
        low: price,
        close: price,
      };
      candleDataRef.current.push(newCandle);
      seriesRef.current.update(newCandle);
    } else {
      lastCandle.high = Math.max(lastCandle.high, price);
      lastCandle.low = Math.min(lastCandle.low, price);
      lastCandle.close = price;
      seriesRef.current.update(lastCandle);
    }
  }

  /* ================= PANEL LOGIC ================= */

  function togglePanel(type) {
    setSide(type);

    if (!panelOpen) {
      setPanelOpen(true);
      setPanelDocked(true);
    } else {
      if (panelDocked) {
        setPanelOpen(false);
      } else {
        setPanelDocked(true);
      }
    }
  }

  function startDrag() {
    setDragging(true);
  }

  function onDrag(e) {
    if (!dragging) return;
    setFloatPos({
      x: e.clientX - 200,
      y: e.clientY - 20,
    });
  }

  function stopDrag() {
    if (dragging) {
      setDragging(false);
      setPanelDocked(false);
    }
  }

  useEffect(() => {
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
    return () => {
      window.removeEventListener("mousemove", onDrag);
      window.removeEventListener("mouseup", stopDrag);
    };
  }, [dragging]);

  /* ================= RENDER ================= */

  return (
    <div className="terminalRoot">

      <div className="terminalTopbar">
        <div className="terminalSymbol">BTCUSDT</div>

        <div className="terminalActions">
          <button className="terminalBuy" onClick={() => togglePanel("BUY")}>
            BUY
          </button>

          <button className="terminalSell" onClick={() => togglePanel("SELL")}>
            SELL
          </button>
        </div>
      </div>

      {snapshotError && (
        <div style={{ padding: 10, color: "#ff5a5f" }}>
          {snapshotError}
        </div>
      )}

      <div className="terminalBody">

        <div className="terminalRail">
          <div className="terminalRailItem">✏</div>
          <div className="terminalRailItem">📐</div>
          <div className="terminalRailItem">📊</div>
        </div>

        <div
          className="terminalChartArea"
          style={{
            marginRight: panelOpen && panelDocked ? panelWidth : 0,
          }}
        >
          <div
            ref={chartContainerRef}
            className="terminalChartSurface"
          />
        </div>

        {panelOpen && panelDocked && (
          <div className="terminalPanel" style={{ width: panelWidth }}>
            <TradePanel
              side={side}
              snapshot={snapshot}
              loading={snapshotLoading}
              onDragStart={startDrag}
              setWidth={setPanelWidth}
            />
          </div>
        )}

        {panelOpen && !panelDocked && (
          <div
            className="terminalPanel floating"
            style={{
              width: panelWidth,
              left: floatPos.x,
              top: floatPos.y,
            }}
          >
            <TradePanel
              side={side}
              snapshot={snapshot}
              loading={snapshotLoading}
              onDragStart={startDrag}
              setWidth={setPanelWidth}
            />
          </div>
        )}

      </div>

      <div className="terminalSignalFeed">
        {signals.map((s, i) => (
          <div
            key={i}
            className={`terminalSignal ${
              s.action === "BUY" ? "buy" : "sell"
            }`}
          >
            {s.action} • {(s.confidence * 100).toFixed(1)}%
          </div>
        ))}
      </div>

    </div>
  );
}

function TradePanel({ side, snapshot, loading, onDragStart }) {

  return (
    <>
      <div className="terminalPanelHeader" onMouseDown={onDragStart}>
        {side} ORDER
      </div>

      <div className="terminalPanelBody">

        <div>
          <label>Quantity</label>
          <input type="number" placeholder="0.01" />
        </div>

        <div>
          <label>Order Type</label>
          <select>
            <option>Market</option>
            <option>Limit</option>
          </select>
        </div>

        <div className="terminalAIMetrics">
          <div>
            AI Win Rate:{" "}
            {loading
              ? "—"
              : snapshot?.ai?.stats?.winRate
              ? (snapshot.ai.stats.winRate * 100).toFixed(1) + "%"
              : "—"}
          </div>

          <div>
            Risk Multiplier:{" "}
            {loading
              ? "—"
              : snapshot?.risk?.riskMultiplier?.toFixed?.(2) || "—"}
          </div>
        </div>

        <button className={`terminalConfirm ${side === "BUY" ? "buy" : "sell"}`}>
          Confirm {side}
        </button>

      </div>
    </>
  );
}
