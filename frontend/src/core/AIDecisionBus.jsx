// frontend/src/core/AIDecisionBus.jsx
// ==========================================================
// AI DECISION BUS — ENTERPRISE SEALED v18
// SINGLE-SOURCE • BACKPRESSURE-AWARE • NO ECHO
// THREAT-FIRST • EVENTBUS-COMPLIANT • PLATFORM-STABLE
// NO SELF-FEEDBACK • NO REPLAY STORMS • DETERMINISTIC
// ==========================================================

import {
  createContext,
  useContext,
  useRef,
  useCallback,
} from "react";
import { useEventBus } from "./EventBus.jsx";

/* ================= CONTEXT ================= */

const AIBusContext = createContext(null);

/* ================= CONFIG ================= */

// Decisions that must always propagate immediately
const CRITICAL_DECISIONS = new Set([
  "ai_threat_detected",
  "ai_lockdown",
]);

// Per-decision cooldowns (ms)
const DECISION_COOLDOWN = {
  ai_trade_signal: 250,
  ai_risk_escalation: 500,
  ai_market_regime_change: 1000,
  default: 300,
};

// Hard safety caps
const MAX_EMITS_PER_SESSION = 200;

/* ================= PROVIDER ================= */

export function AIDecisionProvider({ children }) {
  const bus = useEventBus();

  // type → last emit timestamp
  const lastDecisionRef = useRef({});
  const emitCountRef = useRef(0);
  const mountedRef = useRef(true);

  /* ================= LIFECYCLE ================= */

  // no effects needed — pure dispatcher

  /* ================= CORE EMIT ================= */

  const emitDecision = useCallback(
    (type, payload = {}) => {
      if (!mountedRef.current) return;

      // absolute session safety cap
      if (emitCountRef.current >= MAX_EMITS_PER_SESSION) {
        return;
      }

      const now = Date.now();
      const last = lastDecisionRef.current[type] || 0;

      const cooldown =
        DECISION_COOLDOWN[type] ??
        DECISION_COOLDOWN.default;

      // 🔇 Quiet guard — suppress internal churn
      if (
        !CRITICAL_DECISIONS.has(type) &&
        now - last < cooldown
      ) {
        return;
      }

      lastDecisionRef.current[type] = now;
      emitCountRef.current += 1;

      const event = {
        type,
        payload,
        ts: now,
      };

      // 🔑 SINGLE canonical broadcast
      // All consumers listen here
      bus.emit("ai_decision", event);

      // 🔔 Direct channels ONLY for critical actions
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
