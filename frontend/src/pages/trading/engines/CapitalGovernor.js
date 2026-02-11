// CapitalGovernor.js
// Semi-auto rebalancing suggestion logic

import { getEngineStats } from "./EngineMemory";

export function suggestRebalance(allocation) {
  const scalpStats = getEngineStats("scalp");
  const sessionStats = getEngineStats("session");

  const difference =
    sessionStats.confidence - scalpStats.confidence;

  if (Math.abs(difference) < 10) {
    return null; // No rebalance needed
  }

  const shiftAmount = allocation.total * 0.1; // 10%

  if (difference > 0) {
    return {
      from: "scalp",
      to: "session",
      amount: shiftAmount,
    };
  } else {
    return {
      from: "session",
      to: "scalp",
      amount: shiftAmount,
    };
  }
}
