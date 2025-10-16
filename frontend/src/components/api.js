// Simple API helper
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000/api';

export async function postProducto(data) {
  const res = await fetch(`${API_BASE}/productos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res;
}

export async function putActualizarStock(id_producto, data) {
  const res = await fetch(`${API_BASE}/productos/${id_producto}/stock`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res;
}

export async function postActualizarStockPorCodigo(codigo, data) {
  const res = await fetch(`${API_BASE}/productos/stock-por-codigo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo, ...data }),
  });
  return res;
}

export async function getProductos() {
  const res = await fetch(`${API_BASE}/productos`);
  return res;
}

export async function deleteProducto(id_producto) {
  const res = await fetch(`${API_BASE}/productos/${id_producto}`, { method: 'DELETE' });
  return res;
}

export async function patchActualizarDetalles(id_producto, data) {
  const res = await fetch(`${API_BASE}/productos/${id_producto}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res;
}

// --- Ventas (Sales) API helpers
export async function postVenta(payload) {
  return fetch('http://localhost:3000/ventas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json());
}

export async function getVenta(query) {
  const qs = new URLSearchParams(query).toString();
  return fetch(`http://localhost:3000/ventas?${qs}`).then(r => r.json());
}

export async function deleteVenta(id_venta) {
  return fetch(`http://localhost:3000/ventas/${id_venta}`, { method: 'DELETE' }).then(r => r.json());
}

export async function patchAnularProductos(id_venta, payload) {
  return fetch(`http://localhost:3000/ventas/${id_venta}/productos`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json());
}

const api = { postProducto, putActualizarStock, postActualizarStockPorCodigo, getProductos, deleteProducto, patchActualizarDetalles, postVenta, getVenta, deleteVenta, patchAnularProductos };

export default api;
