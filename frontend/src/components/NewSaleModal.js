import React, { useState } from 'react';
import { postVenta } from './api';

export default function NewSaleModal({ onClose, onCreated }) {
  const [tipoPago, setTipoPago] = useState('Efectivo');
  const [lines, setLines] = useState([{ nombre_producto: '', cantidad: 1 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function updateLine(idx, field, value) {
    const next = [...lines];
    next[idx] = { ...next[idx], [field]: value };
    setLines(next);
  }

  function addLine() { setLines([...lines, { nombre_producto: '', cantidad: 1 }]); }
  function removeLine(i) { setLines(lines.filter((_, idx) => idx !== i)); }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    const productos = lines.map(l => ({ nombre_producto: l.nombre_producto.trim(), cantidad: Number(l.cantidad) }));
    if (productos.length === 0 || productos.some(p => !p.nombre_producto || !Number.isInteger(p.cantidad) || p.cantidad <= 0)) {
      setError('Cada línea necesita nombre de producto y cantidad entera positiva.');
      return;
    }
    setLoading(true);
    try {
      const payload = { productos, tipo_pago: tipoPago };
      const res = await postVenta(payload);
      setLoading(false);
      if (res.error) {
        setError(res.error || JSON.stringify(res));
        return;
      }
      onCreated && onCreated(res);
      onClose && onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  }

  return (
    <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)' }}>
      <div style={{ width: 700, margin: '40px auto', background: '#fff', padding: 20 }}>
        <h3>Nueva Venta</h3>
        <form onSubmit={submit}>
          <label>Tipo de pago: </label>
          <select value={tipoPago} onChange={e => setTipoPago(e.target.value)}>
            <option>Efectivo</option>
            <option>Transacción</option>
          </select>

          <div style={{ marginTop: 10 }}>
            {lines.map((line, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <input placeholder="Nombre producto" value={line.nombre_producto}
                  onChange={e => updateLine(idx, 'nombre_producto', e.target.value)} />
                <input type="number" min={1} value={line.cantidad}
                  onChange={e => updateLine(idx, 'cantidad', e.target.value)} style={{ width: 80 }} />
                <button type="button" onClick={() => removeLine(idx)}>Eliminar</button>
              </div>
            ))}
            <button type="button" onClick={addLine}>Agregar línea</button>
          </div>

          {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Registrar venta'}</button>
            <button type="button" onClick={onClose} style={{ marginLeft: 8 }}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
