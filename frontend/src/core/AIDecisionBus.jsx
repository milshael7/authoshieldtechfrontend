// frontend/src/core/AIDecisionBus.jsx
// ==========================================================
// AI DECISION BUS — QUIET MODE v16
// SINGLE-SOURCE DECISIONS • NO ECHO • NO SELF-FEEDBACK
// THREAT-FIRST • PLATFORM-SAFE • TRADING-SAFE
// ==========================================================

import { createContext, useContext, useRef, useCallback } from "react";
import { useEventBus } from "./EventBus.jsx";

const AIBusContext = createContext(null);

/* ================= CONFIG ================= */

// events that are allowed to propagate immediately
const CRITICAL_DECISIONS = new Set([
  "ai_threat_detected",
  "ai_lockdown",
]);

// minimum spacing between same decision types (ms)
const DECISION_COOLDOWN = 100;

/* ================= PROVIDER ================= */

export function AIDecisionProvider({ children }) {
  const bus = useEventBus();

  const lastDecisionRef = useRef({}); // type → timestamp

  /* ================= CORE EMIT ================= */

  const emitDecision = useCallback(
    (type, payload = {}) => {
      const now = Date.now();
      const last = lastDecisionRef.current[type] || 0;

      // 🔇 Quiet guard: suppress repetitive self-noise
      if (
        !CRITICAL_DECISIONS.has(type) &&
        now - last < DECISION_COOLDOWN
      ) {
        return;
      }

      lastDecisionRef.current[type] = now;

      const event = {
        type,
        payload,
        ts: now,
      };

      // 🔑 SINGLE broadcast channel (no echo)
      bus.emit("ai_decision", event);

      // 🔔 Type-specific channel ONLY for critical decisions
      if (CRITICAL_DECISIONS.has(type)) {
        bus.emit(type, payload);
      }
    },
    [bus]
  );

  /* ================= PUBLIC API ================= */

  const ai = {
    tradeSignal(signal) {
      emitDecision("ai_trade_signal", signal);
    },

    threatDetected(threat) {
      emitDecision("ai_threat_detected", threat);
    },

    riskEscalation(risk) {
      emitDecision("ai_risk_escalation", risk);
    },

    lockdown(detail) {
      emitDecision("ai_lockdown", detail);
    },

    marketRegime(change) {
      emitDecision("ai_market_regime_change", change);
    },
  };

  return (
    <AIBusContext.Provider value={ai}>
      {children}
    </AIBusContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useAIDecision() {
  const ctx = useContext(AIBusContext);
  if (!ctx) {
    throw new Error(
      "useAIDecision must be used inside AIDecisionProvider"
    );
  }
  return ctx;
}
