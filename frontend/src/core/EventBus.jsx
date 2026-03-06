// frontend/src/core/EventBus.jsx
// ======================================================
// GLOBAL PLATFORM EVENT BUS — QUIET MODE v16
// SIGNAL-SAFE • NO EVENT STORMS • NO SELF-ECHO
// THREAT-DRIVEN • ENTERPRISE STABLE
// ======================================================

import { createContext, useContext, useRef, useCallback } from "react";

const EventBusContext = createContext(null);

/* ================= CONFIG ================= */

// hard cap to prevent listener explosions
const MAX_LISTENERS_PER_EVENT = 25;

// events that are allowed to repeat rapidly (whitelist)
const HIGH_FREQ_EVENTS = new Set([
  "security_ws_connected",
  "security_ws_disconnected",
]);

/* ================= PROVIDER ================= */

export function EventBusProvider({ children }) {
  const listenersRef = useRef({});
  const lastEmitRef = useRef({}); // event → timestamp

  /* ================= EMIT ================= */

  const emit = useCallback((event, payload) => {
    const listeners = listenersRef.current[event];
    if (!listeners || listeners.length === 0) return;

    const now = Date.now();
    const last = lastEmitRef.current[event] || 0;

    // 🔇 Quiet guard: block rapid self-noise unless whitelisted
    if (!HIGH_FREQ_EVENTS.has(event) && now - last < 50) {
      return;
    }

    lastEmitRef.current[event] = now;

    // snapshot to prevent mutation during emit
    [...listeners].forEach((callback) => {
      try {
        callback(payload);
      } catch {
        // silent by design
      }
    });
  }, []);

  /* ================= ON ================= */

  const on = useCallback((event, callback) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }

    const list = listenersRef.current[event];

    // 🔇 prevent runaway listener growth
    if (list.length >= MAX_LISTENERS_PER_EVENT) {
      return () => {};
    }

    list.push(callback);

    return () => {
      listenersRef.current[event] =
        listenersRef.current[event].filter((cb) => cb !== callback);
    };
  }, []);

  /* ================= ONCE ================= */

  const once = useCallback((event, callback) => {
    const unsubscribe = on(event, (payload) => {
      unsubscribe();
      try {
        callback(payload);
      } catch {
        /* silent */
      }
    });
  }, [on]);

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
    throw new Error("useEventBus must be used inside EventBusProvider");
  }
  return ctx;
}
