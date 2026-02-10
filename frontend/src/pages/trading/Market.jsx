import React, { useMemo, useRef, useState, useEffect } from "react";
import "../../styles/terminal.css";

/**
 * Market.jsx — HARDENED + BRANDED
 * SOC-aligned Market Observation & Trade Intent Panel
 *
 * RESPONSIBILITY:
 * - Market visibility
 * - Operator trade intent preparation
 * - ZERO execution authority
 *
 * EXECUTION:
 * - Happens ONLY in TradingRoom.jsx
 */

const SYMBOLS = [
  "OANDA:EURUSD",
  "OANDA:GBPUSD",
  "BINANCE:BTCUSDT",
  "BINANCE:ETHUSDT",
];

const SNAP_POS = { x: 16, y: 110 };
const SNAP_DELAY = 2200;

export default function Market({
  mode = "paper",        // paper | live
  dailyLimit = 5,
  tradesUsed = 0,
}) {
  /* ================= STATE ================= */
  const [symbol, setSymbol] = useState(SYMBOLS[0]);
  const [tf, setTf] = useState("D");
  const [side, setSide] = useState("BUY");

  const [panelOpen, setPanelOpen] = useState(false);
  const [docked, setDocked] = useState(true);
  const [pos, setPos] = useState(SNAP_POS);

  const dragData = useRef({ x: 0, y: 0, dragging: false });
  const snapTimer = useRef(null);

  /* ================= TRADINGVIEW ================= */
  const tvSrc = useMemo(() => {
    const params = new URLSearchParams({
      symbol,
      interval: tf,
      theme: "light",
      style: "1",
      locale: "en",
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [symbol, tf]);

  /* ================= DRAG LOGIC ================= */
  function startDrag(e) {
    const t = e.touches ? e.touches[0] : e;
    dragData.current = {
      dragging: true,
      x: t.clientX - pos.x,
      y: t.clientY - pos.y,
    };
    setDocked(false);
    clearTimeout(snapTimer.current);
  }

  function onMove(e) {
    if (!dragData.current.dragging) return;
    const t = e.touches ? e.touches[0] : e;
    setPos({
      x: t.clientX - dragData.current.x,
      y: t.clientY - dragData.current.y,
    });
  }

  function endDrag() {
    if (!dragData.current.dragging) return;
    dragData.current.dragging = false;

    snapTimer.current = setTimeout(() => {
      setDocked(true);
      setPos(SNAP_POS);
    }, SNAP_DELAY);
  }

  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", endDrag);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", endDrag);
    };
  }, []);

  function togglePanel() {
    clearTimeout(snapTimer.current);
    setPanelOpen((v) => !v);
    setDocked(true);
    setPos(SNAP_POS);
  }

  const limitReached = tradesUsed >= dailyLimit;

  /* ================= UI ================= */
  return (
    <div
      className={`terminalRoot ${mode === "live" ? "liveMode" : ""}`}
    >
      {/* ===== BRAND WATERMARK (TERMINAL ONLY) ===== */}
      <div className="terminalBrandMark" aria-hidden="true">
        AUTOSHIELD
      </div>

      {/* ===== GOVERNANCE BANNER ===== */}
      <div className={`marketBanner ${mode === "live" ? "warn" : ""}`}>
        <b>Mode:</b> {mode.toUpperCase()} &nbsp;•&nbsp;
        <b>Trades Used:</b> {tradesUsed}/{dailyLimit}
        {limitReached && (
          <span className="warnText">
            &nbsp;— Daily trade limit reached
          </span>
        )}
      </div>

      {/* ===== TOP BAR ===== */}
      <header className="tvTopBar">
        <div className="tvTopLeft">
          <select
            className="tvSelect"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
          >
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <div className="tvTfRow">
            {["1", "5", "15", "60", "D"].map((x) => (
              <button
                key={x}
                className={tf === x ? "tvPill active" : "tvPill"}
                onClick={() => setTf(x)}
              >
                {x}
              </button>
            ))}
          </div>
        </div>

        <div className="tvTopRight">
          <button
            className="tvPrimary"
            onClick={togglePanel}
            disabled={limitReached}
          >
            Prepare Trade
          </button>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <div className={`tvBody ${panelOpen && docked ? "withPanel" : ""}`}>
        <main className="tvChartArea">
          <iframe
            className="tvIframe"
            title="market-chart"
            src={tvSrc}
            frameBorder="0"
          />
        </main>

        {panelOpen && docked && (
          <aside className="dockPanel">
            <TradePanel
              symbol={symbol}
              side={side}
              setSide={setSide}
              onClose={togglePanel}
              mode={mode}
            />
          </aside>
        )}
      </div>

      {/* ===== FLOATING PANEL ===== */}
      {panelOpen && !docked && (
        <div
          className="floatingPanel"
          style={{ left: pos.x, top: pos.y }}
        >
          <TradePanel
            symbol={symbol}
            side={side}
            setSide={setSide}
            onClose={togglePanel}
            mode={mode}
            draggable
            onDragStart={startDrag}
          />
        </div>
      )}
    </div>
  );
}

/* ================= TRADE PANEL ================= */

function TradePanel({
  symbol,
  side,
  setSide,
  onClose,
  mode,
  draggable,
  onDragStart,
}) {
  return (
    <div className="tradePanel">
      <header
        className="tpHeader"
        onMouseDown={draggable ? onDragStart : undefined}
        onTouchStart={draggable ? onDragStart : undefined}
      >
        <span>{symbol}</span>
        <button className="tpClose" onClick={onClose}>
          ✕
        </button>
      </header>

      <div className="orderSide">
        <button
          className={`orderBtn sell ${side === "SELL" ? "active" : ""}`}
          onClick={() => setSide("SELL")}
        >
          SELL
        </button>
        <button
          className={`orderBtn buy ${side === "BUY" ? "active" : ""}`}
          onClick={() => setSide("BUY")}
        >
          BUY
        </button>
      </div>

      <input className="tradeInput" placeholder="Reference Price" />
      <input className="tradeInput" placeholder="Position Size" />

      <button className={`tvPrimary full ${mode === "live" ? "warn" : ""}`}>
        Queue {side} Intent
      </button>

      <small className="muted" style={{ marginTop: 8 }}>
        Trade intent only. Execution occurs in Trading Control Room.
      </small>
    </div>
  );
}
