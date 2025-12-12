export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';

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
// AUTENTICACIÓN
// ========================
export const verifyCurrentToken = async () => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) throw new Error('No hay token disponible');
    
    const res = await fetch(`${API_BASE}/auth/verify`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(res);
  } catch (err) {
    throw new Error('Error verificando token: ' + err.message);
  }
};

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
  
  // Auth
  verifyCurrentToken,
  login,
  verify2FA,
  forgotUsername,
  forgotPassword,
  resetPassword,
  verifyToken
};

export default api;