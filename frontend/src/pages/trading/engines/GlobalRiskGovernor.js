// GlobalRiskGovernor.js
// Institutional Capital Protection Layer
// Controls system-level trade permission

let manualLock = false;

export function setManualLock(state) {
  manualLock = state;
}

export function evaluateGlobalRisk({
  totalCapital,
  peakCapital,
  dailyPnL,
  maxDailyLossPct = 5,
  maxTotalDrawdownPct = 15,
}) {
  if (manualLock) {
    return {
      allowed: false,
      reason: "Manual system lock enabled",
    };
  }

  /* ================= TOTAL DRAWDOWN ================= */

  const totalDrawdownPct =
    peakCapital > 0
      ? ((peakCapital - totalCapital) / peakCapital) * 100
      : 0;

  if (totalDrawdownPct >= maxTotalDrawdownPct) {
    return {
      allowed: false,
      reason: "Max total drawdown exceeded",
    };
  }

  /* ================= DAILY LOSS ================= */

  const dailyLossPct =
    peakCapital > 0
      ? (Math.abs(dailyPnL) / peakCapital) * 100
      : 0;

  if (dailyPnL < 0 && dailyLossPct >= maxDailyLossPct) {
    return {
      allowed: false,
      reason: "Max daily loss exceeded",
    };
  }

  return {
    allowed: true,
    totalDrawdownPct,
    dailyLossPct,
  };
}
