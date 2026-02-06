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
            <header className="mtpHeader">
              <h3>{symbol}</h3>
              <button
                className="mtpClose"
                onClick={() => setPanelOpen(false)}
                aria-label="Close"
              >
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

            <input className="tradeInput" placeholder="Order price" />
            <input className="tradeInput" placeholder="Quantity" />

            <button className="tvPrimary full">
              Place {side}
            </button>
          </aside>
        </>
      )}

      {/* ===== MOBILE-ONLY STYLES ===== */}
      <style>{`
        .tradeOverlay{
          position:fixed;
          inset:0;
          background:rgba(0,0,0,.45);
          z-index:40;
        }

        .mobileTradePanel{
          position:fixed;
          left:0;
          right:0;
          bottom:0;
          background:#fff;
          color:#111;
          border-radius:18px 18px 0 0;
          padding:16px;
          z-index:41;
          max-height:85vh;
          overflow:auto;
        }

        .mtpHeader{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:14px;
        }

        .mtpClose{
          background:none;
          border:none;
          font-size:20px;
          cursor:pointer;
        }

        .orderSide{
          display:flex;
          gap:10px;
          margin-bottom:14px;
        }

        .orderBtn{
          flex:1;
          padding:12px;
          border-radius:12px;
          border:1px solid #ddd;
          font-weight:600;
        }

        .orderBtn.buy.active{
          background:#2bd576;
          color:#fff;
        }

        .orderBtn.sell.active{
          background:#ff5a5f;
          color:#fff;
        }

        .tradeInput{
          width:100%;
          padding:12px;
          margin-bottom:10px;
          border-radius:10px;
          border:1px solid #ddd;
        }

        .tvPrimary.full{
          width:100%;
          margin-top:6px;
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
