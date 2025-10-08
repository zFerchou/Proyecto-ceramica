import React, { useState } from 'react';
import NewSaleModal from './NewSaleModal';
import { getVenta, deleteVenta } from './api';

export default function SalesPage() {
  const [openNew, setOpenNew] = useState(false);
  const [query, setQuery] = useState('');
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function buscar() {
    setError(null);
    setLoading(true);
    try {
      const q = {};
      if (/^\d+$/.test(query)) q.id_venta = query;
      else q.codigo_venta = query;
      const res = await getVenta(q);
      setLoading(false);
      if (res.error) return setError(res.error);
      setVenta(res);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  }

  async function deshacer() {
    if (!venta || !venta.id_venta) return;
    if (!window.confirm('Seguro que deseas deshacer esta venta?')) return;
    const res = await deleteVenta(venta.id_venta);
    if (res.error) return setError(res.error);
    setVenta(null);
    alert('Venta deshecha');
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Ventas</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setOpenNew(true)}>Nueva venta</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <input placeholder="id_venta o codigo_venta" value={query} onChange={e => setQuery(e.target.value)} />
        <button onClick={buscar} disabled={loading} style={{ marginLeft: 8 }}>{loading ? 'Buscando...' : 'Buscar'}</button>
      </div>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      {venta && (
        <div style={{ border: '1px solid #ddd', padding: 12 }}>
          <div><strong>ID:</strong> {venta.id_venta}</div>
          <div><strong>Fecha:</strong> {venta.fecha}</div>
          <div><strong>Tipo pago:</strong> {venta.tipo_pago}</div>
          <div><strong>Codigo ticket:</strong> {venta.codigo_venta}</div>
          <div style={{ marginTop: 8 }}>
            <h4>Productos</h4>
            <ul>
              {venta.productos && venta.productos.map(p => (
                <li key={p.id_producto}>{p.nombre_producto} — {p.cantidad}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: 10 }}>
            <button onClick={deshacer}>Deshacer venta</button>
          </div>
        </div>
      )}

      {openNew && <NewSaleModal onClose={() => setOpenNew(false)} onCreated={(res) => { setVenta(res); setOpenNew(false); }} />}
    </div>
  );
}
