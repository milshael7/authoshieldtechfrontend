// frontend/src/context/SecurityContext.jsx
// Security Context — Enterprise Hardened v15
// QUIET-BY-DEFAULT • REST-ONLY • NO WS • NO SELF-NOISE • PLATFORM-SAFE

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getToken, api } from "../lib/api.js";
import { useEventBus } from "../core/EventBus.jsx";

const SecurityContext = createContext(null);

/* ================= PROVIDER ================= */

export function SecurityProvider({ children }) {
  const bus = useEventBus();

  /* ================= STATE ================= */

  const [systemStatus, setSystemStatus] = useState("secure");
  const [integrityAlert, setIntegrityAlert] = useState(null);
  const [riskScore, setRiskScore] = useState(0);
  const [domains, setDomains] = useState([]);

  /* ================= REFS ================= */

  const mountedRef = useRef(true);
  const quietRef = useRef(true); // 🔇 default quiet
  const lastAlertRef = useRef(0);

  /* ================= BOOT ================= */

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* ================= REST SECURITY TELEMETRY =================
     Single source of truth
     Slow cadence
     Silent on failure
  ============================================================ */

  useEffect(() => {
    let active = true;

    async function load() {
      if (!active) return;
      if (!getToken()) return;

      try {
        const summary = await api.postureSummary();
        if (!summary?.ok) return;

        const score = Number(summary.score || 0);

        setRiskScore(score);
        setDomains(Array.isArray(summary.domains) ? summary.domains : []);

        // 🔔 Escalate ONLY on real danger
        if (score >= 75) {
          quietRef.current = false;

          // prevent alert spam
          const now = Date.now();
          if (now - lastAlertRef.current > 30000) {
            lastAlertRef.current = now;
            setIntegrityAlert({
              type: "risk_threshold",
              score,
              ts: now,
            });

            setSystemStatus("compromised");
            bus.emit("security_threat_detected", { score });
          }
        } else {
          quietRef.current = true;
          setIntegrityAlert(null);
          setSystemStatus("secure");
        }
      } catch {
        // 🔇 intentional silence
      }
    }

    // delayed boot
    const boot = setTimeout(load, 4000);
    const interval = setInterval(load, 120000); // 2 min cadence

    return () => {
      active = false;
      clearTimeout(boot);
      clearInterval(interval);
    };
  }, [bus]);

  /* ================= CONTEXT ================= */

  const value = useMemo(
    () => ({
      systemStatus,
      integrityAlert,
      riskScore,
      domains,
    }),
    [systemStatus, integrityAlert, riskScore, domains]
  );

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx) {
    throw new Error(
      "useSecurity must be used inside <SecurityProvider />"
    );
  }
  return ctx;
}
