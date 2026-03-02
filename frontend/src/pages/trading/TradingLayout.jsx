// frontend/src/pages/trading/TradingLayout.jsx
// ============================================================
// TRADING LAYOUT — ROUTED STRUCTURE
// LIVE / AI CONTROL / ANALYTICS
// ============================================================

import React from "react";
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import TradingRoom from "./TradingRoom";
import Market from "./Market";
import AIControl from "./AIControl";
import Analytics from "./Analytics";

export default function TradingLayout() {

  const linkBase = {
    padding: "10px 18px",
    textDecoration: "none",
    color: "#d1d5db",
    borderRadius: 8,
    fontWeight: 600,
  };

  const linkActive = {
    background: "#1e2536",
    color: "#fff",
  };

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* TOP NAVIGATION */}
      <div
        className="tradeTabs actions"
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 12,
          borderBottom: "1px solid rgba(255,255,255,.08)",
          paddingBottom: 10
        }}
      >
        <NavLink
          to="live"
          style={({ isActive }) =>
            isActive ? { ...linkBase, ...linkActive } : linkBase
          }
        >
          Live Trading
        </NavLink>

        <NavLink
          to="control"
          style={({ isActive }) =>
            isActive ? { ...linkBase, ...linkActive } : linkBase
          }
        >
          AI Control
        </NavLink>

        <NavLink
          to="analytics"
          style={({ isActive }) =>
            isActive ? { ...linkBase, ...linkActive } : linkBase
          }
        >
          Analytics
        </NavLink>
      </div>

      {/* ROUTED CONTENT */}
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="live" element={<TradingRoom />} />
          <Route path="control" element={<AIControl />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="market" element={<Market />} />
          <Route path="*" element={<Navigate to="live" replace />} />
        </Routes>
      </div>

    </div>
  );
}
