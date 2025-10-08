import React, { useState } from 'react';
import { postProducto } from './api';

export default function RegisterProductModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ nombre: '', descripcion: '', cantidad: 0, precio: 0, id_categoria: 1 });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'cantidad' || name === 'precio' || name === 'id_categoria' ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await postProducto(form);
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
      <h2>Registrar producto</h2>
      {error && <div className="error">{JSON.stringify(error)}</div>}
      <form onSubmit={handleSubmit}>
        <label>Nombre<input name="nombre" value={form.nombre} onChange={handleChange} /></label>
        <label>Descripcion<input name="descripcion" value={form.descripcion} onChange={handleChange} /></label>
        <label>Cantidad<input name="cantidad" type="number" value={form.cantidad} onChange={handleChange} /></label>
        <label>Precio<input name="precio" type="number" step="0.01" value={form.precio} onChange={handleChange} /></label>
        <label>Id Categoria<input name="id_categoria" type="number" value={form.id_categoria} onChange={handleChange} /></label>
        <div>
          <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
          <button type="button" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
