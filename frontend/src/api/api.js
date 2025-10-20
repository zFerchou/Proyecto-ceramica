// Simple API helper
export const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';

// Productos
export async function postProducto(data, file) {
  const hasFile = !!file;
  if (hasFile) {
    const form = new FormData();
    Object.entries(data || {}).forEach(([k, v]) => form.append(k, v ?? ""));
    form.append('imagen', file);
    return fetch(`${API_BASE}/api/productos`, {
      method: 'POST',
      body: form,
    });
  } else {
    return fetch(`${API_BASE}/api/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }
}

export async function putActualizarStock(id_producto, data) {
  const res = await fetch(`${API_BASE}/api/productos/${id_producto}/stock`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res;
}

export async function postActualizarStockPorCodigo(codigo, data) {
  const res = await fetch(`${API_BASE}/api/productos/stock-por-codigo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo, ...data }),
  });
  return res;
}

export async function getProductos() {
  const res = await fetch(`${API_BASE}/api/productos`);
  return res;
}

export async function deleteProducto(id_producto) {
  const res = await fetch(`${API_BASE}/api/productos/${id_producto}`, { method: 'DELETE' });
  return res;
}

export async function patchActualizarDetalles(id_producto, data) {
  const res = await fetch(`${API_BASE}/api/productos/${id_producto}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res;
}

// --- Ventas (Sales) API helpers
export async function postVenta(payload) {
  return fetch(`${API_BASE}/api/ventas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json());
}

export async function getVenta(query) {
  const qs = new URLSearchParams(query).toString();
  return fetch(`${API_BASE}/api/ventas?${qs}`).then(r => r.json());
}

// NUEVO: Obtener todas las ventas
export async function getVentas(query) {
  try {
    const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
    const res = await fetch(`${API_BASE}/api/ventas/all${qs}`);
    if (!res.ok) {
      const text = await res.text();
      return { error: text || `Error ${res.status}` };
    }
    try {
      const data = await res.json();
      return data;
    } catch (err) {
      const text = await res.text();
      return { error: 'Respuesta no es JSON: ' + text };
    }
  } catch (err) {
    return { error: err.message };
  }
}

// Reporte de ventas por rango de fechas
export async function getReporteVentas({ fecha_inicio, fecha_fin }) {
  const qs = new URLSearchParams({ fecha_inicio, fecha_fin }).toString();
  try {
    const res = await fetch(`${API_BASE}/api/ventas/reporte?${qs}`);
    if (!res.ok) {
      const text = await res.text();
      return { error: text || `Error ${res.status}` };
    }
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}

// Dashboard: resumen de productos (top, recientes, agotando)
export async function getProductosResumenDashboard() {
  try {
    const res = await fetch(`${API_BASE}/api/dashboard/productos-resumen`);
    if (!res.ok) {
      const text = await res.text();
      return { error: text || `Error ${res.status}` };
    }
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}

// --- DELETE usando codigo_venta
export async function deleteVenta(codigo_venta) {
  return fetch(`${API_BASE}/api/ventas/deshacer/${codigo_venta}`, { method: 'DELETE' })
    .then(async r => {
      try { return await r.json(); } 
      catch { return { error: 'Error al procesar respuesta' }; }
    });
}

export async function patchAnularProductos(id_venta, payload) {
  return fetch(`${API_BASE}/api/ventas/${id_venta}/productos`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(async r => {
    try { return await r.json(); } 
    catch { return { error: 'Error al procesar respuesta' }; }
  });
}

const api = {
  postProducto,
  putActualizarStock,
  postActualizarStockPorCodigo,
  getProductos,
  deleteProducto,
  patchActualizarDetalles,
  postVenta,
  getVenta,
  getVentas,
  getReporteVentas,
  deleteVenta,
  patchAnularProductos,
  getProductosResumenDashboard
};

export default api;
