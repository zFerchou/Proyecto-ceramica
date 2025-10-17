// Minimal auth service used by the Login components
const AUTH_KEY = 'app_auth_data_v1';

export function setAuthData(token, user) {
  const payload = { token, user, savedAt: Date.now() };
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(payload)); } catch {};
}

export function getAuthData() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
}

export function clearAuthData() {
  try { localStorage.removeItem(AUTH_KEY); } catch {};
}

export function canLoginOffline() {
  const d = getAuthData();
  return !!(d && d.token && d.user);
}

export function enterOfflineMode() {
  // Mark a flag to indicate offline mode. Simple implementation.
  try { localStorage.setItem('offline_mode', '1'); } catch {}
}

const authService = { setAuthData, getAuthData, clearAuthData, canLoginOffline, enterOfflineMode };
export default authService;
