// EngineMemory.js
// Persistent performance memory

const STORAGE_KEY = "as_engine_memory";

function loadMemory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      scalp: [],
      session: [],
    };
  } catch {
    return { scalp: [], session: [] };
  }
}

function saveMemory(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function updateEngineMemory(engineType, tradeData) {
  const memory = loadMemory();
  memory[engineType].push({
    ...tradeData,
    time: Date.now(),
  });

  // Keep last 100 trades only
  memory[engineType] = memory[engineType].slice(-100);

  saveMemory(memory);
}

export function getEngineStats(engineType) {
  const memory = loadMemory();
  const trades = memory[engineType];

  if (!trades.length) {
    return {
      trades: 0,
      winRate: 0,
      drawdown: 0,
      confidence: 50,
    };
  }

  const wins = trades.filter(t => t.isWin).length;
  const losses = trades.length - wins;

  const winRate = (wins / trades.length) * 100;

  const balances = trades.map(t => t.balanceAfter);
  const peak = Math.max(...balances);
  const trough = Math.min(...balances);
  const drawdown = peak > 0
    ? ((peak - trough) / peak) * 100
    : 0;

  const confidence =
    winRate > 60 ? 80 :
    winRate > 55 ? 70 :
    winRate > 50 ? 60 :
    winRate > 45 ? 45 :
    30;

  return {
    trades: trades.length,
    winRate,
    drawdown,
    confidence,
  };
}
