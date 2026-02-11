// OrderLedger.js
// Persistent trade history + performance tracker

const STORAGE_KEY = "quant_order_ledger";

export class OrderLedger {
  constructor() {
    this.ledger = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.ledger));
  }

  record(order) {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...order,
    };

    this.ledger.unshift(entry);
    this.save();
    return entry;
  }

  getAll() {
    return this.ledger;
  }

  getStats() {
    let wins = 0;
    let losses = 0;
    let pnl = 0;

    for (const trade of this.ledger) {
      if (trade.pnl > 0) wins++;
      if (trade.pnl < 0) losses++;
      pnl += trade.pnl || 0;
    }

    const total = wins + losses;
    const winRate = total ? (wins / total) * 100 : 0;

    return {
      total,
      wins,
      losses,
      pnl,
      winRate: winRate.toFixed(2),
    };
  }

  clear() {
    this.ledger = [];
    this.save();
  }
}
