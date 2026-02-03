// frontend/src/pages/Trading.jsx
import React, { useState } from "react";

import Market from "./trading/Market.jsx";
import TradingRoom from "./trading/TradingRoom.jsx";

import Posture from "./Posture.jsx";
import Manager from "./Manager.jsx";
import Admin from "./Admin.jsx";

/* 🔴 IMPORTANT:
   This path MUST be EXACT
   - styles (plural)
   - platform.css (lowercase)
*/
import "../styles/platform.css";

export default function Trading() {
  const [section, setSection] = useState("trading");
  const [tab, setTab] = useState("market");

  return (
    <div className="platformShell">
      {/* ===== TOP PLATFORM BAR ===== */}
      <div className="platformTop">
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

        {section === "trading" && (
          <div className="platformTabs">
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
              Trading Room
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

        <div className="platformActions">
          <button className="pbtn" onClick={() => setSection("trading")}>
            Trading
          </button>
          <button className="pbtn" onClick={() => setSection("security")}>
            Cybersecurity
          </button>
          <button className="pbtn" onClick={() => setSection("admin")}>
            Admin
          </button>
        </div>
      </div>

      {/* ===== BODY ===== */}
      <div className="platformBody">
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
          <>
            {tab === "market" && <Market />}

            {tab === "room" && (
              <div className="platformCard">
                <TradingRoom />
              </div>
            )}

            {tab === "reports" && (
              <div className="platformCard">
                <ul>
                  <li>P&amp;L</li>
                  <li>Win / Loss</li>
                  <li>Risk</li>
                  <li>AI Notes</li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
