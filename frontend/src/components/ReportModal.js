import React, { useState } from 'react';
import { getReporteVentas } from '../api/api';

export default function ReportModal({ isOpen, onClose }) {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function generarReporte(e) {
    e.preventDefault();
    if (!fechaInicio || !fechaFin) {
      setError('Selecciona ambas fechas.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
  const res = await getReporteVentas({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
      if (res.error) {
        setError(res.error);
      } else {
        setVentas(res);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function descargarCSV() {
    if (!ventas.length) return;

    let csv = 'Código,Nombre,Fecha,Tipo de Pago,Producto,Cantidad,Precio,Subtotal\n';
    ventas.forEach(v => {
      v.productos.forEach(p => {
        const subtotal = p.cantidad * p.precio;
        csv += `${v.codigo_venta},${v.nombre || ''},${v.fecha},${v.tipo_pago},${p.nombre_producto},${p.cantidad},${p.precio},${subtotal}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${fechaInicio}_a_${fechaFin}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Resumen por tipo de pago (en dinero)
  const resumenPago = ventas.reduce((acc, v) => {
    const totalVenta = v.productos.reduce((s, p) => s + p.cantidad * p.precio, 0);
    acc[v.tipo_pago] = (acc[v.tipo_pago] || 0) + totalVenta;
    return acc;
  }, {});

  // Total general
  const totalGeneral = Object.values(resumenPago).reduce((sum, val) => sum + val, 0);

  // Productos más vendidos
  const productosVendidos = {};
  ventas.forEach(v => v.productos.forEach(p => {
    productosVendidos[p.nombre_producto] = (productosVendidos[p.nombre_producto] || 0) + p.cantidad;
  }));

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>📄 Generar Reporte</h2>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={generarReporte} style={styles.form}>
          <label style={styles.label}>
            Fecha inicio:
            <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Fecha fin:
            <input
              type="date"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
              style={styles.input}
            />
          </label>

          <div style={styles.buttonGroup}>
            <button type="submit" style={{ ...styles.buttonPrimary, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? 'Cargando...' : '📊 Generar'}
            </button>
            <button type="button" style={styles.buttonCancel} onClick={onClose}>
              ✖ Cerrar
            </button>
          </div>
        </form>

        {ventas.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>📌 Resumen</h3>

            <div style={{ marginBottom: '0.8rem' }}>
              <strong>Total por tipo de pago:</strong>
              <ul>
                {Object.entries(resumenPago).map(([tipo, total]) => (
                  <li key={tipo}>{tipo}: ${total.toFixed(2)}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '0.8rem' }}>
              <strong>Total general:</strong> ${totalGeneral.toFixed(2)}
            </div>

            <div style={{ marginBottom: '0.8rem' }}>
              <strong>Productos más vendidos:</strong>
              <ul>
                {Object.entries(productosVendidos)
                  .sort((a,b) => b[1] - a[1])
                  .map(([producto, cantidad]) => (
                    <li key={producto}>{producto}: {cantidad}</li>
                  ))}
              </ul>
            </div>

            <button style={styles.buttonPrimary} onClick={descargarCSV}>
              ⬇️ Descargar CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 🎨 Estilos café-caqui coherentes con NewSaleModal
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(75, 54, 33, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#f5f1e3',
    color: '#4b3621',
    borderRadius: '14px',
    padding: '2rem',
    width: '500px',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
    fontFamily: '"Poppins", sans-serif',
    animation: 'fadeIn 0.3s ease-in-out',
  },
  title: {
    textAlign: 'center',
    fontSize: '1.6rem',
    marginBottom: '1.2rem',
    color: '#3e2c1c',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    fontWeight: '500',
  },
  input: {
    padding: '0.6rem',
    borderRadius: '6px',
    border: '1px solid #c2a878',
    backgroundColor: '#fffdf8',
    color: '#3e2c1c',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '1rem',
  },
  buttonPrimary: {
    backgroundColor: '#a67c52',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.4rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
  buttonCancel: {
    backgroundColor: '#8b6b4a',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.4rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
  errorBox: {
    backgroundColor: '#fce8e6',
    color: '#7a3e2f',
    borderLeft: '5px solid #b26a55',
    padding: '0.7rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
};
