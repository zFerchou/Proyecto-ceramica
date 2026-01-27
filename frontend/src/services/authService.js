// services/authService.js - VERSIÓN CORREGIDA
const AUTH_KEY = 'app_auth_data_v1';

export function setAuthData(token, user) {
  const payload = { 
    token, 
    user: {
      ...user,
      isAdmin: user.rol === 'admin',
      isEmployee: user.rol === 'empleado' || user.rol === 'usuario' || user.rol === 'vendedor'
    }, 
    savedAt: Date.now() 
  };
  
  try { 
    // Guardar en formato nuevo
    localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
    // Mantener compatibilidad con formato antiguo
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Error guardando datos de autenticación:', error);
  }
}

export function getAuthData() {
  try { 
    const data = JSON.parse(localStorage.getItem(AUTH_KEY));
    if (data) return data;
    
    // Si no hay datos en formato nuevo, intentar formato antiguo
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      const user = JSON.parse(userStr);
      const payload = { 
        token, 
        user: {
          ...user,
          isAdmin: user.rol === 'admin',
          isEmployee: user.rol === 'empleado' || user.rol === 'usuario' || user.rol === 'vendedor'
        }, 
        savedAt: Date.now() 
      };
      return payload;
    }
    
    return null;
  } catch { 
    return null; 
  }
}

export function clearAuthData() {
  try { 
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch {}
}

export function logout() {
  clearAuthData();
}

export function isAuthenticated() {
  try {
    const authData = getAuthData();
    if (!authData || !authData.token) return false;
    
    const token = String(authData.token).trim();
    if (token === 'null' || token === 'undefined' || token.length === 0) return false;
    
    // ⚠️ ¡PROBLEMA! Quita esta verificación de antigüedad
    // El backend debe manejar la expiración del token JWT, NO el frontend
    
    // REMOVER ESTO:
    // const tokenAge = Date.now() - (authData.savedAt || 0);
    // const maxAge = 23 * 60 * 60 * 1000; // 23 horas
    // if (tokenAge > maxAge) {
    //   console.log('Token demasiado antiguo, limpiando autenticación');
    //   logout();
    //   return false;
    // }
    
    return true;
  } catch {
    return false;
  }
}

// VERSIÓN ALTERNATIVA - Solo verifica presencia, NO expiración
export function isAuthenticatedSimple() {
  try {
    const token = localStorage.getItem('token');
    return !!(token && token.trim() && token !== 'null' && token !== 'undefined');
  } catch {
    return false;
  }
}

export function canLoginOffline() {
  const authData = getAuthData();
  return !!(authData && authData.token && authData.user);
}

export function enterOfflineMode() {
  try { localStorage.setItem('offline_mode', '1'); } catch {}
}

// Nuevas funciones para el sistema de perfiles
export function getUser() {
  const authData = getAuthData();
  return authData ? authData.user : null;
}

export function getUserId() {
  const user = getUser();
  return user ? (user.userId || user.id) : null;
}

export function getUserRole() {
  const user = getUser();
  return user ? user.rol : null;
}

export function isAdmin() {
  const user = getUser();
  return user ? user.rol === 'admin' : false;
}

export function isEmployee() {
  const user = getUser();
  return user ? (user.rol === 'empleado' || user.rol === 'usuario' || user.rol === 'vendedor') : false;
}

export function getUserName() {
  const user = getUser();
  return user ? user.nombre : 'Usuario';
}

export function getToken() {
  const authData = getAuthData();
  return authData ? authData.token : null;
}

// Función para actualizar datos del usuario
export function updateUserData(updates) {
  try {
    const authData = getAuthData();
    if (authData && authData.user) {
      const updatedUser = { ...authData.user, ...updates };
      setAuthData(authData.token, updatedUser);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error actualizando datos de usuario:', error);
    return false;
  }
}

// ---------------------------------------------
// Export default
// ---------------------------------------------
const authService = { 
  setAuthData, 
  getAuthData, 
  clearAuthData, 
  canLoginOffline, 
  enterOfflineMode, 
  logout, 
  isAuthenticated,
  isAuthenticatedSimple, // Nueva función simplificada
  getUser,
  getUserId,
  getUserRole,
  isAdmin,
  isEmployee,
  getUserName,
  getToken,
  updateUserData
};

export default authService;