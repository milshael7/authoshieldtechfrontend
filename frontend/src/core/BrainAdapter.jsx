// frontend/src/core/BrainAdapter.jsx
// ==========================================================
// AI BRAIN ADAPTER
// Connects backend AI brain → AI Decision Bus
// ==========================================================

import { useEffect } from "react";
import { api } from "../lib/api.js";
import { useAIDecision } from "./AIDecisionBus.jsx";

export default function BrainAdapter() {

  const ai = useAIDecision();

  useEffect(() => {

    async function loadDecisions() {

      try {

        const res = await api.get("/api/admin/ai-decisions?limit=10");

        if (!res?.decisions) return;

        res.decisions.forEach(decision => {

          const type = String(decision.type || "").toLowerCase();

          if (type.includes("trade")) {
            ai.tradeSignal(decision);
          }

          else if (type.includes("threat")) {
            ai.threatDetected(decision);
          }

          else if (type.includes("risk")) {
            ai.riskEscalation(decision);
          }

        });

      } catch {}

    }

    loadDecisions();

    const interval = setInterval(loadDecisions, 20000);

    return () => clearInterval(interval);

  }, [ai]);

  return null;

}
