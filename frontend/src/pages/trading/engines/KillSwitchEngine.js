// KillSwitchEngine.js
// Institutional Emergency Protection System

export function evaluateKillSwitch({
  totalCapital,
  peakCapital,
  dailyPnL,
  consecutiveLosses,
  manualTrigger = false,
  config = {
    maxTotalDrawdownPct: 30,
    maxDailyLossPct: 10,
    maxConsecutiveLosses: 5,
  },
}) {
  if (manualTrigger) {
    return {
      active: true,
      reason: "Manual emergency stop activated",
    };
  }

  const totalDrawdownPct =
    peakCapital > 0
      ? ((peakCapital - totalCapital) / peakCapital) * 100
      : 0;

  if (totalDrawdownPct > config.maxTotalDrawdownPct) {
    return {
      active: true,
      reason: "Max total drawdown exceeded",
    };
  }

  const dailyLossPct =
    peakCapital > 0
      ? (Math.abs(dailyPnL) / peakCapital) * 100
      : 0;

  if (dailyPnL < 0 && dailyLossPct > config.maxDailyLossPct) {
    return {
      active: true,
      reason: "Max daily loss exceeded",
    };
  }

  if (consecutiveLosses >= config.maxConsecutiveLosses) {
    return {
      active: true,
      reason: "Consecutive loss threshold exceeded",
    };
  }

  return { active: false };
}
