/* =========================================================
   AUTOSHIELD FRONTEND API LAYER — ENTERPRISE v10
   SOC READY • ZERO TRUST SAFE • TENANT AWARE
   FULL BACKEND ALIGNMENT
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
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
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
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

/* ================= UTIL ================= */

function joinUrl(base, path) {
  return `${String(base).replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
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

/* ================= TENANT SUPPORT ================= */

function attachTenantHeader(headers) {
  const user = getSavedUser();

  if (user?.companyId) {
    headers["x-company-id"] = user.companyId;
  }

  return headers;
}

/* ================= CORE REQUEST ================= */

export async function req(path, { method = "GET", body, auth = true } = {}) {
  if (!API_BASE) throw new Error("API base URL not configured");

  const headers = attachTenantHeader({
    "Content-Type": "application/json",
  });

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
  } catch (err) {
    console.warn("API network error:", path);
    return {};
  }

  let data = {};

  try {
    data = await res.json();
  } catch {}

  /* ================= SESSION RECOVERY ================= */

  if (res.status === 401) {
    console.warn("Session expired");

    clearToken();
    clearUser();

    window.location.href = "/login";

    return {};
  }

  /* ================= SAFE 404 ================= */

  if (res.status === 404) {
    console.warn("Endpoint not found:", path);
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

  /* GENERIC HELPERS */

  get: (path) => req(path, { method: "GET" }),
  post: (path, body) => req(path, { method: "POST", body }),
  patch: (path, body) => req(path, { method: "PATCH", body }),
  del: (path) => req(path, { method: "DELETE" }),

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

  /* ================= USERS ================= */

  listUsers: () =>
    req("/api/users"),

  getUser: (id) =>
    req(`/api/users/${id}`),

  createUser: (payload) =>
    req("/api/users", {
      method: "POST",
      body: payload,
    }),

  updateUser: (id, payload) =>
    req(`/api/users/${id}`, {
      method: "PATCH",
      body: payload,
    }),

  /* ================= COMPANIES ================= */

  listCompanies: () =>
    req("/api/company"),

  getCompany: (id) =>
    req(`/api/company/${id}`),

  createCompany: (payload) =>
    req("/api/company", {
      method: "POST",
      body: payload,
    }),

  updateCompany: (id, payload) =>
    req(`/api/company/${id}`, {
      method: "PATCH",
      body: payload,
    }),

  /* ================= INCIDENTS ================= */

  incidents: () =>
    req("/api/incidents"),

  createIncident: (payload) =>
    req("/api/incidents", {
      method: "POST",
      body: payload,
    }),

  /* ================= SECURITY ================= */

  postureSummary: () =>
    req("/api/security/posture-summary"),

  securityEvents: () =>
    req("/api/security/events"),

  vulnerabilities: () =>
    req("/api/security/vulnerabilities"),

  /* ================= ADMIN ================= */

  adminPlatformHealth: () =>
    req("/api/admin/platform-health"),

  adminAuditLogs: () =>
    req("/api/admin/audit"),

  adminThreatFeed: () =>
    req("/api/admin/threat-feed"),

  /* ================= AUTOPROTECT ================= */

  autoProtectStatus: () =>
    req("/api/autoprotect/status"),

  autoProtectScan: () =>
    req("/api/autoprotect/scan"),

  /* ================= TOOLS ================= */

  toolCatalog: () =>
    req("/api/tools/catalog"),

  requestTool: (toolId) =>
    req(`/api/tools/request/${toolId}`, {
      method: "POST",
    }),

  /* ================= ENTITLEMENTS ================= */

  myEntitlements: () =>
    req("/api/entitlements/me"),

  billingStatus: () =>
    req("/api/billing/status"),

};

export { api };
