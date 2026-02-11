// CapitalAllocator.js
// Multi-exchange capital segmentation + rebalance logic

export class CapitalAllocator {
  constructor(initial = {}) {
    this.exchanges = {
      coinbase: initial.coinbase || 40000,
      kraken: initial.kraken || 35000,
      reserve: initial.reserve || 25000,
    };

    this.floor = 5000; // minimum per exchange
  }

  getTotal() {
    return Object.values(this.exchanges).reduce(
      (a, b) => a + b,
      0
    );
  }

  getBalance(exchange) {
    return this.exchanges[exchange] || 0;
  }

  applyPnL(exchange, pnl) {
    this.exchanges[exchange] += pnl;
  }

  rebalance() {
    const keys = Object.keys(this.exchanges);

    for (let ex of keys) {
      if (this.exchanges[ex] < this.floor) {
        const needed = this.floor - this.exchanges[ex];

        const donor = keys.find(
          (k) => this.exchanges[k] > this.floor * 2
        );

        if (donor) {
          this.exchanges[donor] -= needed;
          this.exchanges[ex] += needed;
        }
      }
    }
  }

  snapshot() {
    return {
      ...this.exchanges,
      total: this.getTotal(),
    };
  }
}
