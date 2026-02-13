// CapitalAllocator.js
// Institutional Capital Allocation + Rotation

/* =========================================================
   INITIAL ALLOCATION
========================================================= */

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

/* =========================================================
   TOTAL CAPITAL
========================================================= */

export function calculateTotalCapital(allocation, reserve) {
  let total = reserve;

  Object.values(allocation).forEach((engine) => {
    Object.values(engine).forEach((amount) => {
      total += amount;
    });
  });

  return total;
}

/* =========================================================
   FLOOR REBALANCE
========================================================= */

export function rebalanceCapital({
  allocation,
  reserve,
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

/* =========================================================
   PERFORMANCE ROTATION (NEW)
   Moves small % toward better performing engines
========================================================= */

export function rotateCapitalByPerformance({
  allocation,
  performanceStats,
  rotationPct = 0.05, // 5% shift
}) {
  const updated = JSON.parse(JSON.stringify(allocation));

  const engines = Object.keys(updated);

  if (!engines.length) return allocation;

  // Calculate simple score per engine
  const scores = {};

  engines.forEach((engine) => {
    const stats = performanceStats?.[engine];
    if (!stats || !stats.total) {
      scores[engine] = 0;
      return;
    }

    const winRate =
      stats.total > 0 ? stats.wins / stats.total : 0;

    scores[engine] = winRate;
  });

  const bestEngine = engines.reduce((a, b) =>
    scores[a] > scores[b] ? a : b
  );

  const worstEngine = engines.reduce((a, b) =>
    scores[a] < scores[b] ? a : b
  );

  if (bestEngine === worstEngine) return allocation;

  Object.keys(updated[worstEngine]).forEach((exchange) => {
    const amount = updated[worstEngine][exchange];
    const shift = amount * rotationPct;

    updated[worstEngine][exchange] -= shift;
    updated[bestEngine][exchange] += shift;
  });

  return updated;
}
