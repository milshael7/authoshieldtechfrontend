import React, { useState } from "react";
import Market from "./trading/Market.jsx";
import TradingRoom from "./trading/TradingRoom.jsx";
import "../styles/platform.css";

export default function Trading() {
  const [tab, setTab] = useState("market");

  return (
    <div className="trading-root">
      {/* ===== HEADER ===== */}
      <header className="trading-header">
        <div className="trading-brand">
          <strong>AutoShield</strong>
          <span>Trading</span>
        </div>

        <nav className="trading-tabs">
          <button
            type="button"
            className={tab === "market" ? "ttab active" : "ttab"}
            onClick={() => setTab("market")}
          >
            Market
          </button>

          <button
            type="button"
            className={tab === "room" ? "ttab active" : "ttab"}
            onClick={() => setTab("room")}
          >
            Trading Room
          </button>

          <button
            type="button"
            className={tab === "reports" ? "ttab active" : "ttab"}
            onClick={() => setTab("reports")}
          >
            Reports
          </button>
        </nav>
      </header>

      {/* ===== CONTENT ===== */}
      <main className="trading-content">
        {tab === "market" && (
          <section className="trading-section">
            <Market />
          </section>
        )}

        {tab === "room" && (
          <section className="trading-section">
            <TradingRoom />
          </section>
        )}

        {tab === "reports" && (
          <section className="trading-section">
            <div className="card">
              <h3>Reports</h3>
              <ul>
                <li>P&amp;L</li>
                <li>Win / Loss</li>
                <li>Risk</li>
                <li>AI Notes</li>
              </ul>
            </div>
          </section>
        )}
      </main>

      {/* ===== STYLES ===== */}
      <style>{`
        .trading-root{
          display:flex;
          flex-direction:column;
          min-height:100svh;
          height:100%;
        }

        .trading-header{
          position:sticky;
          top:0;
          z-index:30;
          background:rgba(10,15,30,.95);
          border-bottom:1px solid rgba(255,255,255,.1);
          padding:12px;
          display:flex;
          flex-direction:column;
          gap:10px;
        }

        .trading-brand{
          display:flex;
          justify-content:space-between;
          align-items:center;
          font-weight:700;
        }

        .trading-tabs{
          display:flex;
          gap:8px;
        }

        .ttab{
          flex:1;
          padding:10px;
          border-radius:10px;
          border:1px solid rgba(255,255,255,.15);
          background:rgba(255,255,255,.08);
          color:#fff;
          font-weight:600;
          cursor:pointer;
        }

        .ttab.active{
          background:rgba(120,160,255,.35);
          border-color:rgba(120,160,255,.6);
        }

        .trading-content{
          flex:1;
          overflow:auto;
          padding:12px;
        }

        .trading-section{
          height:100%;
        }

        @media (min-width: 769px){
          .trading-header{
            flex-direction:row;
            align-items:center;
            justify-content:space-between;
          }

          .trading-tabs{
            max-width:420px;
          }
        }
      `}</style>
    </div>
  );
}
