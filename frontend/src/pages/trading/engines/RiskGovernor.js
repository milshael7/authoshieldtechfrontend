// Global Risk Governor (PHASE 8)

export function evaluateGlobalRisk({
  allocation,
  performance,
  maxPortfolioDrawdownPct = 15,
  maxConsecutiveLosses = 5,
}) {
  const total = allocation.total;

  const totalPnL =
    performance.scalp.pnl +
    performance.session.pnl;

  const portfolioDrawdown =
    totalPnL < 0
      ? (Math.abs(totalPnL) / total) * 100
      : 0;

  const consecutiveLosses =
    Math.max(
      performance.scalp.losses,
      performance.session.losses
    );

  /* ================= HARD LOCK CONDITIONS ================= */

  if (portfolioDrawdown > maxPortfolioDrawdownPct) {
    return {
      locked: true,
      reason: "Portfolio drawdown exceeded limit",
    };
  }

  if (consecutiveLosses >= maxConsecutiveLosses) {
    return {
      locked: true,
      reason: "Consecutive losses threshold exceeded",
    };
  }

  return {
    locked: false,
  };
}
