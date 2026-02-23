/* =========================================================
   AUTOSHIELD FRONTEND API LAYER — STABLE BUILD
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

  const headers = {
    "Content-Type": "application/json",
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
   API OBJECT (IMPORTANT — THIS FIXES YOUR BUILD)
========================================================= */

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

  /* ADMIN */
  adminCompanies: () => req("/api/admin/companies"),
  adminUsers: () => req("/api/admin/users"),
  adminNotifications: () => req("/api/admin/notifications"),

  /* SECURITY */
  postureSummary: () => req("/api/security/posture-summary"),
  postureChecks: () => req("/api/security/posture-checks"),
  postureRecent: (minutes = 60) =>
    req(`/api/security/posture-recent?minutes=${minutes}`),

  vulnerabilities: () => req("/api/security/vulnerabilities"),

  /* COMPLIANCE */
  complianceOverview: () => req("/api/security/compliance"),
};

/* 🔥 THIS LINE IS WHAT YOUR BUILD WAS MISSING */
export { api };
