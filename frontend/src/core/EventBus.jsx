// frontend/src/core/EventBus.jsx
// ======================================================
// GLOBAL PLATFORM EVENT BUS — QUIET MODE v18 (SEALED)
// DETERMINISTIC • BACKPRESSURE-AWARE • NO SELF-ECHO
// THREAT-FIRST • ENTERPRISE-STABLE • FAIL-SILENT
// SINGLE-SOURCE SIGNAL FLOW
// ======================================================

import { createContext, useContext, useRef, useCallback } from "react";

const EventBusContext = createContext(null);

/* ================= CONFIG ================= */

// absolute safety caps (hard guarantees)
const MAX_LISTENERS_PER_EVENT = 20;
const MAX_EMITS_PER_EVENT_PER_SEC = 10;

// events explicitly allowed higher frequency
// (connectivity / advisory only — no state meaning)
const HIGH_FREQ_EVENTS = new Set([
  "security_ws_connected",
  "security_ws_disconnected",
]);

/* ================= PROVIDER ================= */

export function EventBusProvider({ children }) {
  const listenersRef = useRef(Object.create(null));
  const emitWindowRef = useRef(Object.create(null)); // event → { count, ts }

  /* ================= EMIT GUARD ================= */

  const canEmit = useCallback((event) => {
    const now = Date.now();
    const win = emitWindowRef.current[event];

    // initialize or reset window
    if (!win || now - win.ts >= 1000) {
      emitWindowRef.current[event] = { count: 1, ts: now };
      return true;
    }

    // high-frequency whitelist (still counted, never blocked)
    if (HIGH_FREQ_EVENTS.has(event)) {
      win.count += 1;
      return true;
    }

    // enforce per-second cap
    if (win.count >= MAX_EMITS_PER_EVENT_PER_SEC) {
      return false;
    }

    win.count += 1;
    return true;
  }, []);

  /* ================= EMIT ================= */

  const emit = useCallback(
    (event, payload) => {
      const listeners = listenersRef.current[event];
      if (!listeners || listeners.length === 0) return;
      if (!canEmit(event)) return;

      // snapshot prevents mutation / re-entrancy issues
      const snapshot = listeners.slice();

      for (const cb of snapshot) {
        try {
          cb(payload);
        } catch {
          // 🔇 FAIL-SILENT by design
        }
      }
    },
    [canEmit]
  );

  /* ================= ON ================= */

  const on = useCallback((event, callback) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }

    const list = listenersRef.current[event];

    // hard cap listener growth (prevents leaks & storms)
    if (list.length >= MAX_LISTENERS_PER_EVENT) {
      return () => {};
    }

    list.push(callback);

    return () => {
      const arr = listenersRef.current[event];
      if (!arr) return;
      listenersRef.current[event] = arr.filter(
        (cb) => cb !== callback
      );
    };
  }, []);

  /* ================= ONCE ================= */

  const once = useCallback(
    (event, callback) => {
      const unsubscribe = on(event, (payload) => {
        unsubscribe();
        try {
          callback(payload);
        } catch {
          // 🔇 silent
        }
      });
    },
    [on]
  );

  /* ================= CONTEXT ================= */

  const bus = {
    emit,
    on,
    once,
  };

  return (
    <EventBusContext.Provider value={bus}>
      {children}
    </EventBusContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useEventBus() {
  const ctx = useContext(EventBusContext);
  if (!ctx) {
    throw new Error(
      "useEventBus must be used inside EventBusProvider"
    );
  }
  return ctx;
}
