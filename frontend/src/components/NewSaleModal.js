import React, { useState } from 'react';
import { postVenta } from '../api/api';
import Marco from "../images/Marco.png";

export default function NewSaleModal({ onClose, onCreated }) {
  const [tipoPago, setTipoPago] = useState('Efectivo');
  const [lines, setLines] = useState([{ codigo_barras: '', cantidad: 1 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [ventaRegistrada, setVentaRegistrada] = useState(null);

  function updateLine(idx, field, value) {
    const next = [...lines];
    next[idx] = { ...next[idx], [field]: value };
    setLines(next);
  }

  function addLine() {
    setLines([...lines, { codigo_barras: '', cantidad: 1 }]);
  }

  function removeLine(i) {
    setLines(lines.filter((_, idx) => idx !== i));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    const productos = lines.map(l => ({
      codigo_barras: String(l.codigo_barras || '').trim(),
      cantidad: Number(l.cantidad),
    }));

    if (
      productos.length === 0 ||
      productos.some(p => !p.codigo_barras || !Number.isInteger(p.cantidad) || p.cantidad <= 0)
    ) {
      setError('Cada línea necesita un código de barras válido y cantidad entera positiva.');
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
      
      // Mostrar modal de confirmación
      setVentaRegistrada(res);
      setShowConfirmation(true);
      
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  }

  function handleCloseConfirmation() {
    setShowConfirmation(false);
    onCreated && onCreated(ventaRegistrada);
    onClose && onClose();
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>🛒 Nueva Venta</h2>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>
            Tipo de pago:
            <select
              value={tipoPago}
              onChange={e => setTipoPago(e.target.value)}
              style={styles.select}
            >
              <option>Efectivo</option>
              <option>Transacción</option>
            </select>
          </label>

          <div style={styles.lineContainer}>
            {lines.map((line, idx) => (
              <div key={idx} style={styles.lineRow}>
                <input
                  placeholder="Código de barras"
                  value={line.codigo_barras}
                  onChange={e => updateLine(idx, 'codigo_barras', e.target.value)}
                  style={styles.input}
                />
                <input
                  type="number"
                  min={1}
                  value={line.cantidad}
                  onChange={e => updateLine(idx, 'cantidad', e.target.value)}
                  style={{ ...styles.input, width: '80px' }}
                />
                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  style={styles.removeButton}
                >
                  ✖
                </button>
              </div>
            ))}

            <button type="button" onClick={addLine} style={styles.addButton}>
              ➕ Agregar línea
            </button>
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="submit"
              style={{
                ...styles.buttonPrimary,
                opacity: loading ? 0.7 : 1,
              }}
              disabled={loading}
            >
              {loading ? 'Guardando...' : '💾 Registrar venta'}
            </button>
            <button type="button" style={styles.buttonCancel} onClick={onClose}>
              ✖ Cancelar
            </button>
          </div>
        </form>

        {/* Modal de Confirmación de Venta */}
        {showConfirmation && (
          <div style={styles.confirmationOverlay}>
            <div style={styles.confirmationModal}>
              <div style={styles.confirmationContent}>
                <div style={styles.confirmationIcon}>✅</div>
                <h3 style={styles.confirmationTitle}>¡Venta Registrada Exitosamente!</h3>
                
                <div style={styles.confirmationDetails}>
                  <p><strong>ID de Venta:</strong> {ventaRegistrada?.id || 'N/A'}</p>
                  <p><strong>Total:</strong> ${ventaRegistrada?.total?.toFixed(2) || '0.00'}</p>
                  <p><strong>Productos:</strong> {ventaRegistrada?.productos?.length || 0}</p>
                  <p><strong>Tipo de Pago:</strong> {tipoPago}</p>
                  <p><strong>Fecha:</strong> {new Date().toLocaleString()}</p>
                </div>

                <div style={styles.confirmationButtons}>
                  <button 
                    onClick={handleCloseConfirmation}
                    style={styles.confirmationButton}
                  >
                    ✅ Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 🎨 Estilos café-caqui coherentes con RegisterProductModal
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
    backgroundImage: `url(${Marco})`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    position: 'relative',
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
  select: {
    marginTop: '0.4rem',
    padding: '0.6rem',
    borderRadius: '6px',
    border: '1px solid #c2a878',
    backgroundColor: '#fffdf8',
    color: '#3e2c1c',
    outline: 'none',
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
  lineContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '0.6rem',
  },
  lineRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  addButton: {
    marginTop: '0.6rem',
    backgroundColor: '#a67c52',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  removeButton: {
    backgroundColor: '#b26a55',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    padding: '0.4rem 0.6rem',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '1.2rem',
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
  // Estilos para el modal de confirmación
  confirmationOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(75, 54, 33, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  confirmationModal: {
    backgroundColor: '#f5f1e3',
    color: '#4b3621',
    borderRadius: '14px',
    padding: '2rem',
    width: '400px',
    maxWidth: '90vw',
    boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
    fontFamily: '"Poppins", sans-serif',
    animation: 'fadeIn 0.3s ease-in-out',
    backgroundImage: `url(${Marco})`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  },
  confirmationContent: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  confirmationIcon: {
    fontSize: '3rem',
    marginBottom: '0.5rem',
  },
  confirmationTitle: {
    fontSize: '1.4rem',
    color: '#3e2c1c',
    margin: 0,
  },
  confirmationDetails: {
    backgroundColor: 'rgba(166, 124, 82, 0.1)',
    padding: '1rem',
    borderRadius: '8px',
    textAlign: 'left',
    fontSize: '0.95rem',
  },
  confirmationButtons: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '1rem',
  },
  confirmationButton: {
    backgroundColor: '#a67c52',
    color: 'white',
    border: 'none',
    padding: '0.7rem 2rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'background 0.3s ease',
  },
};

// Animación fadeIn
const styleSheet = document.styleSheets[0];
const keyframes = `
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
`;
styleSheet.insertRule(keyframes, styleSheet.cssRules.length);