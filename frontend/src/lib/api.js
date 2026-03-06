/* =========================================================
   AUTOSHIELD FRONTEND API LAYER — ENTERPRISE v15 (QUIET)
   QUIET • DECISION-BASED • NO AUTH THRASH • SESSION SAFE
========================================================= */

const API_BASE = import.meta.env.VITE_API_BASE?.trim();

const TOKEN_KEY = "as_token";
const USER_KEY = "as_user";
const REQUEST_TIMEOUT = 60000;

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

/* ================= TENANT ================= */

function attachTenantHeader(headers) {
  const user = getSavedUser();
  if (user?.companyId) headers["x-company-id"] = user.companyId;
  return headers;
}

/* ================= CORE REQUEST ================= */

export async function req(
  path,
  { method = "GET", body, auth = true, silent = true } = {}
) {
  if (!API_BASE) {
    return { error: "API base missing", silent: true };
  }

  const headers = attachTenantHeader({
    "Content-Type": "application/json",
  });

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    else {
      // 🔇 No token = no request, no noise
      return { error: "No session", silent: true };
    }
  }

  let res;
  try {
    res = await fetchWithTimeout(joinUrl(API_BASE, path), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { error: "Network unreachable", silent: true };
  }

  let data = null;
  try {
    data = await res.json();
  } catch {}

  // 🔇 QUIET 401 HANDLING (NO LOOPS, NO FLASH)
  if (res.status === 401 && auth) {
    clearToken();
    clearUser();
    return {
      error: "Session expired",
      unauthorized: true,
      silent: true,
    };
  }

  if (!res.ok) {
    return {
      error: data?.error || `Request failed (${res.status})`,
      status: res.status,
      silent,
    };
  }

  return data ?? {};
}

/* ================= API OBJECT ================= */

export const api = {
  /* ================= AUTH ================= */

  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) throw new Error(data?.error || "Login failed");
    if (!data?.token || !data?.user)
      throw new Error("Invalid login response");

    return data;
  },

  signup: (payload) =>
    req("/api/auth/signup", {
      method: "POST",
      body: payload,
      auth: false,
    }),

  refresh: () =>
    req("/api/auth/refresh", {
      method: "POST",
      silent: true,
    }),

  /* ================= USERS ================= */

  listUsers: () => req("/api/users"),
  getUser: (id) => req(`/api/users/${id}`),

  /* ================= INCIDENTS ================= */

  incidents: () => req("/api/incidents"),
  createIncident: (payload) =>
    req("/api/incidents", { method: "POST", body: payload }),

  /* ================= SECURITY ================= */

  postureSummary: () =>
    req("/api/security/posture-summary", { silent: true }),

  securityEvents: () =>
    req("/api/security/events", { silent: true }),

  vulnerabilities: () =>
    req("/api/security/vulnerabilities", { silent: true }),

  /* ================= SECURITY TOOLS ================= */

  securityTools: () => req("/api/security/tools"),
  installSecurityTool: (id) =>
    req(`/api/security/tools/${id}/install`, { method: "POST" }),
  uninstallSecurityTool: (id) =>
    req(`/api/security/tools/${id}/uninstall`, { method: "POST" }),

  /* ================= ADMIN ================= */

  adminPlatformHealth: () =>
    req("/api/admin/platform-health", { silent: true }),

  adminExecutiveRisk: () =>
    req("/api/admin/executive-risk", { silent: true }),

  adminPostureSummary: () =>
    req("/api/admin/security/posture-summary", { silent: true }),

  adminSecurityFeed: () =>
    req("/api/admin/security/feed", { silent: true }),
};
