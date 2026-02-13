/* =========================================================
   AUTOSHIELD FRONTEND API LAYER — CLEAN PRODUCTION VERSION
   ========================================================= */

const API_BASE = import.meta.env.VITE_API_BASE?.trim();

if (!API_BASE) {
  console.error("❌ VITE_API_BASE is missing");
}

const TOKEN_KEY = "as_token";
const USER_KEY = "as_user";
const REQUEST_TIMEOUT = 15000;

/* =============================
   STORAGE HELPERS
   ============================= */

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

/* =============================
   URL HELPER
   ============================= */

function joinUrl(base, path) {
  const cleanBase = String(base || "").replace(/\/+$/, "");
  const cleanPath = String(path || "").startsWith("/")
    ? path
    : `/${path}`;

  return `${cleanBase}${cleanPath}`;
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
  if (!API_BASE) {
    throw new Error("API base URL not configured");
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
        // refresh failed
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

    if (err.message === "Request timeout") {
      throw new Error("Network timeout. Please try again.");
    }

    throw new Error(
      err.message || "Network error. Please check connection."
    );
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
