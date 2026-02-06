import React, { useMemo, useRef, useState, useEffect } from "react";
import "../../styles/terminal.css";

const SYMBOLS = [
  "OANDA:EURUSD",
  "OANDA:GBPUSD",
  "BINANCE:BTCUSDT",
  "BINANCE:ETHUSDT",
];

export default function Market() {
  const [symbol, setSymbol] = useState(SYMBOLS[0]);
  const [tf, setTf] = useState("D");
  const [side, setSide] = useState("BUY");

  const [panelOpen, setPanelOpen] = useState(false);
  const [docked, setDocked] = useState(true);
  const [pos, setPos] = useState({ x: 16, y: 100 });

  const dragRef = useRef(null);
  const dragData = useRef({ x: 0, y: 0, dragging: false });
  const snapTimer = useRef(null);

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

  /* ---------------- DRAG LOGIC ---------------- */
  function onDragStart(e) {
    dragData.current.dragging = true;
    const t = e.touches ? e.touches[0] : e;
    dragData.current.x = t.clientX - pos.x;
    dragData.current.y = t.clientY - pos.y;
    setDocked(false);
    clearTimeout(snapTimer.current);
  }

  function onDragMove(e) {
    if (!dragData.current.dragging) return;
    const t = e.touches ? e.touches[0] : e;
    setPos({
      x: t.clientX - dragData.current.x,
      y: t.clientY - dragData.current.y,
    });
  }

  function onDragEnd() {
    dragData.current.dragging = false;
    snapTimer.current = setTimeout(() => {
      setDocked(true);
      setPos({ x: 16, y: 100 });
    }, 2500);
  }

  useEffect(() => {
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
    window.addEventListener("touchmove", onDragMove);
    window.addEventListener("touchend", onDragEnd);
    return () => {
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", onDragEnd);
      window.removeEventListener("touchmove", onDragMove);
      window.removeEventListener("touchend", onDragEnd);
    };
  }, [pos]);

  function togglePanel() {
    if (panelOpen) {
      setPanelOpen(false);
      setDocked(true);
      clearTimeout(snapTimer.current);
    } else {
      setPanelOpen(true);
      setDocked(true);
      setPos({ x: 16, y: 100 });
    }
  }

  return (
    <div className="terminalRoot">
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
          <button className="tvPrimary" onClick={togglePanel}>
            Trade
          </button>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <div className={`tvBody ${panelOpen && docked ? "withPanel" : ""}`}>
        <main className="tvChartArea">
          <iframe
            className="tvIframe"
            title="chart"
            src={tvSrc}
            frameBorder="0"
          />
        </main>

        {/* ===== DOCKED PANEL ===== */}
        {panelOpen && docked && (
          <aside className="dockPanel">
            <TradePanel
              symbol={symbol}
              side={side}
              setSide={setSide}
            />
          </aside>
        )}
      </div>

      {/* ===== FLOATING PANEL ===== */}
      {panelOpen && !docked && (
        <div
          ref={dragRef}
          className="floatingPanel"
          style={{ left: pos.x, top: pos.y }}
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
        >
          <TradePanel
            symbol={symbol}
            side={side}
            setSide={setSide}
          />
        </div>
      )}

      {/* ===== LOCAL STYLES ===== */}
      <style>{`
        .tvBody{
          display:flex;
          height:calc(100svh - 110px);
          position:relative;
        }

        .tvBody.withPanel .tvChartArea{
          flex:1;
        }

        .dockPanel{
          width:280px;
          border-left:1px solid rgba(0,0,0,.1);
          background:#fff;
        }

        .floatingPanel{
          position:fixed;
          width:260px;
          background:#fff;
          border-radius:14px;
          box-shadow:0 10px 30px rgba(0,0,0,.25);
          z-index:50;
          cursor:grab;
        }

        @media(max-width:900px){
          .dockPanel{
            display:none;
          }
        }
      `}</style>
    </div>
  );
}

/* ================= TRADE PANEL ================= */

function TradePanel({ symbol, side, setSide }) {
  return (
    <div className="tradePanel">
      <header className="tpHeader">{symbol}</header>

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

      <input className="tradeInput" placeholder="Price" />
      <input className="tradeInput" placeholder="Quantity" />

      <button className="tvPrimary full">
        Place {side}
      </button>
    </div>
  );
}
