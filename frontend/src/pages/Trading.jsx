// frontend/src/pages/Trading.jsx
import React, { useMemo, useState } from "react";
import Market from "./trading/Market.jsx";
import TradingRoom from "./trading/TradingRoom.jsx";
import "../styles/trading.css"; // ensures platformShell styles are loaded

export default function Trading() {
  const [tab, setTab] = useState("market"); // market | room | reports

  // Where to go when you click the logo to return to Cybersecurity/Admin
  // Change this path later if your admin route is different.
  const cyberUrl = useMemo(() => {
    return (import.meta.env.VITE_CYBER_URL || "/").trim() || "/";
  }, []);

  const goCyber = () => {
    window.location.href = cyberUrl;
  };

  return (
    <div className="platformShell" style={{ minHeight: "100vh" }}>
      {/* TOP PLATFORM BAR */}
      <div className="platformTop">
        <div className="platformBrand" onClick={goCyber} title="Back to Cybersecurity/Admin">
          <div className="platformLogo" />
          <div className="platformBrandTxt">
            <b>AutoShield</b>
            <span>ADMIN</span>
          </div>
        </div>

        <div className="platformTabs">
          <button
            type="button"
            className={tab === "market" ? "ptab active" : "ptab"}
            onClick={() => setTab("market")}
          >
            Market (Chart)
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

        <div className="platformActions">
          <button type="button" className="pbtn" onClick={() => setTab("market")}>
            Open Market
          </button>
          <button type="button" className="pbtn" onClick={goCyber}>
            Cybersecurity
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="platformBody">
        {tab === "market" && (
          <div className="platformCard" style={{ padding: 0 }}>
            {/* Market already has its own terminal toolbars inside */}
            <Market />
          </div>
        )}

        {tab === "room" && (
          <div className="platformCard">
            <TradingRoom />
          </div>
        )}

        {tab === "reports" && (
          <div className="platformCard">
            <h3 style={{ marginTop: 0 }}>Reports</h3>
            <ul style={{ opacity: 0.85, lineHeight: 1.6 }}>
              <li>Win / Loss</li>
              <li>Daily P&amp;L</li>
              <li>Fees &amp; slippage</li>
              <li>Exports later</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
