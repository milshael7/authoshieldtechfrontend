import { PaperExchange } from "./PaperExchange";
import { CoinbaseExchange } from "./CoinbaseExchange";
import { KrakenExchange } from "./KrakenExchange";
import { evaluateConfidence } from "./ConfidenceEngine";

export class ExchangeManager {
  constructor({
    mode = "paper",
    humanOverride = false,
    humanMultiplier = 1,
  }) {
    this.mode = mode;
    this.humanOverride = humanOverride;
    this.humanMultiplier = humanMultiplier;

    this.exchanges = {
      paper: new PaperExchange(),
      coinbase: new CoinbaseExchange(),
      kraken: new KrakenExchange(),
    };
  }

  setMode(mode) {
    this.mode = mode;
  }

  setHumanOverride(enabled, multiplier = 1) {
    this.humanOverride = enabled;
    this.humanMultiplier = multiplier;
  }

  getExchange(name) {
    return this.exchanges[name];
  }

  /* ==================================================
     EXECUTION LAYER
     ================================================== */

  async executeOrder({
    exchange = "coinbase",
    symbol,
    side,
    size,
    engineType,
  }) {
    /* ================= CONFIDENCE CHECK ================= */

    const confidence = evaluateConfidence(engineType);

    if (!confidence.approved && !this.humanOverride) {
      return {
        blocked: true,
        reason: confidence.reason || "AI confidence too low",
        confidenceScore: confidence.score,
      };
    }

    const effectiveSize =
      size *
      confidence.modifier *
      (this.humanOverride ? this.humanMultiplier : 1);

    /* ================= EXCHANGE ROUTING ================= */

    const selectedExchange =
      this.mode === "paper" ? "paper" : exchange;

    const ex = this.getExchange(selectedExchange);

    if (!ex) {
      return {
        blocked: true,
        reason: "Exchange not available",
      };
    }

    /* ================= PLACE ORDER ================= */

    const result = await ex.placeOrder({
      symbol,
      side,
      size: effectiveSize,
    });

    return {
      ...result,
      confidenceScore: confidence.score,
      modifier: confidence.modifier,
      humanOverride: this.humanOverride,
    };
  }
}
