import React, { useMemo, useState } from "react";
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
          <button className="tvPrimary" onClick={() => setPanelOpen(true)}>
            Trade
          </button>
        </div>
      </header>

      {/* ===== CHART ===== */}
      <main className="tvChartArea">
        <iframe
          className="tvIframe"
          title="chart"
          src={tvSrc}
          frameBorder="0"
        />
      </main>

      {/* ===== MOBILE TRADE PANEL ===== */}
      {panelOpen && (
        <>
          <div
            className="tradeOverlay"
            onClick={() => setPanelOpen(false)}
          />

          <aside className="mobileTradePanel">
            <header>
              <h3>{symbol}</h3>
              <button onClick={() => setPanelOpen(false)}>✕</button>
            </header>

            <div className="orderSide">
              <button
                className={side === "SELL" ? "danger" : ""}
                onClick={() => setSide("SELL")}
              >
                SELL
              </button>
              <button
                className={side === "BUY" ? "ok" : ""}
                onClick={() => setSide("BUY")}
              >
                BUY
              </button>
            </div>

            <input placeholder="Order price" />
            <input placeholder="Quantity" />

            <button className="tvPrimary">
              Place {side}
            </button>
          </aside>
        </>
      )}

      {/* ===== MOBILE STYLES ===== */}
      <style>{`
        .tradeOverlay{
          position:fixed;
          inset:0;
          background:rgba(0,0,0,.5);
          z-index:20;
        }

        .mobileTradePanel{
          position:fixed;
          left:0;
          right:0;
          bottom:0;
          background:#fff;
          border-radius:18px 18px 0 0;
          padding:16px;
          z-index:21;
          max-height:85vh;
          overflow:auto;
        }

        .mobileTradePanel header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:12px;
        }

        .orderSide{
          display:flex;
          gap:10px;
          margin-bottom:12px;
        }

        .orderSide button{
          flex:1;
        }

        @media (min-width: 900px){
          .tradeOverlay,
          .mobileTradePanel{
            display:none;
          }
        }
      `}</style>
    </div>
  );
}
