export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

// Variables para el sistema de cola de requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor para manejar tokens expirados
const setupFetchInterceptor = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    let [url, options = {}] = args;
    
    // Clonar las opciones para no mutar las originales
    const fetchOptions = { ...options };
    
    // Añadir headers de autenticación si no están presentes
    if (!fetchOptions.headers) {
      fetchOptions.headers = {};
    }
    
    // Asegurar que tenemos el token en los headers si está disponible
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token && !fetchOptions.headers['Authorization']) {
      fetchOptions.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Asegurar Content-Type para solicitudes con body
    if (fetchOptions.body && !fetchOptions.headers['Content-Type'] && 
        typeof fetchOptions.body === 'string') {
      fetchOptions.headers['Content-Type'] = 'application/json';
    }
    
    try {
      const response = await originalFetch(url, fetchOptions);
      
      // Si la respuesta es 401 (no autorizado), intentar refrescar el token
      if (response.status === 401 && !url.toString().includes('/auth/refresh')) {
        console.log('🔐 Token expirado, intentando refresh...');
        
        // Si ya estamos refrescando, añadir a la cola
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(newToken => {
            fetchOptions.headers['Authorization'] = `Bearer ${newToken}`;
            return originalFetch(url, fetchOptions);
          }).catch(err => {
            return Promise.reject(err);
          });
        }
        
        isRefreshing = true;
        
        try {
          const refreshData = await refreshToken();
          const newToken = refreshData.token;
          
          // Actualizar el token en localStorage
          localStorage.setItem('token', newToken);
          
          // Actualizar headers con el nuevo token
          fetchOptions.headers['Authorization'] = `Bearer ${newToken}`;
          
          // Procesar la cola de requests fallidos
          processQueue(null, newToken);
          
          // Reintentar la request original con el nuevo token
          return originalFetch(url, fetchOptions);
        } catch (refreshError) {
          // Si no se puede refrescar, procesar la cola con error
          processQueue(refreshError, null);
          
          // Limpiar localStorage y redirigir a login
          localStorage.removeItem('token');
          localStorage.removeItem('authToken');
          
          // Solo redirigir si no estamos ya en la página de login
          if (!window.location.pathname.includes('/login')) {
            setTimeout(() => {
              window.location.href = '/login';
            }, 100);
          }
          
          throw refreshError;
        } finally {
          isRefreshing = false;
        }
      }
      
      return response;
    } catch (error) {
      return Promise.reject(error);
    }
  };
};

// Inicializar el interceptor cuando se importe este módulo
if (typeof window !== 'undefined') {
  setupFetchInterceptor();
  console.log('✅ Interceptor de fetch inicializado');
}

// ========================
// FUNCIONES AUXILIARES
// ========================

// Función helper para headers con autenticación
const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Función helper para manejar respuestas con mejor manejo de errores
const handleResponse = async (response) => {
  const text = await response.text();
  
  // Si no hay contenido, devolver null para DELETE exitoso
  if (!text && response.ok) {
    return null;
  }
  
  try {
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
      // Lanzar error con toda la información disponible
      const error = new Error(data.error || data.message || `Error ${response.status}: ${response.statusText}`);
      error.response = response;
      error.data = data;
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (err) {
    // Si el parseo falla pero la respuesta es exitosa, devolver el texto
    if (response.ok) {
      return text;
    }
    // Si hay texto pero no es JSON, lanzar error con el texto
    if (text) {
      const error = new Error(text);
      error.response = response;
      error.status = response.status;
      throw error;
    }
    // Si no hay texto, lanzar error genérico
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
};

// ========================
// FUNCIONES DE AUTENTICACIÓN MEJORADAS
// ========================

/**
 * Verifica y refresca el token actual si es necesario
 * CORREGIDO: Removido Cache-Control para evitar error CORS
 */
export const verifyCurrentToken = async () => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No hay token disponible');
    }
    
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`
        // REMOVIDO: 'Cache-Control': 'no-cache'
      }
    });
    
    const data = await handleResponse(res);
    
    // Si la verificación fue exitosa, retornar datos
    if (data.success) {
      return data;
    }
    
    throw new Error('Verificación fallida');
    
  } catch (err) {
    // Si es error 401 (no autorizado), intentar refrescar el token
    if (err.status === 401 || err.message.includes('Token expirado') || err.message.includes('No hay token')) {
      try {
        const refreshed = await refreshToken();
        return refreshed;
      } catch (refreshError) {
        // Si no se puede refrescar, limpiar y redirigir
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        throw new Error('Sesión expirada, por favor inicie sesión nuevamente');
      }
    }
    throw err;
  }
};

/**
 * Refresca el token JWT actual
 */
export const refreshToken = async () => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) throw new Error('No hay token para refrescar');
    
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await handleResponse(res);
    
    if (data.success && data.token) {
      // Actualizar el token en localStorage
      localStorage.setItem('token', data.token);
      console.log('✅ Token refrescado exitosamente');
      return data;
    }
    
    throw new Error('No se pudo refrescar el token');
  } catch (err) {
    console.error('❌ Error refrescando token:', err);
    throw err;
  }
};

/**
 * Sistema de verificación periódica de sesión
 */
export const initSessionManager = () => {
  if (typeof window === 'undefined') return () => {};
  
  console.log('✅ Gestor de sesión inicializado');
  
  let lastVerifyTime = 0;
  const VERIFY_INTERVAL = 15 * 60 * 1000; // 15 minutos
  
  const verifySession = async () => {
    const now = Date.now();
    
    // Solo verificar si ha pasado el intervalo
    if (now - lastVerifyTime > VERIFY_INTERVAL) {
      lastVerifyTime = now;
      
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (!token) {
          console.log('⚠️ No hay token, sesión no activa');
          return;
        }
        
        await verifyCurrentToken();
        console.log('✅ Sesión verificada automáticamente');
      } catch (err) {
        console.log('⚠️ Error en verificación automática:', err.message);
      }
    }
  };
  
  // Verificar al cargar la página (con delay)
  setTimeout(verifySession, 5000);
  
  // Verificar periódicamente (cada 10 minutos)
  const intervalId = setInterval(verifySession, 10 * 60 * 1000);
  
  // Verificar cuando la ventana gana foco
  window.addEventListener('focus', verifySession);
  
  return () => {
    clearInterval(intervalId);
    window.removeEventListener('focus', verifySession);
  };
};

// Función para limpiar sesión
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  console.log('👋 Sesión cerrada');
};

// ========================
// USUARIOS
// ========================
export const getUsuarios = async () => {
  const res = await fetch(`${API_BASE}/api/usuarios`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res);
};

export const crearUsuario = async (usuarioData) => {
  const res = await fetch(`${API_BASE}/api/usuarios`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(usuarioData),
  });
  return handleResponse(res);
};

export const deleteUsuario = async (id) => {
  const res = await fetch(`${API_BASE}/api/usuarios/${id}`, { 
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(res);
};

// ========================
// PRODUCTOS
// ========================
export const postProducto = async (data, file) => {
  const hasFile = !!file;
  if (hasFile) {
    const form = new FormData();
    Object.entries(data || {}).forEach(([k, v]) => form.append(k, v ?? ""));
    form.append('imagen', file);
    
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    const res = await fetch(`${API_BASE}/api/productos`, {
      method: 'POST',
      body: form,
      headers
    });
    return handleResponse(res);
  } else {
    const res = await fetch(`${API_BASE}/api/productos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  }
};

export const putActualizarStock = async (id_producto, data) => {
  const res = await fetch(`${API_BASE}/api/productos/${id_producto}/stock`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const postActualizarStockPorCodigo = async (codigo, data) => {
  const res = await fetch(`${API_BASE}/api/productos/stock-por-codigo`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ codigo, ...data }),
  });
  return handleResponse(res);
};

export const getProductos = async () => {
  const res = await fetch(`${API_BASE}/api/productos`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res);
};

export const deleteProducto = async (nombre) => {
  const res = await fetch(`${API_BASE}/api/productos/nombre/${encodeURIComponent(nombre)}`, { 
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(res);
};

export const patchActualizarDetalles = async (nombre, data) => {
  const res = await fetch(`${API_BASE}/api/productos/nombre/${encodeURIComponent(nombre)}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const patchActualizarProducto = async (id_producto, data) => {
  const res = await fetch(`${API_BASE}/api/productos/${id_producto}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

// ========================
// VENTAS
// ========================
export const postVenta = async (payload) => {
  const res = await fetch(`${API_BASE}/api/ventas`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

export const getVenta = async (query) => {
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`${API_BASE}/api/ventas?${qs}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res);
};

export const getVentas = async (query) => {
  try {
    const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
    const res = await fetch(`${API_BASE}/api/ventas/all${qs}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  } catch (err) {
    return { error: err.message };
  }
};

export const getMisEstadisticas = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/ventas/mis-estadisticas`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  } catch (err) {
    return { error: err.message };
  }
};

export const getReporteVentas = async ({ fecha_inicio, fecha_fin }) => {
  const qs = new URLSearchParams({ fecha_inicio, fecha_fin }).toString();
  try {
    const res = await fetch(`${API_BASE}/api/ventas/reporte?${qs}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  } catch (err) {
    return { error: err.message };
  }
};

export const getProductosResumenDashboard = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/dashboard/productos-resumen`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  } catch (err) {
    return { error: err.message };
  }
};

export const deleteVenta = async (codigo_venta) => {
  const res = await fetch(`${API_BASE}/api/ventas/deshacer/${codigo_venta}`, { 
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(res);
};

export const patchAnularProductos = async (id_venta, payload) => {
  const res = await fetch(`${API_BASE}/api/ventas/${id_venta}/productos`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
};

// ========================
// CATEGORÍAS
// ========================
export const getCategorias = async () => {
  const res = await fetch(`${API_BASE}/api/categorias`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res);
};

export const postCategoria = async (data) => {
  const res = await fetch(`${API_BASE}/api/categorias`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const putCategoria = async (id, data) => {
  const res = await fetch(`${API_BASE}/api/categorias/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteCategoria = async (id) => {
  const res = await fetch(`${API_BASE}/api/categorias/${id}`, { 
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return handleResponse(res);
};

// ========================
// AUTENTICACIÓN BÁSICA
// ========================
export const login = async (credenciales) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credenciales),
  });
  return handleResponse(res);
};

export const verify2FA = async (datos) => {
  const res = await fetch(`${API_BASE}/auth/verify2FA`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return handleResponse(res);
};

export const forgotUsername = async (email) => {
  const res = await fetch(`${API_BASE}/auth/forgot-username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
};

export const forgotPassword = async (email) => {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handleResponse(res);
};

export const resetPassword = async (token, newPassword) => {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  return handleResponse(res);
};

export const verifyToken = async (token) => {
  const res = await fetch(`${API_BASE}/auth/verify-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return handleResponse(res);
};

// --- API Object ---
const api = {
  // Sistema de sesión
  verifyCurrentToken,
  refreshToken,
  initSessionManager,
  logout,
  
  // Usuarios
  getUsuarios,
  crearUsuario,
  deleteUsuario,
  
  // Productos
  postProducto,
  putActualizarStock,
  postActualizarStockPorCodigo,
  getProductos,
  deleteProducto,
  patchActualizarDetalles,
  patchActualizarProducto,
  
  // Ventas
  postVenta,
  getVenta,
  getVentas,
  getMisEstadisticas,
  getReporteVentas,
  deleteVenta,
  patchAnularProductos,
  
  // Dashboard
  getProductosResumenDashboard,
  
  // Categorías
  getCategorias,
  postCategoria,
  putCategoria,
  deleteCategoria,
  
  // Auth básica
  login,
  verify2FA,
  forgotUsername,
  forgotPassword,
  resetPassword,
  verifyToken
};

export default api;