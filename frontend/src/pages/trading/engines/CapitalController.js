/**
 * CapitalController
 * Splits master capital between engines
 * Handles rebalancing
 */

export function allocateCapital(total, scalpPct = 50) {
  const scalp = (total * scalpPct) / 100;
  const session = total - scalp;

  return {
    total,
    scalp,
    session,
    scalpPct,
    sessionPct: 100 - scalpPct,
  };
}

export function rebalanceCapital(allocation, newScalpPct) {
  return allocateCapital(allocation.total, newScalpPct);
}
