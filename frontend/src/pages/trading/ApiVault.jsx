import React, { useState } from "react";

export default function ApiVault() {
  const [exchange, setExchange] = useState("binance");
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [accounts, setAccounts] = useState([]);

  function addAccount() {
    if (!apiKey || !secretKey) return;

    const newAccount = {
      id: Date.now(),
      exchange,
      status: "connected", // simulated
    };

    setAccounts((prev) => [...prev, newAccount]);
    setApiKey("");
    setSecretKey("");
  }

  function removeAccount(id) {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Exchange API Vault</h2>
            <small>Secure Exchange Connections</small>
          </div>
        </div>

        <div className="ctrl">
          <label>
            Exchange
            <select
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
            >
              <option value="binance">Binance</option>
              <option value="coinbase">Coinbase</option>
              <option value="kraken">Kraken</option>
              <option value="bybit">Bybit</option>
            </select>
          </label>

          <label>
            API Key
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </label>

          <label>
            Secret Key
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
          </label>
        </div>

        <div className="actions">
          <button className="btn ok" onClick={addAccount}>
            Connect Exchange
          </button>
        </div>
      </section>

      <aside className="postureCard">
        <h3>Connected Accounts</h3>

        {accounts.length === 0 && (
          <p className="muted">No exchanges connected.</p>
        )}

        {accounts.map((acc) => (
          <div key={acc.id} className="stats">
            <div>
              <b>{acc.exchange.toUpperCase()}</b>
            </div>
            <div>
              <span className="badge ok">
                {acc.status.toUpperCase()}
              </span>
            </div>
            <div>
              <button
                className="btn warn"
                onClick={() => removeAccount(acc.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}
