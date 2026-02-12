// SystemGovernor.js
// Multi-layer institutional circuit breaker

let systemState = {
  status: "normal", // normal | warning | reduced | locked
  lockReason: null,
};

/* ================= EVALUATION ================= */

export function evaluateSystemState({
  totalCapital,
  peakCapital,
  dailyPnL,
}) {
  const drawdown =
    peakCapital > 0
      ? ((peakCapital - totalCapital) / peakCapital) * 100
      : 0;

  /* ===== HARD LOCK ===== */
  if (drawdown >= 25 || dailyPnL <= -0.1 * peakCapital) {
    systemState.status = "locked";
    systemState.lockReason = "Severe capital protection trigger";
    return systemState;
  }

  /* ===== REDUCED RISK ===== */
  if (drawdown >= 15) {
    systemState.status = "reduced";
    systemState.lockReason = "Drawdown protection active";
    return systemState;
  }

  /* ===== WARNING ===== */
  if (drawdown >= 10) {
    systemState.status = "warning";
    systemState.lockReason = "Early drawdown warning";
    return systemState;
  }

  systemState.status = "normal";
  systemState.lockReason = null;

  return systemState;
}

/* ================= MANUAL RESET ================= */

export function resetSystemLock() {
  systemState.status = "normal";
  systemState.lockReason = null;
}
