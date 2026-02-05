// frontend/src/pages/trading/Market.jsx
import React, { useMemo, useState, useRef, useEffect } from "react";
import "../../styles/terminal.css";

const DEFAULT_SYMBOL = "OANDA:EURUSD";
const SYMBOLS = [
  "OANDA:EURUSD",
  "OANDA:GBPUSD",
  "BITSTAMP:BTCUSD",
  "BINANCE:BTCUSDT",
  "BINANCE:ETHUSDT",
];

export default function Market() {
  /* ---------------- CORE STATE ---------------- */
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [tf, setTf] = useState("D");

  const [bid, setBid] = useState("1.11077");
  const [ask, setAsk] = useState("1.11088");

  /* ---------------- ORDER PANEL STATE ---------------- */
  // closed | docked | floating
  const [panelMode, setPanelMode] = useState("docked");
  const [side, setSide] = useState("BUY");
  const [orderType, setOrderType] = useState("LIMIT");

  const [orderPrice, setOrderPrice] = useState(ask);
  const [qty, setQty] = useState("1000");

  const [takeProfit, setTakeProfit] = useState(false);
  const [stopLoss, setStopLoss] = useState(false);
  const [tp, setTp] = useState("1.11837");
  const [sl, setSl] = useState("1.10837");

  /* ---------------- FLOATING POSITION ---------------- */
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ x: 200, y: 200 });
  const drag = useRef({ active: false, x: 0, y: 0 });

  /* ---------------- BOTTOM PANEL ---------------- */
  const [bottomTab, setBottomTab] = useState("Positions");

  /* ---------------- TRADINGVIEW ---------------- */
  const tvSrc = useMemo(() => {
    const interval = tf === "D" ? "D" : tf === "W" ? "W" : tf === "M" ? "M" : tf;
    const params = new URLSearchParams({
      symbol,
      interval,
      theme: "light",
      timezone: "Etc/UTC",
      withdateranges: "1",
      hide_side_toolbar: "0",
      allow_symbol_change: "0",
      saveimage: "1",
      details: "1",
      studies: "1",
      locale: "en",
      toolbarbg: "#f3f4f6",
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [symbol, tf]);

  /* ---------------- PRICE MOCK ---------------- */
  function tick() {
    const a = (parseFloat(ask) + (Math.random() - 0.5) * 0.0002).toFixed(5);
    const b = (parseFloat(bid) + (Math.random() - 0.5) * 0.0002).toFixed(5);
    setAsk(a);
    setBid(b);
    setOrderPrice(side === "BUY" ? a : b);
  }

  /* ---------------- BUY / SELL ---------------- */
  function clickSide(s) {
    setSide(s);
    setOrderPrice(s === "BUY" ? ask : bid);
    if (panelMode === "closed") setPanelMode("docked");
  }

  function placeOrder() {
    alert(
      `${side} ${qty} ${symbol} @ ${orderPrice}\nTP: ${
        takeProfit ? tp : "OFF"
      }\nSL: ${stopLoss ? sl : "OFF"}`
    );
  }

  /* ---------------- DRAGGING ---------------- */
  function onMouseDown(e) {
    drag.current = {
      active: true,
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
  }

  function onMouseMove(e) {
    if (!drag.current.active) return;
    setPos({
      x: e.clientX - drag.current.x,
      y: e.clientY - drag.current.y,
    });
  }

  function onMouseUp() {
    drag.current.active = false;
  }

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  /* ---------------- AUTO CENTER WHEN FLOATING ---------------- */
  useEffect(() => {
    if (panelMode === "floating") {
      setPos({
        x: window.innerWidth / 2 - 160,
        y: window.innerHeight / 2 - 220,
      });
    }
  }, [panelMode, bottomTab]);

  return (
    <div className={`tvShell ${panelMode === "docked" ? "withRight" : ""}`}>
      {/* LEFT TOOLBAR */}
      <aside className="tvLeftBar">
        {["☰", "↖", "／", "⟂", "⌁", "T", "⟐", "＋"].map((t, i) => (
          <button key={i} className="tvToolBtn">{t}</button>
        ))}
      </aside>

      {/* TOP BAR */}
      <header className="tvTopBar">
        <div className="tvTopLeft">
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            {SYMBOLS.map((s) => <option key={s}>{s}</option>)}
          </select>

          {["1","5","15","60","D","W","M"].map((x) => (
            <button
              key={x}
              className={tf === x ? "tvPill active" : "tvPill"}
              onClick={() => setTf(x)}
            >
              {x}
            </button>
          ))}
        </div>

        <div className="tvTopRight">
          <button onClick={tick}>▶</button>
        </div>
      </header>

      {/* CHART */}
      <main className="tvChartArea">
        <iframe
          title="TradingView"
          src={tvSrc}
          className="tvIframe"
          frameBorder="0"
          allow="fullscreen"
        />

        {/* BOTTOM PANEL */}
        <section className="tvBottom">
          <div className="tvBottomTabs">
            {["Positions","Orders","History","Account Summary","Trading Journal"].map((t) => (
              <button
                key={t}
                className={bottomTab === t ? "tvTab active" : "tvTab"}
                onClick={() => setBottomTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="tvBottomBody">
            {bottomTab} panel ready for backend.
          </div>
        </section>
      </main>

      {/* DOCKED PANEL */}
      {panelMode === "docked" && (
        <aside className="tvRight">
          {OrderPanel()}
        </aside>
      )}

      {/* FLOATING PANEL */}
      {panelMode === "floating" && (
        <div
          ref={panelRef}
          className="tvFloating"
          style={{ left: pos.x, top: pos.y }}
        >
          <div className="tvFloatHeader" onMouseDown={onMouseDown}>
            <span>Order</span>
            <div>
              <button onClick={() => setPanelMode("docked")}>⇨</button>
              <button onClick={() => setPanelMode("closed")}>✕</button>
            </div>
          </div>
          {OrderPanel()}
        </div>
      )}
    </div>
  );

  /* ---------------- ORDER PANEL RENDER ---------------- */
  function OrderPanel() {
    return (
      <div className="tvOrderPanel">
        <div className="tvRow">
          <button className={side==="SELL"?"active":""} onClick={()=>clickSide("SELL")}>
            SELL {bid}
          </button>
          <button className={side==="BUY"?"active":""} onClick={()=>clickSide("BUY")}>
            BUY {ask}
          </button>
        </div>

        <div className="tvRow">
          {["MARKET","LIMIT","STOP"].map((t)=>(
            <button
              key={t}
              className={orderType===t?"active":""}
              onClick={()=>setOrderType(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <input value={orderPrice} onChange={(e)=>setOrderPrice(e.target.value)} />
        <input value={qty} onChange={(e)=>setQty(e.target.value)} />

        <label>
          <input type="checkbox" checked={takeProfit} onChange={()=>setTakeProfit(!takeProfit)} />
          Take Profit
        </label>
        {takeProfit && <input value={tp} onChange={(e)=>setTp(e.target.value)} />}

        <label>
          <input type="checkbox" checked={stopLoss} onChange={()=>setStopLoss(!stopLoss)} />
          Stop Loss
        </label>
        {stopLoss && <input value={sl} onChange={(e)=>setSl(e.target.value)} />}

        <button className="tvPrimary" onClick={placeOrder}>
          {side} {qty} @ {orderPrice}
        </button>

        <button onClick={()=>setPanelMode(panelMode==="floating"?"docked":"floating")}>
          {panelMode==="floating"?"Dock":"Float"}
        </button>
      </div>
    );
  }
}
