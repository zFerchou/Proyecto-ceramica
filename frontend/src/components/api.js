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

export default { postProducto, putActualizarStock, postActualizarStockPorCodigo, getProductos, deleteProducto, patchActualizarDetalles };
