import React, { useState } from "react";

import Market from "./trading/Market.jsx";
import TradingRoom from "./trading/TradingRoom.jsx";

import Posture from "./Posture.jsx";
import Manager from "./Manager.jsx";
import Admin from "./Admin.jsx";

import "../styles/platform.css";

export default function Trading() {
  const [section, setSection] = useState("trading");
  const [tab, setTab] = useState("market");

  return (
    <div className="platformShell tradingShell">
      {/* ===== TOP PLATFORM BAR ===== */}
      <div className="platformTop tradingTop">
        {/* Brand */}
        <button
          type="button"
          className="platformBrand"
          onClick={() => setSection("dashboard")}
        >
          <div className="platformLogo" />
          <div className="platformBrandTxt">
            <b>AutoShield</b>
            <span>SECURITY • TRADING</span>
          </div>
        </button>

        {/* Tabs */}
        {section === "trading" && (
          <div className="platformTabs tradingTabs">
            <button
              type="button"
              className={tab === "market" ? "ptab active" : "ptab"}
              onClick={() => setTab("market")}
            >
              Market
            </button>
            <button
              type="button"
              className={tab === "room" ? "ptab active" : "ptab"}
              onClick={() => setTab("room")}
            >
              Room
            </button>
            <button
              type="button"
              className={tab === "reports" ? "ptab active" : "ptab"}
              onClick={() => setTab("reports")}
            >
              Reports
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="platformActions tradingActions">
          <button className="pbtn" onClick={() => setSection("trading")}>
            Trading
          </button>
          <button className="pbtn" onClick={() => setSection("security")}>
            Security
          </button>
          <button className="pbtn" onClick={() => setSection("admin")}>
            Admin
          </button>
        </div>
      </div>

      {/* ===== BODY ===== */}
      <div className="platformBody tradingBody">
        {section === "dashboard" && (
          <div className="platformCard">
            <h3>Dashboard</h3>
            <p>Owner overview.</p>
          </div>
        )}

        {section === "security" && (
          <div className="platformCard">
            <Posture />
          </div>
        )}

        {section === "admin" && (
          <div className="platformCard">
            <Admin />
            <div style={{ height: 16 }} />
            <Manager />
          </div>
        )}

        {section === "trading" && (
          <div className="tradingContent">
            {tab === "market" && (
              <div className="platformCard tradingPanel">
                <Market />
              </div>
            )}

            {tab === "room" && (
              <div className="platformCard tradingPanel">
                <TradingRoom />
              </div>
            )}

            {tab === "reports" && (
              <div className="platformCard tradingPanel">
                <ul>
                  <li>P&amp;L</li>
                  <li>Win / Loss</li>
                  <li>Risk</li>
                  <li>AI Notes</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== MOBILE FIXES ===== */}
      <style>{`
        @media (max-width: 768px){
          .tradingTop{
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .tradingTabs{
            justify-content: space-between;
          }

          .tradingActions{
            display: flex;
            justify-content: space-between;
            gap: 8px;
          }

          .tradingBody{
            padding: 10px;
          }

          .tradingPanel{
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
}
