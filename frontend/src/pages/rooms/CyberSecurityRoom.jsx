import React from "react";
import AiTextPanel from "../../components/AiTextPanel";

/**
 * CyberSecurityRoom
 * - Company-scoped
 * - AuthoDev 6.5 aware
 * - No backend exposure
 */

export default function CyberSecurityRoom() {
  /**
   * 🔒 ROOM CONTEXT
   * This is ALL the AI sees.
   * Backend + tenant middleware enforce the rest.
   */
  function getRoomContext() {
    return {
      platform: "AutoShield",
      room: "CyberSecurity",

      // room-specific data
      security: {
        posture: "monitoring",
        activeAlerts: 2,
        lastIncident: "Suspicious email login blocked",
      },

      // allowed topics
      allowed: [
        "security posture",
        "alerts",
        "incident explanation",
        "recommendations",
      ],
    };
  }

  return (
    <div style={{ height: "100%", display: "flex", gap: 16 }}>
      {/* LEFT: ROOM CONTENT */}
      <div style={{ flex: 2 }}>
        <h2>Cybersecurity Room</h2>
        <p>
          Monitor threats, incidents, and defensive posture in real time.
        </p>

        {/* Your charts / panels / logs go here */}
      </div>

      {/* RIGHT: AUTHODEV PANEL */}
      <div style={{ flex: 1, minWidth: 360 }}>
        <AiTextPanel
          title="AuthoDev 6.5 — Security Assistant"
          endpoint="/api/ai/chat"
          getContext={getRoomContext}
        />
      </div>
    </div>
  );
}
