// frontend/src/pages/Trading.jsx
import React, { useState } from "react";
import Market from "./trading/Market.jsx";
import TradingRoom from "./trading/TradingRoom.jsx";

export default function Trading() {
  const [tab, setTab] = useState("market"); // market | room | reports

  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0 }}>
      {/* TOP NAV */}
      <div style={{ display: "flex", gap: 10, padding: 12, flexWrap: "wrap" }}>
        <button className={tab === "market" ? "active" : ""} onClick={() => setTab("market")}>
          Market (Chart)
        </button>
        <button className={tab === "room" ? "active" : ""} onClick={() => setTab("room")}>
          Trading Room
        </button>
        <button className={tab === "reports" ? "active" : ""} onClick={() => setTab("reports")}>
          Reports
        </button>
      </div>

      {/* PAGE */}
      <div style={{ width: "100%", height: "calc(100vh - 60px)" }}>
        {tab === "market" && <Market />}
        {tab === "room" && <TradingRoom />}
        {tab === "reports" && (
          <div style={{ padding: 14 }}>
            <div className="card">
              <h3>Reports</h3>
              <ul style={{ opacity: 0.8 }}>
                <li>Win / Loss</li>
                <li>Daily P&amp;L</li>
                <li>Fees &amp; slippage</li>
                <li>Exports later</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
