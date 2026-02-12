// ExchangeManager.js
// Hardened Institutional Exchange Execution Layer

import { PaperExchange } from "./PaperExchange";
import { CoinbaseExchange } from "./CoinbaseExchange";
import { KrakenExchange } from "./KrakenExchange";

export class ExchangeManager {
  constructor({ mode = "paper" }) {
    this.mode = mode;
    this.cooldownMs = 3000; // 3 second execution lock
    this.lastExecution = 0;
    this.killSwitch = false;

    this.exchanges = {
      paper: new PaperExchange(),
      coinbase: new CoinbaseExchange(),
      kraken: new KrakenExchange(),
    };
  }

  /* ================= KILL SWITCH ================= */

  enableKillSwitch() {
    this.killSwitch = true;
  }

  disableKillSwitch() {
    this.killSwitch = false;
  }

  /* ================= EXCHANGE SELECT ================= */

  getExchange(name) {
    return this.exchanges[name];
  }

  /* ================= SAFE EXECUTION ================= */

  async executeOrder({
    exchange,
    symbol,
    side,
    size,
  }) {
    if (this.killSwitch) {
      throw new Error("Kill switch active. Trading halted.");
    }

    const now = Date.now();

    if (now - this.lastExecution < this.cooldownMs) {
      throw new Error("Execution cooldown active.");
    }

    this.lastExecution = now;

    const ex = this.getExchange(
      this.mode === "paper" ? "paper" : exchange
    );

    if (!ex) {
      throw new Error("Exchange not available.");
    }

    const orderId = `${symbol}-${Date.now()}`;

    const result = await ex.placeOrder({
      symbol,
      side,
      size,
      clientOrderId: orderId,
    });

    return {
      ...result,
      metadata: {
        exchange: this.mode === "paper" ? "paper" : exchange,
        orderId,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
