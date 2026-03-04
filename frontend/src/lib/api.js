/* =========================================================
   AUTOSHIELD FRONTEND API LAYER — ENTERPRISE v13 (FIXED)
   NO FLASH • NO HARD REDIRECT • SESSION SAFE
========================================================= */

const API_BASE = import.meta.env.VITE_API_BASE?.trim();

if (!API_BASE) {
  console.error("❌ VITE_API_BASE is missing");
}

const TOKEN_KEY = "as_token";
const USER_KEY = "as_user";
const REQUEST_TIMEOUT = 60000;

/* ================= STORAGE ================= */

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);
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
  user ? localStorage.setItem(USER_KEY, JSON.stringify(user)) : localStorage.removeItem(USER_KEY);
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

/* ================= TENANT ================= */

function attachTenantHeader(headers) {
  const user = getSavedUser();
  if (user?.companyId) headers["x-company-id"] = user.companyId;
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
  } catch {
    return { error: "Network unreachable" };
  }

  let data = {};
  try {
    data = await res.json();
  } catch {}

  /* ================= FIXED SESSION HANDLING ================= */

  if (res.status === 401 && auth) {
    clearToken();
    clearUser();
    return { error: "Session expired", unauthorized: true };
  }

  if (!res.ok) {
    return {
      error: data?.error || `Request failed (${res.status})`,
      status: res.status,
    };
  }

  return data;
}

/* ================= API OBJECT ================= */

export const api = {

  /* AUTH */
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) throw new Error(data?.error || "Login failed");
    if (!data?.token || !data?.user) throw new Error("Invalid login response");

    return data;
  },

  signup: (payload) => req("/api/auth/signup", { method: "POST", body: payload, auth: false }),
  refresh: () => req("/api/auth/refresh", { method: "POST" }),

  /* USERS */
  listUsers: () => req("/api/users"),
  getUser: (id) => req(`/api/users/${id}`),

  /* SECURITY */
  postureSummary: () => req("/api/security/posture-summary"),
  securityEvents: () => req("/api/security/events"),
  vulnerabilities: () => req("/api/security/vulnerabilities"),

  /* ADMIN */
  adminPlatformHealth: () => req("/api/admin/platform-health"),

  /* TOOLS */
  toolCatalog: () => req("/api/tools/catalog"),
  requestTool: (toolId) => req(`/api/tools/request/${toolId}`, { method: "POST" }),

};
