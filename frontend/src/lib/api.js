/* =========================================================
   AUTOSHIELD FRONTEND API LAYER — HARDENED SAFE VERSION
   ========================================================= */

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_BACKEND_URL ||
  ""
).trim();

/* =============================
   SAFE WARNING (NO CRASH)
   ============================= */

if (!API_BASE && import.meta.env.PROD) {
  console.warn("⚠️ No API base URL defined. Running in fallback mode.");
}

const TOKEN_KEY = "as_token";
const USER_KEY = "as_user";
const REQUEST_TIMEOUT = 15000;

/* =============================
   STORAGE
   ============================= */

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const getSavedUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
};

export const saveUser = (u) =>
  localStorage.setItem(USER_KEY, JSON.stringify(u));

export const clearUser = () => localStorage.removeItem(USER_KEY);

/* =============================
   URL HELPER
   ============================= */

function joinUrl(base, path) {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").startsWith("/") ? path : `/${path}`;
  return b ? `${b}${p}` : p;
}

/* =============================
   TIMEOUT WRAPPER
   ============================= */

function withTimeout(promise, ms = REQUEST_TIMEOUT) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), ms)
  );
  return Promise.race([promise, timeout]);
}

/* =============================
   CORE REQUEST WRAPPER (SAFE)
   ============================= */

async function req(
  path,
  { method = "GET", body, auth = true, headers: extraHeaders = {} } = {},
  retry = true
) {
  /* 🚨 If API_BASE missing — DO NOT CRASH */
  if (!API_BASE) {
    console.warn("API_BASE missing — request skipped:", path);
    return {};
  }

  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await withTimeout(
      fetch(joinUrl(API_BASE, path), {
        method,
        headers,
        credentials: "include",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    );

    let data = {};
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    /* ---------- TOKEN REFRESH ---------- */
    if (res.status === 401 && auth && retry) {
      try {
        const refreshRes = await withTimeout(
          fetch(joinUrl(API_BASE, "/api/auth/refresh"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
            credentials: "include",
          })
        );

        let refreshData = {};
        try {
          refreshData = await refreshRes.json();
        } catch {
          refreshData = {};
        }

        if (refreshRes.ok && refreshData.token) {
          setToken(refreshData.token);
          if (refreshData.user) saveUser(refreshData.user);

          return req(
            path,
            { method, body, auth, headers: extraHeaders },
            false
          );
        }
      } catch {
        console.warn("Token refresh failed.");
      }

      clearToken();
      clearUser();
      return {};
    }

    if (!res.ok) {
      console.warn("API error:", res.status, data);
      return {};
    }

    return data;
  } catch (err) {
    console.warn("Network error:", err.message);
    return {};
  }
}

/* =============================
   API SURFACE
   ============================= */

export const api = {
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

  meNotifications: () => req("/api/me/notifications"),
  markMyNotificationRead: (id) =>
    req(`/api/me/notifications/${id}/read`, { method: "POST" }),

  postureSummary: () => req("/api/posture/summary"),
  postureChecks: () => req("/api/posture/checks"),
  postureRecent: (limit = 50) =>
    req(`/api/posture/recent?limit=${encodeURIComponent(limit)}`),

  getAssets: () => req("/api/assets"),
  getThreats: () => req("/api/threats"),
  getIncidents: () => req("/api/incidents"),
  getVulnerabilities: () => req("/api/vulnerabilities"),
  getComplianceControls: () => req("/api/compliance"),
  getPolicies: () => req("/api/policies"),
  getReports: () => req("/api/reports"),

  adminUsers: () => req("/api/admin/users"),
  adminCompanies: () => req("/api/admin/companies"),
  adminNotifications: () => req("/api/admin/notifications"),

  managerOverview: () => req("/api/manager/overview"),
  managerUsers: () => req("/api/manager/users"),
  managerCompanies: () => req("/api/manager/companies"),
  managerAudit: (limit = 200) =>
    req(`/api/manager/audit?limit=${encodeURIComponent(limit)}`),

  companyMe: () => req("/api/company/me"),
  companyNotifications: () => req("/api/company/notifications"),
  companyMarkRead: (id) =>
    req(`/api/company/notifications/${id}/read`, {
      method: "POST",
    }),

  aiChat: (message, context) =>
    req("/api/ai/chat", {
      method: "POST",
      body: { message, context },
    }),
};
