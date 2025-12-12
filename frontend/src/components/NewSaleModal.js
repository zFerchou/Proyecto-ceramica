import React, { useState, useEffect, useRef } from 'react';
import api from '../api/api'; // Importar api, no funciones individuales
import { printTicket } from '../services/PrintService';
import logo from '../images/logo.png';
import Marco from "../images/Marco.png";

export default function NewSaleModal({ onClose, onCreated }) {
  const [tipoPago, setTipoPago] = useState('Efectivo');
  const [lines, setLines] = useState([{ codigo_barras: '', cantidad: 1, stock: 0, nombre: '', precio: 0 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [ventaRegistrada, setVentaRegistrada] = useState(null);
  const [productosVendidos, setProductosVendidos] = useState([]);
  const [productos, setProductos] = useState([]);
  const inputRefs = useRef([]);

  // Cargar productos al abrir el modal - CORREGIDO
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const data = await api.getProductos(); // api.getProductos() devuelve datos directamente
        console.log('Productos cargados:', data);
        if (Array.isArray(data)) {
          setProductos(data);
        }
      } catch (err) {
        console.error('Error al cargar productos:', err);
        setError('Error al cargar productos: ' + err.message);
      }
    };
    
    cargarProductos();
  }, []);

  // Enfocar automáticamente el primer campo de código de barras al abrir el modal
  useEffect(() => {
    const el = inputRefs.current[0];
    if (el) {
      el.focus();
      el.select?.();
    }
  }, []);

  const toNumber = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const calcularTotalVenta = (lineas) => {
    let total = 0;
    lineas.forEach(linea => {
      if (linea.codigo_barras && linea.cantidad > 0) {
        const precio = toNumber(linea.precio);
        const cantidad = toNumber(linea.cantidad);
        total += precio * cantidad;
      }
    });
    return total;
  };

  const buscarProducto = (codigo_barras) => {
    if (!codigo_barras) return null;
    
    const productoEncontrado = productos.find(p => {
      console.log('Buscando:', codigo_barras, 'en producto:', p.codigo_barras);
      return (
        p.codigo_barras === codigo_barras || 
        p.codigo_barras?.toString() === codigo_barras.toString()
      );
    });
    
    console.log('Producto encontrado:', productoEncontrado);
    return productoEncontrado;
  };

  const getStockProducto = (producto) => {
    if (!producto) return 0;
    
    const posiblesPropiedadesStock = [
      'stock',
      'cantidad_stock', 
      'inventario',
      'cantidad',
      'cantidad_disponible',
      'stock_disponible'
    ];
    
    for (const prop of posiblesPropiedadesStock) {
      if (producto[prop] !== undefined && producto[prop] !== null) {
        const stock = toNumber(producto[prop]);
        console.log(`Stock encontrado en propiedad ${prop}:`, stock);
        return stock;
      }
    }
    
    console.log('No se encontró stock en ninguna propiedad');
    return 0;
  };

  function updateLine(idx, field, value) {
    const next = [...lines];
    
    if (field === 'codigo_barras') {
      const raw = (value || '').toString();
      const onlyDigits = raw.replace(/\D+/g, '');
      const producto = buscarProducto(onlyDigits);
      if (producto) {
        const stock = getStockProducto(producto);
        console.log(`Stock para producto ${producto.nombre}:`, stock);
        
        next[idx] = { 
          ...next[idx], 
          codigo_barras: onlyDigits,
          stock: stock,
          nombre: producto.nombre || producto.nombre_producto || 'Producto encontrado',
          precio: toNumber(producto.precio || producto.precio_venta || producto.precio_unitario || 0)
        };
      } else {
        next[idx] = { 
          ...next[idx], 
          codigo_barras: onlyDigits,
          stock: 0,
          nombre: value ? 'Producto no encontrado' : '',
          precio: 0
        };
      }

      // Auto-agregar nueva línea si alcanza 13 dígitos (EAN-13)
      const esEAN13 = /^\d{13}$/.test(onlyDigits);
      if (esEAN13 && idx === lines.length - 1) {
        addLine();
        setTimeout(() => {
          const el = inputRefs.current[idx + 1];
          if (el) el.focus();
        }, 0);
      }
    } else if (field === 'cantidad') {
      const cantidad = parseInt(value) || 0;
      next[idx] = { ...next[idx], [field]: cantidad };
      
      if (cantidad > next[idx].stock && next[idx].stock > 0) {
        setError(`⚠️ Stock insuficiente para "${next[idx].nombre}". Stock disponible: ${next[idx].stock}`);
      } else {
        setError(null);
      }
    } else {
      next[idx] = { ...next[idx], [field]: value };
    }
    
    setLines(next);
  }

  function addLine() {
    setLines([...lines, { codigo_barras: '', cantidad: 1, stock: 0, nombre: '', precio: 0 }]);
  }

  function removeLine(i) {
    setLines(lines.filter((_, idx) => idx !== i));
  }

  const validarStock = () => {
    for (const line of lines) {
      if (line.codigo_barras && line.cantidad > line.stock) {
        return `Stock insuficiente para "${line.nombre}". Stock disponible: ${line.stock}, Cantidad solicitada: ${line.cantidad}`;
      }
    }
    return null;
  };

  async function submit(e) {
    e.preventDefault();
    setError(null);
    
    // Filtrar solo líneas con código de barras válido
    const lineasValidas = lines.filter(line => line.codigo_barras && line.codigo_barras.trim() !== '');
    
    if (lineasValidas.length === 0) {
      setError('Debe agregar al menos un producto con código de barras válido.');
      return;
    }
    
    const productosParaEnviar = lineasValidas.map(l => ({
      codigo_barras: String(l.codigo_barras || '').trim(),
      cantidad: Number(l.cantidad),
    }));

    if (productosParaEnviar.some(p => !p.codigo_barras || !Number.isInteger(p.cantidad) || p.cantidad <= 0)) {
      setError('Cada línea necesita un código de barras válido y cantidad entera positiva.');
      return;
    }

    const errorStock = validarStock();
    if (errorStock) {
      setError(errorStock);
      return;
    }

    setLoading(true);
    try {
      const payload = { 
        productos: productosParaEnviar, 
        tipo_pago: tipoPago 
      };
      
      console.log('Enviando venta:', payload);
      
      // CORRECCIÓN: api.postVenta devuelve datos directamente
      const result = await api.postVenta(payload);
      
      console.log('Respuesta de la venta:', result);
      
      if (result.error) {
        setError(result.error || 'Error al registrar venta');
        return;
      }
      
      const productosConInfo = lineasValidas;
      setProductosVendidos(productosConInfo);
      setVentaRegistrada(result);
      setShowConfirmation(true);
      
    } catch (err) {
      console.error('Error en submit:', err);
      setError(err.message || 'Error al registrar la venta');
    } finally {
      setLoading(false);
    }
  }

  function handleCloseConfirmation() {
    setShowConfirmation(false);
    if (onCreated && ventaRegistrada) {
      onCreated(ventaRegistrada);
    }
    if (onClose) {
      onClose();
    }
  }

  async function handlePrintTicket() {
    try {
      const lineasValidas = lines.filter(line => line.codigo_barras);
      const total = calcularTotalVenta(lineasValidas);

      const items = lineasValidas.map((p) => ({
        nombre: (p.nombre || '').toString(),
        cantidad: toNumber(p.cantidad),
        precio: toNumber(p.precio),
        total: toNumber(p.precio) * toNumber(p.cantidad),
      }));

      const codigoVenta = ventaRegistrada?.codigo_venta || ventaRegistrada?.id || '';

      async function loadImageBase64(url) {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }

      const logoBase64 = await loadImageBase64(logo).catch(() => null);

      await printTicket({
        titulo: 'Comprobante de Venta',
        items,
        total,
        mensaje: 'Gracias por su compra',
        tienda: 'Santo Barro',
        logoUrl: logoBase64 || null,
        codigoVenta: String(codigoVenta || ''),
      });
    } catch (err) {
      console.error('Error al imprimir ticket:', err);
      setError('No se pudo imprimir el ticket: ' + (err?.message || 'Error desconocido'));
    }
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
              disabled={loading}
            >
              <option>Efectivo</option>
              <option>Transacción</option>
            </select>
          </label>

          <div style={styles.lineContainer}>
            <div style={styles.lineHeader}>
              <span style={styles.headerText}>Código de Barras</span>
              <span style={styles.headerText}>Cantidad</span>
              <span style={styles.headerText}>Stock</span>
              <span style={styles.headerText}>Acciones</span>
            </div>
            
            {lines.map((line, idx) => (
              <div key={idx} style={styles.lineRow}>
                <div style={styles.inputGroup}>
                  <input
                    placeholder="Código de barras"
                    value={line.codigo_barras}
                    onChange={e => updateLine(idx, 'codigo_barras', e.target.value)}
                    style={styles.input}
                    disabled={loading}
                    ref={el => (inputRefs.current[idx] = el)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (line.codigo_barras.trim() !== '') {
                          addLine();
                          setTimeout(() => {
                            const next = inputRefs.current[idx + 1];
                            if (next) {
                              next.focus();
                              next.select?.();
                            }
                          }, 50);
                        }
                      }
                    }}
                  />
                  {line.nombre && line.nombre !== 'Producto no encontrado' && (
                    <div style={styles.productInfo}>
                      <span style={styles.productName}>{line.nombre}</span>
                      <span style={styles.productPrice}>
                        ${toNumber(line.precio).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div style={styles.quantityGroup}>
                  <input
                    type="number"
                    min={1}
                    max={line.stock > 0 ? line.stock : undefined}
                    value={line.cantidad}
                    onChange={e => updateLine(idx, 'cantidad', e.target.value)}
                    style={{
                      ...styles.input,
                      width: '80px',
                      borderColor: line.stock > 0 && line.cantidad > line.stock ? '#b26a55' : '#c2a878'
                    }}
                    disabled={loading}
                  />
                  {line.stock > 0 && (
                    <div style={styles.stockInfo}>
                      <span style={
                        line.cantidad > line.stock ? styles.stockError : styles.stockOk
                      }>
                        Máx: {line.stock}
                      </span>
                    </div>
                  )}
                </div>
                
                <div style={styles.stockDisplay}>
                  {line.stock > 0 ? (
                    <span style={
                      line.cantidad > line.stock ? styles.stockError : styles.stockOk
                    }>
                      {line.stock}
                    </span>
                  ) : line.codigo_barras ? (
                    <span style={styles.stockError} title="Producto no encontrado o sin stock">
                      ❌
                    </span>
                  ) : (
                    <span style={styles.stockNeutral}>-</span>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  style={styles.removeButton}
                  disabled={lines.length === 1 || loading}
                >
                  ✖
                </button>
              </div>
            ))}

            <button 
              type="button" 
              onClick={addLine} 
              style={styles.addButton}
              disabled={loading}
            >
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
            <button 
              type="button" 
              style={styles.buttonCancel} 
              onClick={onClose}
              disabled={loading}
            >
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
                  <div style={styles.detailRow}>
                    <strong>ID de Venta:</strong> 
                    <span>{ventaRegistrada?.codigo_venta || ventaRegistrada?.id || 'N/A'}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Total:</strong> 
                    <span>${calcularTotalVenta(lines.filter(line => line.codigo_barras)).toFixed(2)}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Productos:</strong> 
                    <span>{lines.filter(line => line.codigo_barras).length}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Tipo de Pago:</strong> 
                    <span>{tipoPago}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Fecha:</strong> 
                    <span>{new Date().toLocaleString()}</span>
                  </div>
                </div>

                <div style={styles.productsSection}>
                  <h4 style={styles.productsTitle}>Productos Vendidos:</h4>
                  <div style={styles.productsList}>
                    {lines
                      .filter(line => line.codigo_barras)
                      .map((producto, index) => (
                      <div key={index} style={styles.productItem}>
                        <span style={styles.productName}>
                          {producto.nombre || `Producto ${index + 1}`}
                        </span>
                        <span style={styles.productQuantity}>
                          Cantidad: {producto.cantidad}
                        </span>
                        <span style={styles.productPrice}>
                          ${(toNumber(producto.precio) * (producto.cantidad || 0)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={styles.confirmationButtons}>
                  <button 
                    onClick={handleCloseConfirmation}
                    style={styles.confirmationButton}
                  >
                    ✅ Cerrar
                  </button>
                  <button
                    onClick={handlePrintTicket}
                    style={{ ...styles.confirmationButton, marginLeft: '0.6rem' }}
                  >
                    🖨️ Imprimir ticket
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
    width: '600px',
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
  lineHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 0.5fr 0.5fr',
    gap: '0.6rem',
    padding: '0.5rem',
    backgroundColor: 'rgba(166, 124, 82, 0.1)',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  headerText: {
    textAlign: 'center',
  },
  lineRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 0.5fr 0.5fr',
    gap: '0.6rem',
    alignItems: 'start',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  productInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    padding: '0.2rem 0.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: '4px',
  },
  productName: {
    fontWeight: '500',
    color: '#3e2c1c',
  },
  productPrice: {
    fontWeight: 'bold',
    color: '#2c5aa0',
  },
  quantityGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  stockInfo: {
    fontSize: '0.7rem',
    textAlign: 'center',
  },
  stockDisplay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  stockOk: {
    color: '#2d5016',
  },
  stockError: {
    color: '#b26a55',
  },
  stockNeutral: {
    color: '#6b4f3b',
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
    width: '500px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    overflowY: 'auto',
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
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    paddingBottom: '0.3rem',
    borderBottom: '1px solid rgba(139, 107, 74, 0.2)',
  },
  productsSection: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '2px solid #d2b48c',
  },
  productsTitle: {
    fontSize: '1.1rem',
    marginBottom: '0.8rem',
    color: '#4b3621',
    textAlign: 'center',
  },
  productsList: {
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: 'rgba(255, 253, 248, 0.5)',
    borderRadius: '6px',
    padding: '0.5rem',
  },
  productItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem',
    marginBottom: '0.5rem',
    backgroundColor: '#fff8ef',
    borderRadius: '6px',
    border: '1px solid #e8dfd0',
    fontSize: '0.9rem',
  },
  productName: {
    flex: 2,
    fontWeight: '500',
    textAlign: 'left',
  },
  productQuantity: {
    flex: 1,
    textAlign: 'center',
    color: '#6b4f3b',
  },
  productPrice: {
    flex: 1,
    textAlign: 'right',
    fontWeight: 'bold',
    color: '#2c5aa0',
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