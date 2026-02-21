/* =========================================================
   AUTOSHIELD FRONTEND API LAYER — EXECUTIVE BUILD
   Stable • No Infinite Refresh • Executive Intelligence Ready
   + Subscriber Growth Integrated
   + Refund / Dispute Timeline Integrated
   + Executive Risk + Overlay + Predictive Churn Integrated
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

/* ================= HELPERS ================= */

function joinUrl(base, path) {
  const cleanBase = String(base || "").replace(/\/+$/, "");
  const cleanPath = String(path || "").startsWith("/")
    ? path
    : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

function getActiveCompanyId() {
  try {
    const raw = localStorage.getItem("as_active_company");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id || null;
  } catch {
    return null;
  }
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

/* =========================================================
   CORE REQUEST
========================================================= */

async function req(
  path,
  { method = "GET", body, auth = true, headers: extraHeaders = {} } = {}
) {
  if (!API_BASE) throw new Error("API base URL not configured");

  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const activeCompanyId = getActiveCompanyId();
  if (activeCompanyId) headers["X-Company-Id"] = activeCompanyId;

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
   API SURFACE
========================================================= */

export const api = {
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

  resetPassword: (email, newPassword) =>
    req("/api/auth/reset-password", {
      method: "POST",
      body: { email, newPassword },
      auth: false,
    }),

  /* ================= USER ================= */

  meNotifications: () => req("/api/me/notifications"),
  markMyNotificationRead: (id) =>
    req(`/api/me/notifications/${id}/read`, { method: "POST" }),

  /* ================= AUTOPROTECT ================= */

  autoprotecStatus: () => req("/api/autoprotect/status"),
  autoprotecEnable: () => req("/api/autoprotect/enable", { method: "POST" }),
  autoprotecDisable: () => req("/api/autoprotect/disable", { method: "POST" }),
  autoprotecCreateProject: (payload) =>
    req("/api/autoprotect/project", { method: "POST", body: payload }),

  /* ================= ADMIN EXECUTIVE ================= */

  adminMetrics: () => req("/api/admin/metrics"),

  adminComplianceReport: () => req("/api/admin/compliance/report"),

  adminComplianceHistory: (limit = 20) =>
    req(`/api/admin/compliance/history?limit=${encodeURIComponent(limit)}`),

  adminSubscriberGrowth: () => req("/api/admin/subscriber-growth"),

  adminRefundDisputeTimeline: () => req("/api/admin/refund-dispute-timeline"),

  // ✅ NEW (3 layers)
  adminExecutiveRisk: () => req("/api/admin/executive-risk"),
  adminRevenueRefundOverlay: (days = 90) =>
    req(`/api/admin/revenue-refund-overlay?days=${encodeURIComponent(days)}`),
  adminPredictiveChurn: () => req("/api/admin/predictive-churn"),

  adminUsers: () => req("/api/admin/users"),
  adminCompanies: () => req("/api/admin/companies"),
  adminNotifications: () => req("/api/admin/notifications"),

  /* ================= MANAGER ================= */

  managerOverview: () => req("/api/manager/overview"),
  managerUsers: () => req("/api/manager/users"),
  managerCompanies: () => req("/api/manager/companies"),
  managerAudit: (limit = 200) =>
    req(`/api/manager/audit?limit=${encodeURIComponent(limit)}`),

  /* ================= SECURITY ================= */

  postureSummary: () => req("/api/security/posture-summary"),
  postureChecks: () => req("/api/security/posture-checks"),
  vulnerabilities: () => req("/api/security/vulnerabilities"),
  compliance: () => req("/api/security/compliance"),
  policies: () => req("/api/security/policies"),
  reports: () => req("/api/security/reports"),
  assets: () => req("/api/security/assets"),

  /* ================= INCIDENTS ================= */

  incidents: () => req("/api/incidents"),
  createIncident: (payload) =>
    req("/api/incidents", { method: "POST", body: payload }),

  /* ================= AI ================= */

  aiChat: (message, context) =>
    req("/api/ai/chat", { method: "POST", body: { message, context } }),

  /* ================= HEALTH ================= */

  warmup: () =>
    fetch(joinUrl(API_BASE, "/health"), {
      method: "GET",
      credentials: "include",
    }).catch(() => null),
};
