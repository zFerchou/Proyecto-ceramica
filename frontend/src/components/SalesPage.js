import React, { useState, useEffect } from 'react';
import NewSaleModal from '../components/NewSaleModal';
import ReportModal from '../components/ReportModal'; // Modal de reportes
import { getVentas, deleteVenta } from '../api/api';

export default function SalesPage() {
  const [openNew, setOpenNew] = useState(false);
  const [openReport, setOpenReport] = useState(false); // Modal de reporte
  const [query, setQuery] = useState('');
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Buscar ventas
  async function buscar() {
    setError(null);
    setLoading(true);
    try {
      const res = await getVentas({ query });
      setLoading(false);
      if (res.error) return setError(res.error);
      setVentas(res);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  }

  // --- Deshacer venta
  async function deshacer(codigo_venta) {
    if (!codigo_venta) return;
    if (!window.confirm(`¿Seguro que deseas deshacer la Venta #${codigo_venta}?`)) return;
    const res = await deleteVenta(codigo_venta);
    if (res.error) return setError(res.error);
    setVentas((prev) => prev.filter(v => v.codigo_venta !== codigo_venta));
    alert(`Venta #${codigo_venta} deshecha con éxito`);
  }

  useEffect(() => {
    // Carga inicial
    buscar();
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🧾 Ventas</h2>

      <div style={styles.topButtons}>
        <button style={styles.buttonPrimary} onClick={() => setOpenNew(true)}>
          ➕ Nueva venta
        </button>
        <button style={{...styles.buttonPrimary, marginLeft: '1rem'}} onClick={() => setOpenReport(true)}>
          📄 Generar reporte
        </button>
      </div>

      <div style={styles.searchBox}>
        <input
          style={styles.input}
          placeholder="Buscar por nombre de venta o código de ticket"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={buscar} disabled={loading} style={styles.buttonSecondary}>
          {loading ? 'Buscando...' : '🔍 Buscar'}
        </button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {ventas.length === 0 && !loading && <div style={{textAlign: 'center', marginTop: '1rem'}}>No hay ventas</div>}

      {ventas.map((venta) => (
        <div key={venta.codigo_venta} style={styles.card}>
          <h3 style={styles.cardTitle}>🧮 Venta #{venta.codigo_venta}</h3>
          <div style={styles.infoLine}>
            <strong>Fecha:</strong> {venta.fecha}
          </div>
          <div style={styles.infoLine}>
            <strong>Tipo de pago:</strong> {venta.tipo_pago}
          </div>
          <div style={styles.infoLine}>
            <strong>Código de ticket:</strong> {venta.codigo_venta}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ color: '#4b3621', marginBottom: '0.5rem' }}>🛒 Productos</h4>
            <ul style={styles.productList}>
              {venta.productos && venta.productos.map((p, idx) => (
                <li key={idx} style={styles.productItem}>
                  {p.nombre_producto} — <strong>{p.cantidad}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ textAlign: 'right', marginTop: '1rem' }}>
            <button style={styles.buttonDanger} onClick={() => deshacer(venta.codigo_venta)}>
              ⚠️ Deshacer venta
            </button>
          </div>
        </div>
      ))}

      {/* --- Modal Nueva Venta --- */}
      {openNew && (
        <NewSaleModal
          onClose={() => setOpenNew(false)}
          onCreated={(res) => {
            setVentas(prev => [res, ...prev]);
            setOpenNew(false);
          }}
        />
      )}

      {/* --- Modal Reporte Ventas --- */}
      {openReport && (
        <ReportModal
          isOpen={openReport} // ✅ necesario para que se monte
          onClose={() => setOpenReport(false)}
        />
      )}
    </div>
  );
}

// 🎨 Estilos café caqui
const styles = {
  container: {
    backgroundColor: '#f5f1e3',
    color: '#4b3621',
    padding: '2rem',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    maxWidth: '900px',
    margin: '2rem auto',
    fontFamily: '"Poppins", sans-serif',
  },
  title: { textAlign: 'center', fontSize: '2rem', color: '#3e2c1c', marginBottom: '1.5rem' },
  topButtons: { textAlign: 'center', marginBottom: '1rem' },
  buttonPrimary: {
    backgroundColor: '#a67c52',
    color: 'white',
    border: 'none',
    padding: '0.7rem 1.4rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
  },
  searchBox: { display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.2rem' },
  input: {
    flex: 1,
    padding: '0.6rem',
    border: '1px solid #c2a878',
    borderRadius: '6px',
    backgroundColor: '#fffdf8',
    outline: 'none',
    color: '#3e2c1c',
    transition: 'all 0.3s ease',
  },
  buttonSecondary: {
    backgroundColor: '#c2a878',
    color: '#3e2c1c',
    border: 'none',
    padding: '0.6rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  buttonDanger: {
    backgroundColor: '#8b6b4a',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.4rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.3s ease',
  },
  errorBox: {
    backgroundColor: '#fce8e6',
    borderLeft: '5px solid #b26a55',
    color: '#7a3e2f',
    padding: '0.8rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    textAlign: 'center',
    fontSize: '0.95rem',
  },
  card: {
    backgroundColor: '#fff8ef',
    padding: '1.2rem',
    borderRadius: '12px',
    boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
    border: '1px solid #d2b48c',
    marginBottom: '1rem',
  },
  cardTitle: { fontSize: '1.2rem', color: '#4b3621', marginBottom: '1rem', textAlign: 'center' },
  infoLine: { marginBottom: '0.4rem' },
  productList: { listStyleType: 'none', paddingLeft: 0, backgroundColor: '#f5f1e3', borderRadius: '8px', padding: '0.8rem' },
  productItem: { padding: '0.3rem 0', borderBottom: '1px solid #d2b48c' },
};
