/* =========================================================
   AUTOSHIELD FRONTEND API LAYER — MASTER STABLE BUILD
   Unified endpoints + overview compatibility layer
   ========================================================= */

const API_BASE = import.meta.env.VITE_API_BASE?.trim();

if (!API_BASE) {
  console.error("❌ VITE_API_BASE is missing");
}

const TOKEN_KEY = "as_token";
const USER_KEY = "as_user";
const REQUEST_TIMEOUT = 45000;

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

async function fetchWithTimeout(url, options = {}, ms = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

async function req(
  path,
  { method = "GET", body, auth = true, headers: extraHeaders = {} } = {},
  retry = true
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

  if (res.status === 401 && auth && retry && getToken()) {
    try {
      const refreshRes = await fetchWithTimeout(
        joinUrl(API_BASE, "/api/auth/refresh"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          credentials: "include",
        }
      );

      const refreshData = await refreshRes.json().catch(() => ({}));

      if (refreshRes.ok && refreshData.token) {
        setToken(refreshData.token);
        if (refreshData.user) saveUser(refreshData.user);

        return req(path, { method, body, auth, headers: extraHeaders }, false);
      }
    } catch {}

    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      `Request failed (${res.status})`
    );
  }

  return data;
}

/* =========================================================
   API SURFACE
   ========================================================= */

export const api = {

  /* ---------- AUTH ---------- */
  login: (email, password) =>
    req("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),

  resetPassword: (email, newPassword) =>
    req("/api/auth/reset-password", {
      method: "POST",
      body: { email, newPassword },
      auth: false,
    }),

  /* ---------- USER ---------- */
  meNotifications: () => req("/api/me/notifications"),
  markMyNotificationRead: (id) =>
    req(`/api/me/notifications/${id}/read`, { method: "POST" }),

  /* ---------- ADMIN ---------- */
  adminUsers: () => req("/api/admin/users"),
  adminCompanies: () => req("/api/admin/companies"),
  adminNotifications: () => req("/api/admin/notifications"),

  /* ---------- ADMIN TOOL GOVERNANCE ---------- */
  adminCompanyTools: (companyId) =>
    req(`/api/admin/companies/${encodeURIComponent(companyId)}/tools`),

  adminBlockTool: (companyId, toolId) =>
    req(
      `/api/admin/companies/${encodeURIComponent(companyId)}/tools/${encodeURIComponent(toolId)}/block`,
      { method: "POST" }
    ),

  adminUnblockTool: (companyId, toolId) =>
    req(
      `/api/admin/companies/${encodeURIComponent(companyId)}/tools/${encodeURIComponent(toolId)}/unblock`,
      { method: "POST" }
    ),

  /* ---------- MANAGER ---------- */
  managerOverview: () => req("/api/manager/overview"),
  managerUsers: () => req("/api/manager/users"),
  managerCompanies: () => req("/api/manager/companies"),
  managerAudit: (limit = 200) =>
    req(`/api/manager/audit?limit=${encodeURIComponent(limit)}`),

  /* ---------- SECURITY MODULES ---------- */
  vulnerabilities: () => req("/api/security/vulnerabilities"),
  vulnerabilityOverview: () => req("/api/security/vulnerability-overview"),
  vulnerabilityCenter: () => req("/api/security/vulnerability-center"),

  compliance: () => req("/api/security/compliance"),
  complianceOverview: () => req("/api/security/compliance-overview"),

  policies: () => req("/api/security/policies"),
  policiesOverview: () => req("/api/security/policies-overview"),

  reports: () => req("/api/security/reports"),
  reportSummary: () => req("/api/security/report-summary"),

  attackSurfaceOverview: () => req("/api/security/attack-surface"),

  assets: () => req("/api/security/assets"),
  usersOverview: () => req("/api/security/users-overview"),

  postureSummary: () => req("/api/security/posture-summary"),
  postureChecks: () => req("/api/security/posture-checks"),

  /* ---------- INCIDENTS ---------- */
  incidents: () => req("/api/incidents"),
  createIncident: (payload) =>
    req("/api/incidents", { method: "POST", body: payload }),

  /* ---------- THREAT ---------- */
  threatFeed: () => req("/api/threat-feed"),

  /* ---------- AI ---------- */
  aiChat: (message, context) =>
    req("/api/ai/chat", {
      method: "POST",
      body: { message, context },
    }),

  /* ---------- HEALTH ---------- */
  warmup: () =>
    fetch(joinUrl(API_BASE, "/api/health"), {
      method: "GET",
      credentials: "include",
    }).catch(() => null),
};
