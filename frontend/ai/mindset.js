import { AI } from "../ai";

// before trade
const check = AI.evaluateTradeSetup({
  quality: 0.82,
});

if (!check.allowed) {
  console.log("Trade blocked:", check.reason);
  return;
}

const size = AI.calculatePositionSize({
  equity: 10000,
  stopLossDistance: 25,
});

// after trade
AI.onTradeResult({
  result: "WIN", // or "LOSS"
  symbol: "BTCUSDT",
});
