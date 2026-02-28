// frontend/src/pages/TradingRoom.jsx
import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { api, getToken, getSavedUser } from "../lib/api.js";
import { Navigate } from "react-router-dom";
import "../styles/terminal.css";

/* ================= WS URL WITH TOKEN ================= */

function buildWsUrl() {
  const token = getToken();
  if (!token) return null;

  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";

  return (
    protocol +
    window.location.host +
    "/ws/market?token=" +
    encodeURIComponent(token)
  );
}

export default function TradingRoom() {
  /* ================= ROLE SAFETY ================= */

  const user = getSavedUser();
  const role = String(user?.role || "").toLowerCase();

  // Admin routes already protect this, but keep this guard safe + non-breaking.
  if (!user || (role !== "admin" && role !== "manager")) {
    return <Navigate to="/admin" replace />;
  }

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

  /* ================= SNAPSHOT ================= */

  async function loadSnapshot() {
    try {
      setSnapshotError("");
      setSnapshotLoading(true);

      // using tradingLiveSnapshot (adjust if needed)
      const data = await api.tradingLiveSnapshot();
      setSnapshot(data);
    } catch (e) {
      console.error("Snapshot error:", e);
      setSnapshotError(e?.message || "Failed to load snapshot");
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
      if (pollingRef.current) clearInterval(pollingRef.current);
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
    });

    seriesRef.current = chartRef.current.addCandlestickSeries();

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
      seriesRef.current = null;
    };
  }, []);

  /* ================= WEBSOCKET ================= */

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

  /* ================= CANDLE LOGIC ================= */

  function updateCandle(price, ts) {
    if (!seriesRef.current) return;

    const time = Math.floor(Number(ts || 0) / 1000);
    const p = Number(price || 0);
    if (!Number.isFinite(time) || !Number.isFinite(p)) return;

    const lastCandle = candleDataRef.current[candleDataRef.current.length - 1];

    if (!lastCandle || time > lastCandle.time) {
      const newCandle = {
        time,
        open: p,
        high: p,
        low: p,
        close: p,
      };
      candleDataRef.current.push(newCandle);
      seriesRef.current.update(newCandle);
    } else {
      lastCandle.high = Math.max(lastCandle.high, p);
      lastCandle.low = Math.min(lastCandle.low, p);
      lastCandle.close = p;
      seriesRef.current.update(lastCandle);
    }
  }

  /* ================= PANEL ================= */

  function togglePanel(type) {
    setSide(type);
    if (!panelOpen) {
      setPanelOpen(true);
      setPanelDocked(true);
    } else {
      if (panelDocked) setPanelOpen(false);
      else setPanelDocked(true);
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

      {snapshotLoading && (
        <div style={{ padding: 10, opacity: 0.7 }}>Loading snapshot…</div>
      )}

      {snapshotError && (
        <div style={{ padding: 10, color: "#ff5a5f" }}>{snapshotError}</div>
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
          <div ref={chartContainerRef} className="terminalChartSurface" />
        </div>
      </div>

      <div className="terminalSignalFeed">
        {signals.map((s, i) => (
          <div
            key={i}
            className={`terminalSignal ${s.action === "BUY" ? "buy" : "sell"}`}
          >
            {s.action} • {(Number(s.confidence || 0) * 100).toFixed(1)}%
          </div>
        ))}
      </div>
    </div>
  );
}
