/* =========================================================
   AUTOSHIELD FRONTEND API LAYER — PRODUCTION SAFE v2
   Single Auth Path • Token Stable • Drift Safe • Refresh Aligned
========================================================= */

const API_BASE = import.meta.env.VITE_API_BASE?.trim();

if (!API_BASE) {
  console.error("❌ VITE_API_BASE is missing");
}

const TOKEN_KEY = "as_token";
const USER_KEY = "as_user";
const REQUEST_TIMEOUT = 20000;

/* ================= STORAGE ================= */

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

/* ================= CORE ================= */

function joinUrl(base, path) {
  const cleanBase = String(base || "").replace(/\/+$/, "");
  const cleanPath = String(path || "").startsWith("/")
    ? path
    : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

async function fetchWithTimeout(url, options = {}, ms = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function req(
  path,
  {
    method = "GET",
    body,
    auth = true,
    withCredentials = false,
  } = {}
) {
  if (!API_BASE) throw new Error("API base URL not configured");

  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetchWithTimeout(joinUrl(API_BASE, path), {
    method,
    headers,
    ...(withCredentials ? { credentials: "include" } : {}),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {}

  if (res.status === 401 && auth) {
    clearToken();
    clearUser();
    throw new Error(data?.error || "Session expired");
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }

  return data;
}

/* =========================================================
   API OBJECT
========================================================= */

const api = {
  /* ================= AUTH ================= */

  login: (email, password) =>
    req("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),

  signup: (payload) =>
    req("/api/auth/signup", {
      method: "POST",
      body: payload,
      auth: false,
    }),

  refresh: () =>
    req("/api/auth/refresh", {
      method: "POST",
    }),

  /* ================= ADMIN ================= */

  adminMetrics: () => req("/api/admin/metrics"),
  adminExecutiveRisk: () => req("/api/admin/executive-risk"),
  adminPredictiveChurn: () => req("/api/admin/predictive-churn"),
  adminComplianceReport: () => req("/api/admin/compliance/report"),
  adminUsers: () => req("/api/admin/users"),
  adminNotifications: () => req("/api/admin/notifications"),
  adminCompanies: () => req("/api/admin/companies"),
  adminCreateCompany: (payload) =>
    req("/api/admin/companies", {
      method: "POST",
      body: payload,
    }),

  /* ================= SECURITY ================= */

  postureSummary: () => req("/api/security/posture-summary"),
  postureChecks: () => req("/api/security/posture-checks"),
  postureRecent: (limit = 20) =>
    req(`/api/security/posture-recent?limit=${limit}`),
  vulnerabilities: () => req("/api/security/vulnerabilities"),
  securityEvents: (limit = 50) =>
    req(`/api/security/events?limit=${limit}`),

  /* ================= INCIDENTS ================= */

  incidents: () => req("/api/incidents"),
  createIncident: (payload) =>
    req("/api/incidents", {
      method: "POST",
      body: payload,
    }),

  /* ================= REPORTING ================= */

  reportSummary: () => req("/api/reports/summary"),
  reportExport: () => req("/api/reports/export"),

  /* ================= TRADING ================= */

  tradingSymbols: () =>
    req("/api/trading/symbols", { auth: false }),

  tradingDashboard: () =>
    req("/api/trading/dashboard/snapshot"),

  tradingPaperSnapshot: () =>
    req("/api/trading/paper/snapshot"),

  tradingLiveSnapshot: () =>
    req("/api/trading/live/snapshot"),

  tradingRiskSnapshot: () =>
    req("/api/trading/risk/snapshot"),

  tradingPortfolioSnapshot: () =>
    req("/api/trading/portfolio/snapshot"),

  tradingAISnapshot: () =>
    req("/api/trading/ai/snapshot"),

  tradingRouterHealth: () =>
    req("/api/trading/router/health"),
};

export { api, req };
