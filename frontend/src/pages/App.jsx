// frontend/src/App.jsx
import React, { useState } from "react";

/* ===== PAGES ===== */
import Trading from "./pages/Trading.jsx";
import Notifications from "./pages/Notifications.jsx";

/* ===== STYLES ===== */
import "./styles/platform.css";

export default function App() {
  // main app navigation
  const [page, setPage] = useState("trading");

  return (
    <div className="platformApp">
      {/* ================= TOP NAV ================= */}
      <header className="platformTop">
        <button
          className="platformBrand"
          onClick={() => setPage("trading")}
        >
          <div className="platformLogo" />
          <div className="platformBrandTxt">
            <b>AutoShield Tech</b>
            <span>SECURITY • TRADING</span>
          </div>
        </button>

        <div className="platformActions">
          <button
            className={`pbtn ${page === "trading" ? "active" : ""}`}
            onClick={() => setPage("trading")}
          >
            Trading
          </button>

          <button
            className={`pbtn ${page === "notifications" ? "active" : ""}`}
            onClick={() => setPage("notifications")}
          >
            Notifications
          </button>
        </div>
      </header>

      {/* ================= BODY ================= */}
      <main className="platformBody">
        {page === "trading" && <Trading />}

        {page === "notifications" && (
          <div className="platformCard">
            <Notifications />
          </div>
        )}
      </main>
    </div>
  );
}
