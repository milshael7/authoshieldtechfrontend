// ai/risk.js
// Responsible for ALL risk decisions (AI is not allowed to override this)

const BASE_RISK_PCT = 0.5;
const MAX_RISK_PCT = 1.5;
const MIN_RISK_PCT = 0.25;

const MAX_CONSECUTIVE_LOSSES = 2;
const COOLDOWN_AFTER = 3;

let state = {
  currentRiskPct: BASE_RISK_PCT,
  losses: 0,
  wins: 0,
  cooldown: false,
};

export function getRiskState() {
  return { ...state };
}

export function onWin() {
  state.wins += 1;
  state.losses = 0;

  if (state.wins >= 3) {
    state.currentRiskPct = Math.min(
      state.currentRiskPct + 0.25,
      MAX_RISK_PCT
    );
    state.wins = 0;
  }
}

export function onLoss() {
  state.losses += 1;
  state.wins = 0;

  if (state.losses === 1) {
    state.currentRiskPct = Math.max(
      state.currentRiskPct * 0.7,
      MIN_RISK_PCT
    );
  }

  if (state.losses >= MAX_CONSECUTIVE_LOSSES) {
    state.currentRiskPct = BASE_RISK_PCT;
  }

  if (state.losses >= COOLDOWN_AFTER) {
    state.cooldown = true;
  }
}

export function resetCooldown() {
  state.cooldown = false;
  state.losses = 0;
  state.wins = 0;
  state.currentRiskPct = BASE_RISK_PCT;
}

export function canTrade() {
  return !state.cooldown;
}

export function calculatePositionSize({
  equity,
  stopLossDistance,
}) {
  const riskAmount = equity * (state.currentRiskPct / 100);
  return riskAmount / stopLossDistance;
}
