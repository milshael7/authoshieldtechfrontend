import { PaperExchange } from "./PaperExchange";
import { CoinbaseExchange } from "./CoinbaseExchange";
import { KrakenExchange } from "./KrakenExchange";
import { keyVault } from "../KeyVault";

export class ExchangeManager {
  constructor({ mode = "paper" }) {
    this.mode = mode;

    this.exchanges = {
      paper: new PaperExchange(),
      coinbase: new CoinbaseExchange(),
      kraken: new KrakenExchange(),
    };
  }

  setMode(mode) {
    this.mode = mode;
  }

  getExchange(name) {
    return this.exchanges[name];
  }

  async executeOrder({
    exchange,
    symbol,
    side,
    size,
  }) {
    /* ================= PAPER MODE ================= */

    if (this.mode === "paper") {
      const paper = this.getExchange("paper");

      const result = await paper.placeOrder({
        symbol,
        side,
        size,
      });

      return {
        ...result,
        executionMode: "paper",
      };
    }

    /* ================= LIVE MODE ================= */

    // Validate key
    const key = keyVault.getKey(exchange);

    if (!key) {
      throw new Error(
        `Exchange ${exchange} not enabled`
      );
    }

    const ex = this.getExchange(exchange);

    const result = await ex.placeOrder({
      symbol,
      side,
      size,
      apiKey: key.apiKey,
      secret: key.secret,
    });

    return {
      ...result,
      executionMode: "live",
      exchange,
    };
  }
}
