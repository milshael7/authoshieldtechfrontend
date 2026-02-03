// frontend/src/pages/trading/TradingRoom.jsx
import React from "react";
import "../../styles/trading.css";
import VoiceAI from "../../components/VoiceAI";

export default function TradingRoom() {
  return (
    <div className="roomShell">
      <div className="roomHeader">
        <h2>Trading Room</h2>
        <div className="roomSub">
          This is the private “AI + logs + explanations” area. Chart stays in Market so nothing gets smushed.
        </div>
      </div>

      <div className="roomGrid">
        <section className="roomCard">
          <h3>AI Voice</h3>
          <p className="roomMuted">
            Voice will talk through decisions and explain why it entered/exited.
          </p>
          <VoiceAI title="AutoProtect Voice" endpoint="/api/ai/chat" />
        </section>

        <section className="roomCard">
          <h3>AI Explanation Panel</h3>
          <div className="roomMuted">
            This is where we will show:
            <ul>
              <li>Decision + reason</li>
              <li>Confidence</li>
              <li>Wins / losses</li>
              <li>“Safe base” rule (stop after X losses, grow base after wins)</li>
            </ul>
            We wire this to backend after the terminal UI is perfect.
          </div>
        </section>
      </div>
    </div>
  );
}
