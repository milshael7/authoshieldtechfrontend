const API_BASE = import.meta.env.VITE_API_BASE || '';

const TOKEN_KEY = 'as_token';
const USER_KEY = 'as_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const getSavedUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
  catch { return null; }
};
export const saveUser = (u) => localStorage.setItem(USER_KEY, JSON.stringify(u));
export const clearUser = () => localStorage.removeItem(USER_KEY);

async function req(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // Auth
  login: (email, password) => req('/api/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  resetPassword: (email, newPassword) => req('/api/auth/reset-password', { method: 'POST', body: { email, newPassword }, auth: false }),

  // Me
  meNotifications: () => req('/api/me/notifications'),
  markMyNotificationRead: (id) => req(`/api/me/notifications/${id}/read`, { method: 'POST' }),
  createProject: (payload) => req('/api/me/projects', { method: 'POST', body: payload }),

  // Admin
  adminUsers: () => req('/api/admin/users'),
  adminCreateUser: (payload) => req('/api/admin/users', { method: 'POST', body: payload }),
  adminRotateUserId: (id) => req(`/api/admin/users/${id}/rotate-id`, { method: 'POST' }),
  adminUpdateSubscription: (id, payload) => req(`/api/admin/users/${id}/subscription`, { method: 'POST', body: payload }),
  adminCompanies: () => req('/api/admin/companies'),
  adminCreateCompany: (payload) => req('/api/admin/companies', { method: 'POST', body: payload }),
  adminNotifications: () => req('/api/admin/notifications'),

  // Manager (read-only visibility)
  managerOverview: () => req('/api/manager/overview'),
  managerUsers: () => req('/api/manager/users'),
  managerCompanies: () => req('/api/manager/companies'),
  managerNotifications: () => req('/api/manager/notifications'),
  managerAudit: (limit=200) => req(`/api/manager/audit?limit=${encodeURIComponent(limit)}`),

  // Trading
  tradingSymbols: () => req('/api/trading/symbols'),
  tradingCandles: (symbol) => req(`/api/trading/candles?symbol=${encodeURIComponent(symbol)}`),

  // AI
  aiChat: (message, context) => req('/api/ai/chat', { method: 'POST', body: { message, context } }),
  aiTrainingStatus: () => req('/api/ai/training/status'),
  aiTrainingStart: () => req('/api/ai/training/start', { method: 'POST' }),
  aiTrainingStop: () => req('/api/ai/training/stop', { method: 'POST' }),
};
