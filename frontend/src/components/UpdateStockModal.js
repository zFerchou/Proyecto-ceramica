import React, { useState } from 'react';
import { postActualizarStockPorCodigo, putActualizarStock } from './api';

export default function UpdateStockModal({ onClose, onSuccess, allowCodigo }) {
  const [form, setForm] = useState({ codigo: '', id_producto: '', cantidad: 1 });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'cantidad' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let res;
      if (form.codigo) {
        res = await postActualizarStockPorCodigo(form.codigo, { cantidad: form.cantidad });
      } else if (form.id_producto) {
        res = await putActualizarStock(form.id_producto, { cantidad: form.cantidad });
      } else {
        setError({ error: 'Ingrese codigo de barras o id_producto' });
        setLoading(false);
        return;
      }
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body || { error: 'Error desconocido' });
      } else {
        onSuccess(body);
      }
    } catch (err) {
      setError({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <h2>Actualizar stock</h2>
      {error && <div className="error">{JSON.stringify(error)}</div>}
      <form onSubmit={handleSubmit}>
        <label>Codigo de barras (opcional)<input name="codigo" value={form.codigo} onChange={handleChange} /></label>
        <label>ID Producto (opcional)<input name="id_producto" value={form.id_producto} onChange={handleChange} /></label>
        <label>Cantidad<input name="cantidad" type="number" min="1" value={form.cantidad} onChange={handleChange} /></label>
        <div>
          <button type="submit" disabled={loading}>{loading ? 'Actualizando...' : 'Actualizar'}</button>
          <button type="button" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
