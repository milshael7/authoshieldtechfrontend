// frontend/src/pages/Trading.jsx
import React, { useMemo, useState } from "react";
import TradingRoom from "./trading/TradingRoom.jsx";
import Market from "./trading/Market.jsx";

/**
 * Trading.jsx
 * - This is the "Trading cabinet" wrapper
 * - App.jsx still routes to <Trading />
 * - Inside Trading, we show sub-tabs (Room / Market / Reports)
 * - Cybersecurity view stays clean because these tabs only exist here
 */

export default function Trading({ user }) {
  const [tab, setTab] = useState("room"); // room | market | reports

  const btn = (active = false) => ({
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: active ? "rgba(122,167,255,0.22)" : "rgba(255,255,255,0.06)",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
    width: "auto",
  });

  const baseCard = useMemo(
    () => ({
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "rgba(0,0,0,0.25)",
      backdropFilter: "blur(8px)",
    }),
    []
  );

  return (
    <div className="tradeWrap">
      {/* Trading-only "cabinet" tabs */}
      <div style={{ ...baseCard, padding: 12, marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <b style={{ fontSize: 14 }}>Trading</b>
            <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75 }}>
              Choose a folder: Room (all panels) • Market (chart only) • Reports (later)
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={btn(tab === "room")} onClick={() => setTab("room")} type="button">
              Trading Room
            </button>
            <button style={btn(tab === "market")} onClick={() => setTab("market")} type="button">
              Market (Chart)
            </button>
            <button style={btn(tab === "reports")} onClick={() => setTab("reports")} type="button">
              Reports
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {tab === "room" && <TradingRoom user={user} />}
      {tab === "market" && <Market user={user} />}

      {tab === "reports" && (
        <div style={{ ...baseCard, padding: 14 }}>
          <h3 style={{ marginTop: 0 }}>Reports</h3>
          <div style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.5 }}>
            This will be its own page so the Trading Room doesn’t get crowded.
            <br />
            Next we’ll move: history / stats / exports into here.
          </div>
        </div>
      )}
    </div>
  );
}
