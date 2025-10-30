const AUTH_KEY = 'app_auth_data_v1';

export function setAuthData(token, user) {
  const payload = { token, user, savedAt: Date.now() };
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(payload)); } catch {}
}

export function getAuthData() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
}

export function clearAuthData() {
  try { localStorage.removeItem(AUTH_KEY); } catch {}
}

export function logout() {
  try {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem(AUTH_KEY);
  } catch {}
}

export function isAuthenticated() {
  try {
    const d = getAuthData();
    const token = d && d.token;
    // Si quedaron restos antiguos en localStorage ('authToken') pero no hay AUTH_KEY, limpiamos y forzamos no autenticado
    const legacy = localStorage.getItem('authToken');
    if (!token && legacy) {
      logout();
      return false;
    }
    if (!token) return false;
    const s = String(token).trim();
    if (s === 'null' || s === 'undefined' || s.length === 0) return false;
    return true;
  } catch {
    return false;
  }
}

export function canLoginOffline() {
  const d = getAuthData();
  return !!(d && d.token && d.user);
}

export function enterOfflineMode() {
  try { localStorage.setItem('offline_mode', '1'); } catch {}
}

// ---------------------------------------------
// Export default
// ---------------------------------------------
const authService = { setAuthData, getAuthData, clearAuthData, canLoginOffline, enterOfflineMode, logout, isAuthenticated };
export default authService;
