/* =========================================================
   AUTOSHIELD FRONTEND API LAYER — FULL PRODUCTION BUILD
   Hardened + Backward Compatible + Report Safe
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
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

/* ================= CORE HELPERS ================= */

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
  } catch (err) {
    if (err?.name === "AbortError") throw new Error("Request timeout");
    throw err;
  } finally {
    clearTimeout(id);
  }
}

async function req(path, { method = "GET", body, auth = true } = {}) {
  if (!API_BASE) throw new Error("API base URL not configured");

  const headers = { "Content-Type": "application/json" };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetchWithTimeout(joinUrl(API_BASE, path), {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {}

  if (res.status === 401 && auth) {
    clearToken();
    clearUser();
    throw new Error("Session expired");
  }

  if (!res.ok) {
    throw new Error(
      data?.error || data?.message || `Request failed (${res.status})`
    );
  }

  return data;
}

/* =========================================================
   FULL API OBJECT
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

  adminCompanies: () => req("/api/admin/companies"),
  adminCreateCompany: (payload) =>
    req("/api/admin/companies", { method: "POST", body: payload }),

  adminUsers: () => req("/api/admin/users"),
  adminNotifications: () => req("/api/admin/notifications"),

  adminRotateUserId: (id) =>
    req(`/api/admin/users/${id}/rotate-id`, { method: "POST" }),

  adminUpdateSubscription: (id, payload) =>
    req(`/api/admin/users/${id}/subscription`, {
      method: "PATCH",
      body: payload,
    }),

  adminForceCompleteScan: (scanId) =>
    req(`/api/admin/scan/${scanId}/force-complete`, {
      method: "POST",
    }),

  adminCancelScan: (scanId) =>
    req(`/api/admin/scan/${scanId}/cancel`, {
      method: "POST",
    }),

  adminOverrideScanRisk: (scanId, riskScore) =>
    req(`/api/admin/scan/${scanId}/override-risk`, {
      method: "POST",
      body: { riskScore },
    }),

  /* ================= MANAGER ================= */

  managerUsers: () => req("/api/manager/users"),
  managerNotifications: () => req("/api/manager/notifications"),
  managerOverview: () => req("/api/manager/overview"),
  managerAudit: () => req("/api/manager/audit"),

  /* ================= COMPANY ================= */

  companyMe: () => req("/api/company/me"),
  companyNotifications: () => req("/api/company/notifications"),
  companyMembers: () => req("/api/company/members"),

  companyAddMember: (userId) =>
    req("/api/company/members", {
      method: "POST",
      body: { userId },
    }),

  companyRemoveMember: (userId) =>
    req(`/api/company/members/${userId}`, {
      method: "DELETE",
    }),

  companyMarkRead: (id) =>
    req(`/api/company/notifications/${id}/read`, {
      method: "POST",
    }),

  /* ================= SECURITY ================= */

  postureSummary: () => req("/api/security/posture-summary"),
  postureChecks: () => req("/api/security/posture-checks"),
  postureRecent: (limit = 20) =>
    req(`/api/security/posture-recent?limit=${limit}`),

  vulnerabilities: () => req("/api/security/vulnerabilities"),

  securityEvents: (limit = 50) =>
    req(`/api/security/events?limit=${limit}`),

  /* Backward compatibility */
  threatFeed: (limit = 50) =>
    req(`/api/security/events?limit=${limit}`),

  incidents: () => req("/api/incidents"),
  createIncident: (payload) =>
    req("/api/incidents", { method: "POST", body: payload }),

  /* ================= REPORTING (FIXED) ================= */

  reportSummary: () =>
    req("/api/reports/summary"),

  reportExport: () =>
    req("/api/reports/export"),

  /* ================= AUTOPROTECT ================= */

  autoprotectStatus: () => req("/api/autoprotect/status"),
  autoprotectEnable: () =>
    req("/api/autoprotect/enable", { method: "POST" }),
  autoprotectDisable: () =>
    req("/api/autoprotect/disable", { method: "POST" }),

  /* ================= ASSETS ================= */

  assets: () => req("/api/assets"),

  /* ================= BILLING ================= */

  billingStatus: () => req("/api/billing/status"),
  createCheckout: () =>
    req("/api/billing/checkout", { method: "POST" }),

  /* ================= TRADING ================= */

  tradingSnapshot: () =>
    req("/api/trading/dashboard/snapshot"),

  placeOrder: (payload) =>
    req("/api/trading/order", { method: "POST", body: payload }),
};

export { api, req };
