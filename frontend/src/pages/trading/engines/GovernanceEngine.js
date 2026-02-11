/* =========================================================
   GovernanceEngine.js
   Institutional Risk & Override Layer
   ========================================================= */

export function applyGovernance({
  engineType,
  balance,
  requestedRisk,
  requestedLeverage,
  performance,
  humanCaps,
}) {
  const {
    maxRiskPct = 2,
    maxLeverage = 10,
    maxDrawdownPct = 10,
    maxConsecutiveLosses = 3,
  } = humanCaps || {};

  const enginePerf = performance?.[engineType] || {
    wins: 0,
    losses: 0,
    pnl: 0,
  };

  const totalTrades = enginePerf.wins + enginePerf.losses;

  const drawdownPct =
    balance <= 0 ? 100 : Math.abs(enginePerf.pnl) / balance * 100;

  let effectiveRisk = requestedRisk;
  let effectiveLeverage = requestedLeverage;
  let blocked = false;
  let reason = "";

  /* ================= HARD CAPS ================= */

  if (requestedRisk > maxRiskPct) {
    effectiveRisk = maxRiskPct;
  }

  if (requestedLeverage > maxLeverage) {
    effectiveLeverage = maxLeverage;
  }

  /* ================= AUTO DEFENSIVE MODE ================= */

  if (enginePerf.losses >= maxConsecutiveLosses) {
    effectiveRisk = effectiveRisk * 0.5;
  }

  if (drawdownPct >= maxDrawdownPct) {
    blocked = true;
    reason = "Drawdown limit exceeded.";
  }

  return {
    approved: !blocked,
    reason,
    effectiveRisk,
    effectiveLeverage,
  };
}
