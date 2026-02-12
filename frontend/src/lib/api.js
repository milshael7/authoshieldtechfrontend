/* =========================================================
   AUTOSHIELD FRONTEND API LAYER — ENTERPRISE HARDENED
   ========================================================= */

const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_BACKEND_URL ||
  ""
).trim();

if (!API_BASE && import.meta.env.PROD) {
  console.error("⚠️ API_BASE not defined in production build.");
}

const TOKEN_KEY = "as_token";
const USER_KEY = "as_user";
const REQUEST_TIMEOUT = 15000; // 15s

/* =============================
   TOKEN & USER STORAGE
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
    setTimeout(() => reject(new Error("Request timeout")), ms)
  );
  return Promise.race([promise, timeout]);
}

/* =============================
   CORE REQUEST WRAPPER
   ============================= */

async function req(
  path,
  { method = "GET", body, auth = true, headers: extraHeaders = {} } = {},
  retry = true
) {
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

    const data = await res.json().catch(() => ({}));

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

        const refreshData = await refreshRes.json().catch(() => ({}));

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
        // Refresh failed
      }

      clearToken();
      clearUser();
      throw new Error("Session expired");
    }

    if (!res.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          `Request failed (${res.status})`
      );
    }

    return data;
  } catch (err) {
    if (err.message === "Session expired") throw err;

    throw new Error(
      err.message === "Request timeout"
        ? "Network timeout. Please try again."
        : "Network error. Please check connection."
    );
  }
}

/* =============================
   API SURFACE
   ============================= */

export const api = {
  /* -------- AUTH -------- */
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

  /* -------- USER -------- */
  meNotifications: () => req("/api/me/notifications"),
  markMyNotificationRead: (id) =>
    req(`/api/me/notifications/${id}/read`, { method: "POST" }),

  /* -------- POSTURE -------- */
  postureSummary: () => req("/api/posture/summary"),
  postureChecks: () => req("/api/posture/checks"),
  postureRecent: (limit = 50) =>
    req(`/api/posture/recent?limit=${encodeURIComponent(limit)}`),

  /* -------- ASSETS -------- */
  getAssets: () => req("/api/assets"),

  /* -------- THREATS -------- */
  getThreats: () => req("/api/threats"),

  /* -------- INCIDENTS -------- */
  getIncidents: () => req("/api/incidents"),

  /* -------- VULNERABILITIES -------- */
  getVulnerabilities: () => req("/api/vulnerabilities"),

  /* -------- COMPLIANCE -------- */
  getComplianceControls: () => req("/api/compliance"),

  /* -------- POLICIES -------- */
  getPolicies: () => req("/api/policies"),

  /* -------- REPORTS -------- */
  getReports: () => req("/api/reports"),

  /* -------- ADMIN -------- */
  adminUsers: () => req("/api/admin/users"),
  adminCompanies: () => req("/api/admin/companies"),
  adminNotifications: () => req("/api/admin/notifications"),

  /* -------- MANAGER -------- */
  managerOverview: () => req("/api/manager/overview"),
  managerUsers: () => req("/api/manager/users"),
  managerCompanies: () => req("/api/manager/companies"),
  managerAudit: (limit = 200) =>
    req(`/api/manager/audit?limit=${encodeURIComponent(limit)}`),

  /* -------- COMPANY -------- */
  companyMe: () => req("/api/company/me"),
  companyNotifications: () => req("/api/company/notifications"),
  companyMarkRead: (id) =>
    req(`/api/company/notifications/${id}/read`, {
      method: "POST",
    }),

  /* -------- AI -------- */
  aiChat: (message, context) =>
    req("/api/ai/chat", {
      method: "POST",
      body: { message, context },
    }),
};
