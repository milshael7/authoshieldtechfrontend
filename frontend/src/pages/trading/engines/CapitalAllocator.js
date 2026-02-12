// CapitalAllocator.js
// Global Capital Distribution + Smart Rebalancing + Performance Rotation

/* ===========================================
   INITIAL DISTRIBUTION
=========================================== */

export function allocateCapital({
  totalCapital,
  engines = ["scalp", "session"],
  exchanges = ["coinbase", "kraken"],
  reservePct = 0.2,
}) {
  const reserve = totalCapital * reservePct;
  const tradable = totalCapital - reserve;

  const perEngine = tradable / engines.length;
  const perExchange = perEngine / exchanges.length;

  const allocation = {};

  engines.forEach((engine) => {
    allocation[engine] = {};
    exchanges.forEach((exchange) => {
      allocation[engine][exchange] = perExchange;
    });
  });

  return {
    reserve,
    allocation,
  };
}

/* ===========================================
   TOTAL CAPITAL
=========================================== */

export function calculateTotalCapital(allocation, reserve) {
  let total = reserve;

  Object.keys(allocation).forEach((engine) => {
    Object.keys(allocation[engine]).forEach((exchange) => {
      total += allocation[engine][exchange];
    });
  });

  return total;
}

/* ===========================================
   FLOOR REBALANCE
=========================================== */

export function rebalanceCapital({
  allocation,
  reserve,
  floor = 100,
  boostAmount = 200,
}) {
  const updated = JSON.parse(JSON.stringify(allocation));

  Object.keys(updated).forEach((engine) => {
    Object.keys(updated[engine]).forEach((exchange) => {
      if (updated[engine][exchange] < floor && reserve >= boostAmount) {
        updated[engine][exchange] += boostAmount;
        reserve -= boostAmount;
      }
    });
  });

  return {
    allocation: updated,
    reserve,
  };
}

/* ===========================================
   PERFORMANCE ROTATION
=========================================== */

export function rotateCapitalByPerformance({
  allocation,
  performanceStats,
  shiftPct = 0.05, // 5% shift
}) {
  const updated = JSON.parse(JSON.stringify(allocation));

  const scalpPnL = performanceStats.scalp.pnl;
  const sessionPnL = performanceStats.session.pnl;

  if (scalpPnL === sessionPnL) {
    return updated;
  }

  const winner = scalpPnL > sessionPnL ? "scalp" : "session";
  const loser = winner === "scalp" ? "session" : "scalp";

  Object.keys(updated[winner]).forEach((exchange) => {
    const loserCapital = updated[loser][exchange];
    const shiftAmount = loserCapital * shiftPct;

    if (loserCapital > shiftAmount) {
      updated[loser][exchange] -= shiftAmount;
      updated[winner][exchange] += shiftAmount;
    }
  });

  return updated;
}
