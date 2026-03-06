// KeyVault.js
// Secure Exchange Credential Manager (Frontend Safe)

import { getToken } from "../lib/api.js";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

class KeyVault {

  constructor() {
    this.exchanges = [];
  }

  /* ================= LOAD FROM SERVER ================= */

  async load() {

    try {

      const res = await fetch(`${API_BASE}/api/exchange/keys`, {
        headers: this.auth()
      });

      const data = await res.json();

      if (data?.ok) {
        this.exchanges = data.keys || [];
      }

    } catch {}

    return this.exchanges;
  }

  /* ================= ADD KEY ================= */

  async addKey(exchange, { apiKey, secret }) {

    if (!exchange || !apiKey || !secret) {
      throw new Error("Invalid key payload");
    }

    const res = await fetch(`${API_BASE}/api/exchange/keys`, {

      method: "POST",

      headers: {
        ...this.auth(),
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        exchange,
        apiKey,
        secret
      })

    });

    const data = await res.json();

    if (!data?.ok) {
      throw new Error("Failed to save key");
    }

    await this.load();

    return true;

  }

  /* ================= REMOVE KEY ================= */

  async removeKey(exchange) {

    const res = await fetch(
      `${API_BASE}/api/exchange/keys/${exchange}`,
      {
        method: "DELETE",
        headers: this.auth()
      }
    );

    const data = await res.json();

    if (!data?.ok) return false;

    await this.load();

    return true;

  }

  /* ================= ENABLE / DISABLE ================= */

  async setEnabled(exchange, state) {

    const res = await fetch(
      `${API_BASE}/api/exchange/keys/${exchange}/toggle`,
      {

        method: "POST",

        headers: {
          ...this.auth(),
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          enabled: !!state
        })

      }
    );

    const data = await res.json();

    if (!data?.ok) return false;

    await this.load();

    return true;

  }

  /* ================= LIST ================= */

  listExchanges() {
    return this.exchanges || [];
  }

  /* ================= AUTH ================= */

  auth() {

    const token = getToken();

    return token
      ? { Authorization: `Bearer ${token}` }
      : {};

  }

}

export const keyVault = new KeyVault();
