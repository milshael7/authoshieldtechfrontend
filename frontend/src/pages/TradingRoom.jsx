// frontend/src/pages/TradingRoom.jsx

import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import "../../styles/terminal.css";

const API_BASE = "/api/trading";

export default function TradingRoom() {

  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const [snapshot, setSnapshot] = useState(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelDocked, setPanelDocked] = useState(true);
  const [panelWidth, setPanelWidth] = useState(420);
  const [side, setSide] = useState("BUY");

  const [dragging, setDragging] = useState(false);
  const [floatPos, setFloatPos] = useState({ x: 300, y: 120 });

  /* ================= LOAD SNAPSHOT ================= */

  async function loadSnapshot() {
    try {
      const res = await fetch(`${API_BASE}/dashboard/snapshot`);
      const data = await res.json();
      if (data.ok) setSnapshot(data);
    } catch (e) {
      console.error("Snapshot error:", e);
    }
  }

  useEffect(() => {
    loadSnapshot();
    const i = setInterval(loadSnapshot, 4000);
    return () => clearInterval(i);
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

    window.addEventListener("resize", () => {
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
      });
    });

  }, []);

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

  /* ================= DRAG LOGIC ================= */

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

      {/* ================= TOP BAR ================= */}

      <div className="terminalTopbar">
        <div className="terminalSymbol">BTCUSDT</div>

        <div className="terminalActions">
          <button
            className="terminalBuy"
            onClick={() => togglePanel("BUY")}
          >
            BUY
          </button>

          <button
            className="terminalSell"
            onClick={() => togglePanel("SELL")}
          >
            SELL
          </button>
        </div>
      </div>

      {/* ================= BODY ================= */}

      <div className="terminalBody">

        {/* LEFT TOOL RAIL */}
        <div className="terminalRail">
          <div className="terminalRailItem">✏</div>
          <div className="terminalRailItem">📐</div>
          <div className="terminalRailItem">📊</div>
        </div>

        {/* CHART AREA */}
        <div
          className="terminalChartArea"
          style={{
            marginRight:
              panelOpen && panelDocked ? panelWidth : 0,
          }}
        >
          <div
            ref={chartContainerRef}
            className="terminalChartSurface"
          />
        </div>

        {/* DOCKED PANEL */}
        {panelOpen && panelDocked && (
          <div
            className="terminalPanel"
            style={{ width: panelWidth }}
          >
            <TradePanel
              side={side}
              snapshot={snapshot}
              onDragStart={startDrag}
              setWidth={setPanelWidth}
            />
          </div>
        )}

        {/* FLOATING PANEL */}
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
              onDragStart={startDrag}
              setWidth={setPanelWidth}
            />
          </div>
        )}

      </div>
    </div>
  );
}

/* =========================================================
   PANEL COMPONENT
========================================================= */

function TradePanel({ side, snapshot, onDragStart, setWidth }) {

  return (
    <>
      <div
        className="terminalPanelHeader"
        onMouseDown={onDragStart}
      >
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
            AI Win Rate:
            {" "}
            {snapshot?.ai?.stats?.winRate
              ? (snapshot.ai.stats.winRate * 100).toFixed(1) + "%"
              : "—"}
          </div>

          <div>
            Risk Multiplier:
            {" "}
            {snapshot?.risk?.riskMultiplier?.toFixed?.(2) || "—"}
          </div>
        </div>

        <button
          className={`terminalConfirm ${
            side === "BUY" ? "buy" : "sell"
          }`}
        >
          Confirm {side}
        </button>

      </div>

      {/* RESIZE HANDLE */}
      <div
        className="terminalResize"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startWidth =
            document.querySelector(".terminalPanel")
              .offsetWidth;

          function onMove(ev) {
            const newWidth =
              startWidth - (ev.clientX - startX);

            setWidth(
              Math.max(320, Math.min(newWidth, 640))
            );
          }

          function onUp() {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
          }

          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
      />
    </>
  );
}
