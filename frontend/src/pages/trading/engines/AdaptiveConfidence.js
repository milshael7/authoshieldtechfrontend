// AdaptiveConfidence.js
// Self-adjusting confidence model

export function adjustConfidence({
  baseConfidence,
  wins,
  losses,
  drawdownPct,
}) {
  const total = wins + losses;

  if (total < 10) {
    return baseConfidence; // not enough data
  }

  const winRate = wins / total;

  let adjusted = baseConfidence;

  // Reward good performance
  if (winRate > 0.6) adjusted += 0.05;
  if (winRate > 0.7) adjusted += 0.07;

  // Penalize poor performance
  if (winRate < 0.5) adjusted -= 0.05;
  if (winRate < 0.4) adjusted -= 0.1;

  // Drawdown pressure control
  if (drawdownPct > 10) adjusted -= 0.05;
  if (drawdownPct > 20) adjusted -= 0.1;

  // Clamp between 0.45 and 0.85
  return Math.max(0.45, Math.min(0.85, adjusted));
}
