// GlobalRiskGovernor.js
// Institutional Global Risk Controller

export function evaluateGlobalRisk({
  totalCapital,
  peakCapital,
  dailyPnL,
  maxDailyLossPct = 5,
  maxTotalDrawdownPct = 25,
}) {
  const dailyLossPct =
    dailyPnL < 0
      ? (Math.abs(dailyPnL) / totalCapital) * 100
      : 0;

  const totalDrawdownPct =
    peakCapital > 0
      ? ((peakCapital - totalCapital) / peakCapital) * 100
      : 0;

  if (dailyLossPct > maxDailyLossPct) {
    return {
      allowed: false,
      reason: "Daily loss limit exceeded",
      level: "daily",
    };
  }

  if (totalDrawdownPct > maxTotalDrawdownPct) {
    return {
      allowed: false,
      reason: "Max portfolio drawdown exceeded",
      level: "portfolio",
    };
  }

  return {
    allowed: true,
    level: "normal",
  };
}
