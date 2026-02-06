// ai/memory.js
// Trade journal + pattern memory (NO emotions)

const MAX_HISTORY = 200;

let trades = [];

export function logTrade(trade) {
  trades.unshift({
    ...trade,
    timestamp: Date.now(),
  });

  if (trades.length > MAX_HISTORY) {
    trades.pop();
  }
}

export function getRecentTrades(limit = 50) {
  return trades.slice(0, limit);
}

export function stats() {
  const wins = trades.filter(t => t.result === "WIN").length;
  const losses = trades.filter(t => t.result === "LOSS").length;

  return {
    total: trades.length,
    wins,
    losses,
    winRate: trades.length
      ? (wins / trades.length) * 100
      : 0,
  };
}

export function detectBadPattern() {
  const last5 = trades.slice(0, 5);
  const losses = last5.filter(t => t.result === "LOSS").length;

  return losses >= 4; // 4 losses in last 5 = pattern failure
}
