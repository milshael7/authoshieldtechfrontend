// Portfolio Allocation Engine (PHASE 7)

export function rebalancePortfolio({
  allocation,
  performance,
  minEngineCapital = 200,
  reserveBufferPct = 0.2,
}) {
  let { scalp, session, total } = allocation;

  const scalpPerf = performance.scalp;
  const sessionPerf = performance.session;

  const scalpScore = engineScore(scalpPerf);
  const sessionScore = engineScore(sessionPerf);

  const combinedScore = scalpScore + sessionScore || 1;

  /* ================= TARGET DISTRIBUTION ================= */

  const scalpTargetRatio = scalpScore / combinedScore;
  const sessionTargetRatio = sessionScore / combinedScore;

  let newScalp = total * scalpTargetRatio;
  let newSession = total * sessionTargetRatio;

  /* ================= FLOOR PROTECTION ================= */

  if (newScalp < minEngineCapital)
    newScalp = minEngineCapital;

  if (newSession < minEngineCapital)
    newSession = minEngineCapital;

  /* ================= RESERVE BUFFER ================= */

  const reserve = total * reserveBufferPct;

  const adjustedTotal = total - reserve;

  const finalScalp =
    (newScalp / (newScalp + newSession)) *
    adjustedTotal;

  const finalSession =
    (newSession / (newScalp + newSession)) *
    adjustedTotal;

  return {
    scalp: finalScalp,
    session: finalSession,
    reserve,
    total: finalScalp + finalSession + reserve,
  };
}

/* ================= ENGINE SCORE MODEL ================= */

function engineScore(perf) {
  const trades = perf.wins + perf.losses;

  if (trades === 0) return 1;

  const winRate = perf.wins / trades;

  const pnlFactor = perf.pnl >= 0 ? 1.1 : 0.9;

  return winRate * pnlFactor + 0.1;
}
