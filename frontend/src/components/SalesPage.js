import React, { useState, useEffect, useCallback } from 'react';
import PageBackground from './PageBackground';
import NewSaleModal from '../components/NewSaleModal';
import ReportModal from '../components/ReportModal';
import { getVentas, deleteVenta } from '../api/api';

// --- Modal para deshacer venta usando codigo_venta
function UndoSaleModal({ isOpen, venta, onConfirm, onCancel }) {
  if (!isOpen || !venta) return null;

  return (
    <div style={stylesModal.overlay}>
      <div style={stylesModal.modal}>
        <h2 style={stylesModal.title}>⚠️ Deshacer Venta</h2>
        <p style={stylesModal.message}>
          ¿Seguro que deseas deshacer la Venta #{venta.codigo_venta}? <br />
          Esta acción eliminará la venta de forma permanente.
        </p>
        <div style={stylesModal.buttonGroup}>
          <button
            style={stylesModal.buttonPrimary}
            onClick={() => onConfirm(venta.codigo_venta)}
          >
            Sí, deshacer venta
          </button>
          <button style={stylesModal.buttonCancel} onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Modal de éxito al deshacer venta
function UndoSuccessModal({ isOpen, mensaje, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={stylesModal.overlay}>
      <div style={stylesModal.modal}>
        <h2 style={stylesModal.title}>✅ Éxito</h2>
        <p style={stylesModal.message}>{mensaje}</p>
        <div style={{ textAlign: 'center' }}>
          <button style={stylesModal.buttonPrimary} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const [openNew, setOpenNew] = useState(false);
  const [openReport, setOpenReport] = useState(false);
  const [query, setQuery] = useState('');
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [openUndo, setOpenUndo] = useState(false);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [undoSuccess, setUndoSuccess] = useState({ open: false, mensaje: '' });

  // --- Buscar ventas
  // Lógica de búsqueda: si query coincide con patrón EAN-13 (13 dígitos) buscar por codigo_venta; si no, por nombre
  const buscar = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      let params;
      const trimmed = query.trim();
      if (trimmed) {
        const esCodigoVenta = /^\d{8,14}$/.test(trimmed); // permitir entre 8 y 14 dígitos (flexible por si cambia)
        if (esCodigoVenta) {
          // Intentar primero coincidencia exacta por codigo_venta
          params = { codigo_venta: trimmed };
        } else {
          // Búsqueda por nombre parcial
          params = { nombre: trimmed };
        }
      }
      const res = await getVentas(params);
      setLoading(false);
      if (res.error) return setError(res.error);

      // Si buscamos por codigo_venta y no hay resultados, intentar buscar por nombre como fallback
      if (params && params.codigo_venta && Array.isArray(res) && res.length === 0) {
        const fallback = await getVentas({ nombre: trimmed });
        if (!fallback.error) {
          setVentas(fallback);
          return;
        }
      }
      setVentas(res);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  }, [query]);

  // --- Abrir modal deshacer
  function handleUndoClick(venta) {
    setSelectedVenta(venta);
    setOpenUndo(true);
  }

  // --- Confirmar deshacer con modal de éxito
  async function confirmUndo(codigo_venta) {
    const res = await deleteVenta(codigo_venta);

    if (res.error) {
      setError(res.error);
    } else {
      setVentas(prev => prev.filter(v => v.codigo_venta !== codigo_venta));
      setUndoSuccess({ open: true, mensaje: `Venta #${codigo_venta} deshecha con éxito` });
    }

    setOpenUndo(false);
    setSelectedVenta(null);
  }

  useEffect(() => {
    buscar();
  }, [buscar]);

  // Formatear precio
  const formatPrice = (price) => {
    return typeof price === 'number' ? `$${price.toFixed(2)}` : `$${parseFloat(price || 0).toFixed(2)}`;
  };

  // Obtener precio unitario de diferentes propiedades posibles
  const getPrecioUnitario = (producto) => {
    const posiblesPropiedades = [
      'precio_unitario',
      'precio',
      'precio_venta', 
      'precio_producto',
      'unit_price',
      'precio_unidad'
    ];
    
    for (const prop of posiblesPropiedades) {
      if (producto[prop] !== undefined && producto[prop] !== null) {
        return typeof producto[prop] === 'number' ? producto[prop] : parseFloat(producto[prop] || 0);
      }
    }
    
    return 0;
  };

  // Obtener total de la venta de diferentes propiedades posibles
  const getTotalVenta = (venta) => {
    const posiblesPropiedadesTotal = [
      'total',
      'total_venta',
      'total_pagar',
      'monto_total',
      'grand_total',
      'importe_total'
    ];
    
    for (const prop of posiblesPropiedadesTotal) {
      if (venta[prop] !== undefined && venta[prop] !== null) {
        return typeof venta[prop] === 'number' ? venta[prop] : parseFloat(venta[prop] || 0);
      }
    }
    
    // Si no encuentra el total, calcularlo sumando los subtotales de los productos
    if (venta.productos && Array.isArray(venta.productos)) {
      return venta.productos.reduce((sum, producto) => {
        const precio = getPrecioUnitario(producto);
        const cantidad = producto.cantidad || 0;
        return sum + (precio * cantidad);
      }, 0);
    }
    
    return 0;
  };

  // Calcular subtotal por producto
  const calculateSubtotal = (producto) => {
    const precio = getPrecioUnitario(producto);
    const cantidad = producto.cantidad || 0;
    return precio * cantidad;
  };

  return (
    <PageBackground>
    <div style={styles.container}>
      <h2 style={styles.title}>🧾 Ventas</h2>

      <div style={styles.topButtons}>
        <button style={styles.buttonPrimary} onClick={() => setOpenNew(true)}>
          ➕ Nueva venta
        </button>
        <button
          style={{ ...styles.buttonPrimary, marginLeft: '1rem' }}
          onClick={() => setOpenReport(true)}
        >
          📄 Generar reporte
        </button>
      </div>

      <div style={styles.searchBox}>
        <input
          style={styles.input}
          placeholder="Buscar por nombre de producto o código de venta"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') buscar(); }}
        />
        <button onClick={buscar} disabled={loading} style={styles.buttonSecondary}>
          {loading ? 'Buscando...' : '🔍 Buscar'}
        </button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {ventas.length === 0 && !loading && (
        <div style={{ textAlign: 'center', marginTop: '1rem', color: '#6b4f3b' }}>
          No hay ventas registradas
        </div>
      )}

      {ventas.map(venta => {
        const totalVenta = getTotalVenta(venta);
        
        return (
          <div key={venta.codigo_venta} style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>🧮 Venta #{venta.codigo_venta}</h3>
              <div style={styles.ventaInfo}>
                <div><strong>Fecha:</strong> {new Date(venta.fecha).toLocaleString()}</div>
                <div><strong>Tipo de pago:</strong> {venta.tipo_pago}</div>
                <div><strong>Total:</strong> {formatPrice(totalVenta)}</div>
              </div>
            </div>

            <div style={styles.productsSection}>
              <h4 style={styles.productsTitle}>🛒 Productos Vendidos</h4>
              <div style={styles.productsGrid}>
                {venta.productos && venta.productos.map((producto, idx) => {
                  const precioUnitario = getPrecioUnitario(producto);
                  const subtotal = calculateSubtotal(producto);
                  
                  return (
                    <div key={idx} style={styles.productCard}>
                      <div style={styles.productHeader}>
                        <strong style={styles.productName}>{producto.nombre_producto}</strong>
                        {producto.imagen_url && (
                          <img 
                            src={`http://localhost:3000${producto.imagen_url}`} 
                            alt={producto.nombre_producto}
                            style={styles.productImage}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      
                      <div style={styles.productDetails}>
                        <div style={styles.detailRow}>
                          <span>Cantidad:</span>
                          <strong>{producto.cantidad}</strong>
                        </div>
                        <div style={styles.detailRow}>
                          <span>Precio unitario:</span>
                          <strong>{formatPrice(precioUnitario)}</strong>
                        </div>
                        <div style={styles.detailRow}>
                          <span>Subtotal:</span>
                          <strong style={styles.subtotal}>
                            {formatPrice(subtotal)}
                          </strong>
                        </div>
                        
                        {producto.descripcion && (
                          <div style={styles.description}>
                            <span>Descripción:</span> {producto.descripcion}
                          </div>
                        )}
                        {producto.codigo_barras && (
                          <div style={styles.barcode}>
                            <span>Código barras:</span> {producto.codigo_barras}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN DE RESUMEN CON CÁLCULO DE TOTAL */}
            <div style={styles.summarySection}>
              <div style={styles.summaryRow}>
                <span>Subtotal productos:</span>
                <strong>
                  {formatPrice(
                    venta.productos?.reduce((sum, producto) => sum + calculateSubtotal(producto), 0) || 0
                  )}
                </strong>
              </div>
              <div style={styles.summaryRow}>
                <span>Total de la venta:</span>
                <strong style={styles.grandTotal}>
                  {formatPrice(totalVenta)}
                </strong>
              </div>
            </div>

            <div style={styles.cardFooter}>
              <div style={styles.totalSection}>
                <strong style={styles.grandTotal}>
                  Total de la venta: {formatPrice(totalVenta)}
                </strong>
              </div>
              <button style={styles.buttonDanger} onClick={() => handleUndoClick(venta)}>
                ⚠️ Deshacer venta
              </button>
            </div>
          </div>
        );
      })}

      {/* --- Modal Nueva Venta --- */}
      {openNew && (
        <NewSaleModal
          onClose={() => setOpenNew(false)}
          onCreated={res => {
            setVentas(prev => [res, ...prev]);
            setOpenNew(false);
          }}
        />
      )}

      {/* --- Modal Reporte Ventas --- */}
      {openReport && <ReportModal isOpen={openReport} onClose={() => setOpenReport(false)} />}

      {/* --- Modal Deshacer Venta --- */}
      {openUndo && (
        <UndoSaleModal
          isOpen={openUndo}
          venta={selectedVenta}
          onConfirm={confirmUndo}
          onCancel={() => setOpenUndo(false)}
        />
      )}

      {/* --- Modal éxito deshacer venta --- */}
      {undoSuccess.open && (
        <UndoSuccessModal
          isOpen={undoSuccess.open}
          mensaje={undoSuccess.mensaje}
          onClose={() => setUndoSuccess({ open: false, mensaje: '' })}
        />
      )}
    </div>
    </PageBackground>
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
    maxWidth: '1000px',
    margin: '2rem auto',
    fontFamily: '"Poppins", sans-serif',
  },
  title: { 
    textAlign: 'center', 
    fontSize: '2rem', 
    color: '#3e2c1c', 
    marginBottom: '1.5rem' 
  },
  topButtons: { 
    textAlign: 'center', 
    marginBottom: '1rem' 
  },
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
  searchBox: { 
    display: 'flex', 
    justifyContent: 'center', 
    gap: '0.5rem', 
    marginBottom: '1.2rem' 
  },
  input: {
    flex: 1,
    padding: '0.6rem',
    border: '1px solid #c2a878',
    borderRadius: '6px',
    backgroundColor: '#fffdf8',
    outline: 'none',
    color: '#3e2c1c',
    transition: 'all 0.3s ease',
    maxWidth: '400px'
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
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
    border: '1px solid #d2b48c',
    marginBottom: '1.5rem',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e8dfd0'
  },
  cardTitle: { 
    fontSize: '1.4rem', 
    color: '#4b3621', 
    margin: 0 
  },
  ventaInfo: {
    textAlign: 'right',
    fontSize: '0.9rem',
    color: '#6b4f3b'
  },
  productsSection: {
    marginBottom: '1rem'
  },
  productsTitle: { 
    color: '#4b3621', 
    marginBottom: '1rem', 
    fontSize: '1.1rem',
    borderBottom: '1px solid #d2b48c',
    paddingBottom: '0.5rem'
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem'
  },
  productCard: {
    backgroundColor: '#f5f1e3',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #d2b48c'
  },
  productHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.8rem'
  },
  productName: {
    fontSize: '1rem',
    color: '#3e2c1c',
    flex: 1
  },
  productImage: {
    width: '50px',
    height: '50px',
    borderRadius: '6px',
    objectFit: 'cover',
    marginLeft: '0.5rem'
  },
  productDetails: {
    fontSize: '0.9rem'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.3rem'
  },
  subtotal: {
    color: '#2c5aa0',
    fontWeight: 'bold'
  },
  // SECCIÓN DE RESUMEN
  summarySection: {
    backgroundColor: '#f0e6d2',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    border: '1px solid #d2b48c'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1rem',
    marginBottom: '0.5rem'
  },
  description: {
    fontSize: '0.85rem',
    color: '#6b4f3b',
    marginTop: '0.5rem',
    fontStyle: 'italic'
  },
  barcode: {
    fontSize: '0.8rem',
    color: '#8b6b4a',
    marginTop: '0.3rem',
    fontFamily: 'monospace'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '2px solid #e8dfd0'
  },
  totalSection: {
    fontSize: '1.1rem'
  },
  grandTotal: {
    color: '#2c5aa0',
    fontSize: '1.2rem'
  }
};

const stylesModal = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(75,54,33,0.6)',
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
    width: '400px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
    fontFamily: '"Poppins", sans-serif',
  },
  title: { textAlign: 'center', marginBottom: '1rem', fontSize: '1.5rem' },
  message: { textAlign: 'center', marginBottom: '1.5rem' },
  buttonGroup: { display: 'flex', justifyContent: 'space-between', gap: '0.5rem' },
  buttonPrimary: {
    backgroundColor: '#a67c52',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  buttonCancel: {
    backgroundColor: '#8b6b4a',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.2rem',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};