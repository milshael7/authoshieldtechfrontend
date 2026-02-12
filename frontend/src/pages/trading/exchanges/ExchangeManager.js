// ExchangeManager.js
// Smart Multi-Exchange Routing Layer

import { PaperExchange } from "./PaperExchange";
import { CoinbaseExchange } from "./CoinbaseExchange";
import { KrakenExchange } from "./KrakenExchange";

export class ExchangeManager {
  constructor({ mode = "paper" }) {
    this.mode = mode;

    this.exchanges = {
      paper: new PaperExchange(),
      coinbase: new CoinbaseExchange(),
      kraken: new KrakenExchange(),
    };

    this.exchangeHealth = {
      coinbase: 1,
      kraken: 1,
    };
  }

  /* ================= HEALTH SCORING ================= */

  updateHealth(exchange, score) {
    this.exchangeHealth[exchange] = score;
  }

  getBestExchange() {
    const entries = Object.entries(this.exchangeHealth);
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  /* ================= SMART ROUTE ================= */

  async executeOrder({
    preferredExchange,
    symbol,
    side,
    size,
  }) {
    if (this.mode === "paper") {
      return this.exchanges.paper.placeOrder({
        symbol,
        side,
        size,
      });
    }

    const routeExchange =
      preferredExchange || this.getBestExchange();

    try {
      const result = await this.exchanges[
        routeExchange
      ].placeOrder({
        symbol,
        side,
        size,
      });

      return result;
    } catch (err) {
      // fallback to next best exchange
      const fallback = Object.keys(this.exchangeHealth)
        .filter((ex) => ex !== routeExchange)
        .sort(
          (a, b) =>
            this.exchangeHealth[b] -
            this.exchangeHealth[a]
        )[0];

      if (!fallback) throw err;

      return this.exchanges[fallback].placeOrder({
        symbol,
        side,
        size,
      });
    }
  }
}
