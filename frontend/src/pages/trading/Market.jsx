import React, { useMemo, useRef, useState } from "react";
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
  const isMobile = window.innerWidth <= 768;

  // ---------------- CORE STATE ----------------
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [tf, setTf] = useState("D");
  const [side, setSide] = useState("BUY");
  const [orderType, setOrderType] = useState("LIMIT");

  // ---------------- PANEL STATE ----------------
  const [panelOpen, setPanelOpen] = useState(false);

  // ---------------- PRICE MOCK ----------------
  const [bid, setBid] = useState("1.11077");
  const [ask, setAsk] = useState("1.11088");
  const [orderPrice, setOrderPrice] = useState("1.11088");
  const [qty, setQty] = useState("1000");

  // ---------------- TP / SL ----------------
  const [takeProfit, setTakeProfit] = useState(false);
  const [stopLoss, setStopLoss] = useState(false);
  const [tp, setTp] = useState("1.11837");
  const [sl, setSl] = useState("1.10837");

  // ---------------- BOTTOM PANEL ----------------
  const [bottomTab, setBottomTab] = useState("Positions");

  // ---------------- TRADINGVIEW ----------------
  const tvSrc = useMemo(() => {
    const params = new URLSearchParams({
      symbol,
      interval: tf,
      theme: "light",
      timezone: "Etc/UTC",
      locale: "en",
    });
    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [symbol, tf]);

  function placeOrder() {
    alert(
      `${side} ${qty} ${symbol}\nType: ${orderType}\nPrice: ${orderPrice}`
    );
  }

  return (
    <div className="terminalRoot">
      {/* ---------- TOP BAR ---------- */}
      <header className="tvTopBar mobileTop">
        <select
          className="tvSelect"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        >
          {SYMBOLS.map((s) => (
            <option key={s}>{s}</option>
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

        <button className="tvPrimary" onClick={() => setPanelOpen(true)}>
          Trade
        </button>
      </header>

      {/* ---------- CHART ---------- */}
      <main className="tvChartArea mobileChart">
        <iframe
          className="tvIframe"
          title="chart"
          src={tvSrc}
          frameBorder="0"
        />

        {/* ---------- BOTTOM PANEL ---------- */}
        <section className="tvBottom mobileBottom">
          <div className="tvBottomTabs">
            {["Positions", "Orders", "History"].map((t) => (
              <button
                key={t}
                className={bottomTab === t ? "tvTab active" : "tvTab"}
                onClick={() => setBottomTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="tvBottomBody">{bottomTab} panel</div>
        </section>
      </main>

      {/* ---------- MOBILE ORDER PANEL ---------- */}
      {panelOpen && (
        <div className="mobileOrderSheet">
          <div className="sheetHandle" />
          <h3>{symbol}</h3>

          <div className="orderSide">
            <button onClick={() => setSide("SELL")}>SELL {bid}</button>
            <button onClick={() => setSide("BUY")}>BUY {ask}</button>
          </div>

          <div className="orderTypes">
            {["MARKET", "LIMIT"].map((t) => (
              <button
                key={t}
                className={orderType === t ? "active" : ""}
                onClick={() => setOrderType(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <input value={orderPrice} onChange={(e) => setOrderPrice(e.target.value)} />
          <input value={qty} onChange={(e) => setQty(e.target.value)} />

          <button className="tvPrimary" onClick={placeOrder}>
            Place Order
          </button>

          <button onClick={() => setPanelOpen(false)}>Close</button>
        </div>
      )}

      {/* ---------- MOBILE CSS ---------- */}
      <style>{`
        @media (max-width: 768px) {
          .mobileTop {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .mobileChart {
            height: 55svh;
          }

          .mobileBottom {
            max-height: 30svh;
            overflow: auto;
          }

          .mobileOrderSheet {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #fff;
            padding: 16px;
            border-top-left-radius: 16px;
            border-top-right-radius: 16px;
            z-index: 999;
          }

          .sheetHandle {
            width: 40px;
            height: 4px;
            background: #ccc;
            border-radius: 2px;
            margin: 0 auto 10px;
          }
        }
      `}</style>
    </div>
  );
}
