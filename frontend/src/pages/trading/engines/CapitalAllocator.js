// CapitalAllocator.js
// Institutional Capital Distribution + Intelligent Rebalancing (UPGRADED)

/* ============================================================
   INITIAL CAPITAL DISTRIBUTION
   - Reserve protected
   - Even distribution across engines + exchanges
   ============================================================ */

export function allocateCapital({
  totalCapital,
  engines = ["scalp", "session"],
  exchanges = ["coinbase", "kraken"],
  reservePct = 0.2, // 20% capital reserve
}) {
  const reserve = totalCapital * reservePct;
  const tradable = totalCapital - reserve;

  const perEngine = tradable / engines.length;

  const allocation = {};

  engines.forEach((engine) => {
    allocation[engine] = {};
    const perExchange = perEngine / exchanges.length;

    exchanges.forEach((exchange) => {
      allocation[engine][exchange] = perExchange;
    });
  });

  return {
    reserve,
    allocation,
  };
}

/* ============================================================
   SMART REBALANCE SYSTEM
   - Protects reserve
   - Prevents zero-engine death
   - Transfers capital from strongest engine
   - Never inflates capital artificially
   ============================================================ */

export function rebalanceCapital({
  allocation,
  reserve = 0,
  floor = 100,               // minimum engine capital
  transferPct = 0.05,        // 5% transfer from strongest engine
}) {
  const updated = deepClone(allocation);

  // Calculate total per engine
  const engineTotals = {};

  Object.keys(updated).forEach((engine) => {
    engineTotals[engine] = Object.values(updated[engine]).reduce(
      (a, b) => a + b,
      0
    );
  });

  const engines = Object.keys(engineTotals);

  const weakest = engines.reduce((a, b) =>
    engineTotals[a] < engineTotals[b] ? a : b
  );

  const strongest = engines.reduce((a, b) =>
    engineTotals[a] > engineTotals[b] ? a : b
  );

  // If weakest below floor → transfer from strongest
  if (engineTotals[weakest] < floor) {
    const transferAmount = engineTotals[strongest] * transferPct;

    Object.keys(updated[strongest]).forEach((exchange) => {
      updated[strongest][exchange] -=
        transferAmount / Object.keys(updated[strongest]).length;
    });

    Object.keys(updated[weakest]).forEach((exchange) => {
      updated[weakest][exchange] +=
        transferAmount / Object.keys(updated[weakest]).length;
    });
  }

  return {
    allocation: updated,
    reserve,
  };
}

/* ============================================================
   GLOBAL CAPITAL SUMMARY
   ============================================================ */

export function calculateTotalCapital(allocation, reserve = 0) {
  let total = reserve;

  Object.values(allocation).forEach((engine) => {
    total += Object.values(engine).reduce((a, b) => a + b, 0);
  });

  return total;
}

/* ============================================================
   UTIL
   ============================================================ */

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
