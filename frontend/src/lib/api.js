/* =========================================================
   AUTOSHIELD FRONTEND API LAYER — ENTERPRISE v6 (SYNCED)
========================================================= */

const API_BASE = import.meta.env.VITE_API_BASE?.trim();
if (!API_BASE) console.error("❌ VITE_API_BASE is missing");

const TOKEN_KEY = "as_token";
const USER_KEY = "as_user";
const REQUEST_TIMEOUT = 20000;

/* ================= STORAGE ================= */

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  token
    ? localStorage.setItem(TOKEN_KEY, token)
    : localStorage.removeItem(TOKEN_KEY);
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
  user
    ? localStorage.setItem(USER_KEY, JSON.stringify(user))
    : localStorage.removeItem(USER_KEY);
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

/* ================= UTIL ================= */

function joinUrl(base, path) {
  return `${String(base).replace(/\/+$/, "")}${
    path.startsWith("/") ? path : `/${path}`
  }`;
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

/* ================= CORE REQUEST ================= */

async function req(path, { method = "GET", body, auth = true } = {}) {
  if (!API_BASE) throw new Error("API base URL not configured");

  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetchWithTimeout(joinUrl(API_BASE, path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    return {};
  }

  let data = {};
  try {
    data = await res.json();
  } catch {}

  if (res.status === 401) {
    clearToken();
    clearUser();
    return {};
  }

  if (!res.ok) {
    console.warn("API warning:", path, res.status);
    return {};
  }

  return data;
}

/* ================= API OBJECT ================= */

const api = {
  /* AUTH */
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

  refresh: () => req("/api/auth/refresh", { method: "POST" }),

  /* INCIDENTS */
  incidents: () => req("/api/incidents"),

  /* SECURITY */
  postureSummary: () => req("/api/security/posture-summary"),
  compliance: () => req("/api/security/compliance"),
  vulnerabilities: () => req("/api/security/vulnerabilities"),
  securityEvents: () => req("/api/security/events"),
  sessionMonitor: () => req("/api/security/sessions"),

  /* TOOLS */
  toolCatalog: () => req("/api/tools/catalog"),
  requestTool: (toolId) =>
    req(`/api/tools/request/${toolId}`, { method: "POST" }),

  /* ENTITLEMENTS */
  myEntitlements: () => req("/api/entitlements/me"),

  /* ADMIN */
  adminMetrics: () => req("/api/admin/metrics"),
  adminExecutiveRisk: () => req("/api/admin/executive-risk"),
  adminCompliance: () => req("/api/admin/compliance"),
  adminAuditPreview: () => req("/api/admin/audit-preview"),
  adminAuditExplorer: (query = "") =>
    req(`/api/admin/audit${query ? `?${query}` : ""}`),
  adminPlatformHealth: () => req("/api/admin/platform-health"),

  /* USERS */
  listUsers: () => req("/api/users"),
  getUser: (id) => req(`/api/users/${id}`),
};

export { api, req };
