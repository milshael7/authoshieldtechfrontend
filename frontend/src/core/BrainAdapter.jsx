// frontend/src/core/BrainAdapter.jsx
// ==========================================================
// AI BRAIN ADAPTER — QUIET MODE v16
// PASSIVE • DEDUPED • AUTH-AWARE
// NO SELF-NOISE • NO REPLAY STORMS
// ==========================================================

import { useEffect, useRef } from "react";
import { api, getToken } from "../lib/api.js";
import { useAIDecision } from "./AIDecisionBus.jsx";

const POLL_INTERVAL = 30000; // 30s — slower, quieter
const MAX_CACHE = 100; // prevent memory growth

export default function BrainAdapter() {
  const ai = useAIDecision();

  const seenRef = useRef(new Set());
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    async function loadDecisions() {
      // 🔇 QUIET RULE: no auth, no brain
      if (!getToken()) return;

      try {
        const res = await api.req("/api/admin/ai-decisions?limit=10");

        if (!mountedRef.current) return;
        if (!Array.isArray(res?.decisions)) return;

        for (const decision of res.decisions) {
          const id =
            decision.id ||
            `${decision.type}:${decision.ts || decision.createdAt}`;

          if (seenRef.current.has(id)) continue;

          seenRef.current.add(id);

          // prevent unbounded growth
          if (seenRef.current.size > MAX_CACHE) {
            seenRef.current = new Set(
              Array.from(seenRef.current).slice(-MAX_CACHE)
            );
          }

          const type = String(decision.type || "").toLowerCase();

          if (type.includes("trade")) {
            ai.tradeSignal(decision);
          } else if (type.includes("threat")) {
            ai.threatDetected(decision);
          } else if (type.includes("risk")) {
            ai.riskEscalation(decision);
          }
        }
      } catch {
        // 🔕 silent by design
      }
    }

    // initial passive sync
    loadDecisions();

    intervalRef.current = setInterval(loadDecisions, POLL_INTERVAL);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
    };
  }, [ai]);

  return null;
}
