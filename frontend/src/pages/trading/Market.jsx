import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/trading.css";

const DEFAULT_SYMBOL = "OANDA:EURUSD";
const SYMBOLS = ["OANDA:EURUSD", "OANDA:GBPUSD", "BITSTAMP:BTCUSD", "BINANCE:BTCUSDT", "BINANCE:ETHUSDT"];

export default function Market() {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [tf, setTf] = useState("D");

  // MOCK prices (later = live)
  const [bid, setBid] = useState("1.11077");
  const [ask, setAsk] = useState("1.11088");

  // Panels
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [showOrderPanel, setShowOrderPanel] = useState(true);

  // Dock behavior (matches screenshots)
  const [dockRight, setDockRight] = useState(true); // true=docked right, false=floating

  // Order panel menu options (matches screenshots)
  const [opMenuOpen, setOpMenuOpen] = useState(false);
  const [showOrderPriceTicks, setShowOrderPriceTicks] = useState(false);
  const [qtyMode, setQtyMode] = useState("units"); // units | usdRisk | pctRisk
  const [tpSlMode, setTpSlMode] = useState("pips"); // pips | usd | pct

  // Order state
  const [rightTab, setRightTab] = useState("LIMIT"); // MARKET | LIMIT | STOP
  const [side, setSide] = useState("BUY"); // BUY | SELL
  const [orderPrice, setOrderPrice] = useState("1.11088");
  const [qty, setQty] = useState("1000");

  const [takeProfit, setTakeProfit] = useState(false);
  const [stopLoss, setStopLoss] = useState(false);
  const [tp, setTp] = useState({ pips: "75", price: "1.11837", usd: "7.50", pct: "0.01" });
  const [sl, setSl] = useState({ pips: "25", price: "1.10837", usd: "2.50", pct: "0.00" });

  const [bottomTab, setBottomTab] = useState("Positions");
  const [full, setFull] = useState(false);

  // Close menus on outside click
  const opMenuRef = useRef(null);
  useEffect(() => {
    const onDown = (e) => {
      if (opMenuOpen && opMenuRef.current && !opMenuRef.current.contains(e.target)) setOpMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("touchstart", onDown);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("touchstart", onDown);
    };
  }, [opMenuOpen]);

  // TradingView embed (chart + real drawing tools)
  const tvSrc = useMemo(() => {
    const interval = tf === "D" ? "D" : tf === "W" ? "W" : tf === "M" ? "M" : tf;
    const params = new URLSearchParams({
      symbol,
      interval,
      theme: "light",          // screenshot style
      style: "1",
      timezone: "Etc/UTC",
      withdateranges: "1",
      hide_side_toolbar: "0",
      allow_symbol_change: "0",
      saveimage: "1",
      details: "1",
      studies: "1",
      calendar: "0",
      hotlist: "0",
      locale: "en",
      toolbarbg: "#ffffff",
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [symbol, tf]);

  const tick = () => {
    const a = (parseFloat(ask) + (Math.random() - 0.5) * 0.0002).toFixed(5);
    const b = (parseFloat(bid) + (Math.random() - 0.5) * 0.0002).toFixed(5);
    setAsk(a);
    setBid(b);
    setOrderPrice(side === "BUY" ? a : b);
  };

  const syncOrderPrice = (s) => setOrderPrice(s === "BUY" ? ask : bid);

  const placeOrder = () => {
    alert(
      `${side} ${qty} ${symbol} @ ${orderPrice} (${rightTab})\nBid: ${bid}  Ask: ${ask}\nTP: ${
        takeProfit ? tp.price : "OFF"
      }\nSL: ${stopLoss ? sl.price : "OFF"}`
    );
  };

  // Shell class
  const shellCls =
    "tvShell" +
    (full ? " isFull" : "") +
    (!showBottomPanel ? " noBottom" : "") +
    (!showOrderPanel ? " noOrder" : "") +
    (!dockRight ? " floatMode" : "");

  return (
    <div className={shellCls}>
      {/* LEFT TOOLBAR (your icons) */}
      <aside className="tvLeftBar" aria-label="tools">
        {["☰", "↖", "／", "⟂", "⌁", "T", "⟐", "＋", "⌖", "⤢", "⌫", "👁"].map((t, i) => (
          <button key={i} className="tvToolBtn" type="button" title="Tool">
            {t}
          </button>
        ))}
      </aside>

      {/* TOP TOOLBAR (Publish + Play + Cloud + Camera + Settings) */}
      <header className="tvTopBar">
        <div className="tvTopLeft">
          <div className="tvBrand" title="AutoShield">
            <div className="tvBrandLogo" />
          </div>

          <select className="tvSelect" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            {SYMBOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <div className="tvTfRow">
            {["1", "5", "15", "60", "D", "W", "M"].map((x) => (
              <button key={x} type="button" className={tf === x ? "tvPill active" : "tvPill"} onClick={() => setTf(x)}>
                {x}
              </button>
            ))}
          </div>
        </div>

        <div className="tvTopRight">
          <button className="tvPrimary" type="button">Publish</button>
          <button className="tvIconBtn" type="button" title="Play / Tick" onClick={tick}>▶</button>
          <button className="tvIconBtn" type="button" title="Cloud">☁</button>
          <button className="tvIconBtn" type="button" title="Snapshot / Camera">📷</button>
          <button className="tvIconBtn" type="button" title="Toggle Bottom Panel" onClick={() => setShowBottomPanel(v => !v)}>
            ▤
          </button>
          <button className="tvIconBtn" type="button" title="Fullscreen" onClick={() => setFull((v) => !v)}>
            {full ? "🗗" : "🗖"}
          </button>
        </div>
      </header>

      {/* CHART */}
      <main className="tvChartArea">
        <div className="tvChartFrame">
          <iframe title="TradingView Chart" className="tvIframe" src={tvSrc} frameBorder="0" allow="clipboard-write; fullscreen" />
        </div>

        {/* BOTTOM PANEL */}
        {showBottomPanel && (
          <section className="tvBottom">
            <div className="tvBottomTabs">
              {["Positions", "Orders", "History", "Account Summary", "Trading Journal"].map((t) => (
                <button key={t} type="button" className={bottomTab === t ? "tvTab active" : "tvTab"} onClick={() => setBottomTab(t)}>
                  {t}
                </button>
              ))}
            </div>

            <div className="tvBottomBody">
              {bottomTab === "Positions" ? (
                <table className="tvTable">
                  <thead>
                    <tr>
                      <th>Symbol</th><th>Side</th><th>Qty</th><th>Avg Fill</th><th>Take Profit</th><th>Stop Loss</th><th>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>BITSTAMP:BTCUSD</td>
                      <td className="buy">Buy</td>
                      <td>1</td>
                      <td>8,174.85</td>
                      <td>—</td>
                      <td>—</td>
                      <td className="neg">-283.57</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div className="tvEmpty">{bottomTab} will be wired to backend later.</div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ORDER PANEL (DOCKED RIGHT by default) */}
      {showOrderPanel && dockRight && (
        <aside className="tvRight">
          <OrderPanel
            symbol={symbol}
            bid={bid}
            ask={ask}
            side={side}
            setSide={setSide}
            rightTab={rightTab}
            setRightTab={setRightTab}
            orderPrice={orderPrice}
            setOrderPrice={setOrderPrice}
            qty={qty}
            setQty={setQty}
            takeProfit={takeProfit}
            setTakeProfit={setTakeProfit}
            stopLoss={stopLoss}
            setStopLoss={setStopLoss}
            tp={tp}
            setTp={setTp}
            sl={sl}
            setSl={setSl}
            placeOrder={placeOrder}
            syncOrderPrice={syncOrderPrice}
            // menu options:
            opMenuOpen={opMenuOpen}
            setOpMenuOpen={setOpMenuOpen}
            opMenuRef={opMenuRef}
            dockRight={dockRight}
            setDockRight={setDockRight}
            showOrderPriceTicks={showOrderPriceTicks}
            setShowOrderPriceTicks={setShowOrderPriceTicks}
            qtyMode={qtyMode}
            setQtyMode={setQtyMode}
            tpSlMode={tpSlMode}
            setTpSlMode={setTpSlMode}
            onClose={() => setShowOrderPanel(false)} // X
          />
        </aside>
      )}

      {/* ORDER PANEL (FLOATING when Undocked) */}
      {showOrderPanel && !dockRight && (
        <div className="tvFloatWrap">
          <OrderPanel
            symbol={symbol}
            bid={bid}
            ask={ask}
            side={side}
            setSide={setSide}
            rightTab={rightTab}
            setRightTab={setRightTab}
            orderPrice={orderPrice}
            setOrderPrice={setOrderPrice}
            qty={qty}
            setQty={setQty}
            takeProfit={takeProfit}
            setTakeProfit={setTakeProfit}
            stopLoss={stopLoss}
            setStopLoss={setStopLoss}
            tp={tp}
            setTp={setTp}
            sl={sl}
            setSl={setSl}
            placeOrder={placeOrder}
            syncOrderPrice={syncOrderPrice}
            opMenuOpen={opMenuOpen}
            setOpMenuOpen={setOpMenuOpen}
            opMenuRef={opMenuRef}
            dockRight={dockRight}
            setDockRight={setDockRight}
            showOrderPriceTicks={showOrderPriceTicks}
            setShowOrderPriceTicks={setShowOrderPriceTicks}
            qtyMode={qtyMode}
            setQtyMode={setQtyMode}
            tpSlMode={tpSlMode}
            setTpSlMode={setTpSlMode}
            onClose={() => setShowOrderPanel(false)}
          />
        </div>
      )}
    </div>
  );
}

function OrderPanel(props) {
  const {
    symbol, bid, ask,
    side, setSide,
    rightTab, setRightTab,
    orderPrice, setOrderPrice,
    qty, setQty,
    takeProfit, setTakeProfit,
    stopLoss, setStopLoss,
    tp, setTp, sl, setSl,
    placeOrder, syncOrderPrice,

    opMenuOpen, setOpMenuOpen, opMenuRef,
    dockRight, setDockRight,
    showOrderPriceTicks, setShowOrderPriceTicks,
    qtyMode, setQtyMode,
    tpSlMode, setTpSlMode,
    onClose,
  } = props;

  return (
    <div className="opCard">
      <div className="opHeader">
        <div className="opTitle">
          <b>{symbol}</b> <span>PAPER TRADING</span>
        </div>

        <div className="opHeaderBtns" ref={opMenuRef}>
          <button className="opIcon" type="button" title="Options" onClick={() => setOpMenuOpen(v => !v)}>
            ⚙
          </button>
          <button className="opIcon" type="button" title="Close" onClick={onClose}>✕</button>

          {opMenuOpen && (
            <div className="opMenu">
              <button className="opMenuBtn" type="button" onClick={() => { setDockRight(true); setOpMenuOpen(false); }}>
                ✅ Dock to right
              </button>
              <button className="opMenuBtn" type="button" onClick={() => { setDockRight(false); setOpMenuOpen(false); }}>
                📌 Undock (float)
              </button>

              <div className="opMenuSep" />

              <label className="opMenuCheck">
                <input type="checkbox" checked={showOrderPriceTicks} onChange={(e) => setShowOrderPriceTicks(e.target.checked)} />
                Show Order Price in Ticks
              </label>

              <label className="opMenuCheck">
                <input type="checkbox" checked={qtyMode === "usdRisk"} onChange={() => setQtyMode(qtyMode === "usdRisk" ? "units" : "usdRisk")} />
                Show Quantity in $ Risk
              </label>

              <label className="opMenuCheck">
                <input type="checkbox" checked={qtyMode === "pctRisk"} onChange={() => setQtyMode(qtyMode === "pctRisk" ? "units" : "pctRisk")} />
                Show Quantity in % Risk
              </label>

              <label className="opMenuCheck">
                <input type="checkbox" checked={tpSlMode === "usd"} onChange={() => setTpSlMode(tpSlMode === "usd" ? "pips" : "usd")} />
                Show TP/SL inputs in $
              </label>

              <label className="opMenuCheck">
                <input type="checkbox" checked={tpSlMode === "pct"} onChange={() => setTpSlMode(tpSlMode === "pct" ? "pips" : "pct")} />
                Show TP/SL inputs in %
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="opSides">
        <button
          type="button"
          className={side === "SELL" ? "opSide sell active" : "opSide sell"}
          onClick={() => { setSide("SELL"); syncOrderPrice("SELL"); }}
        >
          <span>SELL</span><b>{bid}</b>
        </button>
        <button
          type="button"
          className={side === "BUY" ? "opSide buy active" : "opSide buy"}
          onClick={() => { setSide("BUY"); syncOrderPrice("BUY"); }}
        >
          <span>BUY</span><b>{ask}</b>
        </button>
      </div>

      <div className="opTabs">
        {["MARKET", "LIMIT", "STOP"].map((t) => (
          <button key={t} type="button" className={rightTab === t ? "opTab active" : "opTab"} onClick={() => setRightTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="opBody">
        <div className="opField">
          <label>Order Price</label>
          <div className="opRow2">
            <input value={orderPrice} onChange={(e) => setOrderPrice(e.target.value)} inputMode="decimal" />
            <select>
              <option>Ask</option>
              <option>Bid</option>
            </select>
          </div>
          <div className="opHint">{showOrderPriceTicks ? "Ticks" : "Absolute"} / {showOrderPriceTicks ? "Ticks" : "Ticks"}</div>
        </div>

        <div className="opField">
          <label>Quantity</label>
          <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" />
          <div className="opHint">
            {qtyMode === "units" ? "Units" : qtyMode === "usdRisk" ? "$ Risk" : "% Risk"}
          </div>
        </div>

        <div className="opSplit">
          <div className="opBox">
            <label className="opCheck">
              <input type="checkbox" checked={takeProfit} onChange={(e) => setTakeProfit(e.target.checked)} />
              Take Profit
            </label>

            <div className={takeProfit ? "opGrid2" : "opGrid2 disabled"}>
              <div><span>{tpSlMode === "usd" ? "$" : tpSlMode === "pct" ? "%" : "Pips"}</span><input value={tpSlMode === "usd" ? tp.usd : tpSlMode === "pct" ? tp.pct : tp.pips}
                onChange={(e) => setTp((p) => ({ ...p, [tpSlMode === "usd" ? "usd" : tpSlMode === "pct" ? "pct" : "pips"]: e.target.value }))} /></div>
              <div><span>Price</span><input value={tp.price} onChange={(e) => setTp((p) => ({ ...p, price: e.target.value }))} /></div>
            </div>
          </div>

          <div className="opBox">
            <label className="opCheck">
              <input type="checkbox" checked={stopLoss} onChange={(e) => setStopLoss(e.target.checked)} />
              Stop Loss
            </label>

            <div className={stopLoss ? "opGrid2" : "opGrid2 disabled"}>
              <div><span>{tpSlMode === "usd" ? "$" : tpSlMode === "pct" ? "%" : "Pips"}</span><input value={tpSlMode === "usd" ? sl.usd : tpSlMode === "pct" ? sl.pct : sl.pips}
                onChange={(e) => setSl((p) => ({ ...p, [tpSlMode === "usd" ? "usd" : tpSlMode === "pct" ? "pct" : "pips"]: e.target.value }))} /></div>
              <div><span>Price</span><input value={sl.price} onChange={(e) => setSl((p) => ({ ...p, price: e.target.value }))} /></div>
            </div>
          </div>
        </div>

        <button className="opBuyBar" type="button" onClick={placeOrder}>
          {side} {qty} {symbol} @ {orderPrice} {rightTab === "LIMIT" ? "LMT" : rightTab}
        </button>

        <div className="opInfo">
          <b>ORDER INFO</b>
          <div className="opInfoRow"><span>Pip Value</span><span>$ 0.1</span></div>
        </div>
      </div>
    </div>
  );
}
