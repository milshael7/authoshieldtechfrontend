// frontend/src/core/BrainAdapter.jsx
// ==========================================================
// AI BRAIN ADAPTER — ENTERPRISE SEALED v18
// PASSIVE • DEDUPED • AUTH-AWARE • RATE-BOUND
// NO SELF-NOISE • NO REPLAY STORMS • PLATFORM-SAFE
// SINGLE RESPONSIBILITY: INGEST → NORMALIZE → FORWARD
// ==========================================================

import { useEffect, useRef } from "react";
import { api, getToken } from "../lib/api.js";
import { useAIDecision } from "./AIDecisionBus.jsx";

/* ================= CONFIG ================= */

// Calm, predictable polling
const POLL_INTERVAL = 30000; // 30s

// Hard safety limits
const MAX_CACHE = 100;       // bounded memory
const MAX_PER_CYCLE = 10;    // max decisions per poll
const MAX_ERRORS = 5;        // stop polling after repeated failures

/* ================= COMPONENT ================= */

export default function BrainAdapter() {
  const ai = useAIDecision();

  const seenRef = useRef(new Set());   // dedupe cache
  const errorRef = useRef(0);          // error counter
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    async function loadDecisions() {
      // 🔇 QUIET RULE: no auth → no AI
      if (!getToken()) return;
      if (!mountedRef.current) return;
      if (errorRef.current >= MAX_ERRORS) return;

      let res;
      try {
        res = await api.req("/api/admin/ai-decisions?limit=10");
      } catch {
        errorRef.current += 1;
        return; // silent by design
      }

      if (!mountedRef.current) return;
      if (!Array.isArray(res?.decisions)) return;

      let processed = 0;

      for (const decision of res.decisions) {
        if (processed >= MAX_PER_CYCLE) break;

        const id =
          decision.id ||
          `${decision.type}:${decision.ts || decision.createdAt}`;

        // 🔒 Deduplication
        if (seenRef.current.has(id)) continue;

        seenRef.current.add(id);
        processed += 1;

        // 🧠 Bounded cache (no memory creep)
        if (seenRef.current.size > MAX_CACHE) {
          seenRef.current = new Set(
            Array.from(seenRef.current).slice(-MAX_CACHE)
          );
        }

        const type = String(decision.type || "").toLowerCase();

        // 🔔 Forward ONCE — AIDecisionBus handles throttling
        if (type.includes("trade")) {
          ai.tradeSignal(decision);
        } else if (type.includes("threat")) {
          ai.threatDetected(decision);
        } else if (type.includes("risk")) {
          ai.riskEscalation(decision);
        }
      }
    }

    // Initial passive sync
    loadDecisions();

    intervalRef.current = setInterval(
      loadDecisions,
      POLL_INTERVAL
    );

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, [ai]);

  return null;
}
