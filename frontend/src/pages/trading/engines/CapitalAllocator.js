// CapitalAllocator.js
// Institutional Capital Allocation + Rotation
// Stable export-safe version

/* ================= INITIAL ALLOCATION ================= */

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

/* ================= TOTAL CAPITAL ================= */

export function calculateTotalCapital(allocation = {}, reserve = 0) {
  let total = reserve;

  Object.values(allocation).forEach((engine) => {
    Object.values(engine).forEach((amount) => {
      total += Number(amount) || 0;
    });
  });

  return total;
}

/* ================= FLOOR REBALANCE ================= */

export function rebalanceCapital({
  allocation = {},
  reserve = 0,
  floor = 100,
  boostAmount = 200,
}) {
  const updated = JSON.parse(JSON.stringify(allocation));
  let updatedReserve = reserve;

  Object.keys(updated).forEach((engine) => {
    Object.keys(updated[engine]).forEach((exchange) => {
      if (
        updated[engine][exchange] < floor &&
        updatedReserve >= boostAmount
      ) {
        updated[engine][exchange] += boostAmount;
        updatedReserve -= boostAmount;
      }
    });
  });

  return {
    allocation: updated,
    reserve: updatedReserve,
  };
}

/* ================= PERFORMANCE ROTATION ================= */

export function rotateCapitalByPerformance({
  allocation = {},
  performanceStats = {},
}) {
  const updated = JSON.parse(JSON.stringify(allocation));

  Object.keys(updated).forEach((engine) => {
    const stats = performanceStats[engine];

    if (!stats) return;

    const winRate =
      stats.total && stats.total > 0
        ? stats.wins / stats.total
        : 0.5;

    let multiplier = 1;

    if (winRate > 0.6) multiplier = 1.1;
    if (winRate < 0.4) multiplier = 0.9;

    Object.keys(updated[engine]).forEach((exchange) => {
      updated[engine][exchange] *= multiplier;
    });
  });

  return updated;
}
