const paperTrader = require("./paperTrader");

async function callOpenAI({ messages, context }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "Missing OPENAI_API_KEY on backend (Render env var)."
    };
  }

  const model = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

  const system =
    (process.env.AI_SYSTEM_PROMPT && process.env.AI_SYSTEM_PROMPT.trim()) ||
    `You are AutoProtect AI, a calm trading tutor and risk-first assistant.
- You MUST explain in plain English.
- You MUST not claim guaranteed profits.
- Default to PAPER mode unless user explicitly says they want LIVE.
- If asked to trade LIVE, remind them to confirm risk limits and start small.
- Use the provided context (paper status, symbol, last price, mode).
- Keep answers short and direct.`;

  // Build a compact context block
  const paper = paperTrader?.snapshot ? paperTrader.snapshot() : null;

  const ctx = {
    symbol: context?.symbol || null,
    mode: context?.mode || null,
    lastPrice: context?.lastPrice || null,
    paper
  };

  const inputMessages = [
    { role: "system", content: system + "\n\nContext:\n" + JSON.stringify(ctx, null, 2) },
    ...(Array.isArray(messages) ? messages : [])
  ];

  // Using widely-supported Chat Completions endpoint
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: inputMessages
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, error: `OpenAI error ${res.status}: ${text || "no body"}` };
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "";
  return { ok: true, content };
}

module.exports = { callOpenAI };
