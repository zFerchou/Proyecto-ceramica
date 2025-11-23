import React, { useState } from 'react';
import { getReporteVentas } from '../api/api';
import Marco from "../images/Marco.png";

export default function ReportModal({ isOpen, onClose }) {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [reporteData, setReporteData] = useState(null);
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
    setReporteData(null);

    try {
      const res = await getReporteVentas({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
      
      console.log('✅ Respuesta COMPLETA de la API:', res);
      console.log('✅ Productos más vendidos:', res.productos_mas_vendidos);
      console.log('✅ Tipos de pago más usados:', res.tipo_pago_mas_usado);
      
      // ✅ VERIFICACIÓN COMPLETA DE LA RESPUESTA
      if (res && res.error) {
        setError(`Error del servidor: ${res.error}`);
        return;
      }
      
      if (res && typeof res === 'object') {
        setReporteData(res);
        
        // Mostrar mensaje si no hay datos
        if ((!res.total_vendido || res.total_vendido === 0 || res.total_vendido === '0.00') && 
            (!res.productos_mas_vendidos || res.productos_mas_vendidos.length === 0)) {
          setError('No se encontraron ventas en el rango de fechas seleccionado');
        }
      } else {
        console.warn('❌ Respuesta inesperada:', res);
        setError('Formato de respuesta inesperado del servidor');
      }
      
    } catch (err) {
      console.error('❌ Error en generarReporte:', err);
      setError(`Error de conexión: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // ✅ FUNCIÓN PARA CONVERTIR TOTAL_VENDIDO A NÚMERO
  const getTotalVendido = () => {
    if (!reporteData || !reporteData.total_vendido) return 0;
    
    // Si es string, convertir a número
    if (typeof reporteData.total_vendido === 'string') {
      return parseFloat(reporteData.total_vendido) || 0;
    }
    
    // Si ya es número, usarlo directamente
    return Number(reporteData.total_vendido) || 0;
  };

  function descargarCSV() {
    if (!reporteData) {
      setError('No hay datos para descargar');
      return;
    }

    const totalVendido = getTotalVendido();
    const productosFormateados = getProductosFormateados();
    const tiposPagoFormateados = getTiposPagoFormateados();
    
    // 🔥 SOLUCIÓN ROBUSTA: BOM + sin caracteres especiales
    const BOM = '\uFEFF';
    
    let csv = BOM + 'REPORTE DE VENTAS\n\n';
    
    // Fechas del reporte (sin acentos para evitar problemas)
    csv += `Periodo: ${fechaInicio} a ${fechaFin}\n`;
    csv += `Fecha de generacion: ${new Date().toLocaleDateString()}\n\n`;
    
    // Total vendido
    csv += 'TOTAL VENDIDO\n';
    csv += `$${totalVendido.toFixed(2)}\n\n`;
    
    // Productos más vendidos (sin acentos)
    csv += 'PRODUCTOS MAS VENDIDOS\n';
    if (productosFormateados.length > 0) {
      csv += 'Producto,Cantidad\n';
      productosFormateados.forEach((producto) => {
        csv += `${producto.nombre},${producto.cantidad}\n`;
      });
    } else {
      csv += 'No hay datos de productos vendidos\n';
    }
    csv += '\n';
    
    // Tipos de pago más usados (sin acentos)
    csv += 'TIPOS DE PAGO MAS USADOS\n';
    if (tiposPagoFormateados.length > 0) {
      csv += 'Metodo de Pago,Total\n';
      tiposPagoFormateados.forEach((tipoPago) => {
        csv += `${tipoPago.tipo},$${tipoPago.total}\n`;
      });
    } else {
      csv += 'No hay datos de metodos de pago\n';
    }

    // 🔥 SOLUCIÓN: Especificar explícitamente UTF-8
    const blob = new Blob([csv], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_ventas_${fechaInicio}_a_${fechaFin}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ✅ FUNCIÓN PARA FORMATEAR PRODUCTOS MÁS VENDIDOS - CORREGIDA
  const getProductosFormateados = () => {
    if (!reporteData || !reporteData.productos_mas_vendidos || !Array.isArray(reporteData.productos_mas_vendidos)) {
      return [];
    }
    
    console.log('🔍 Estructura REAL de productos_mas_vendidos:', reporteData.productos_mas_vendidos);
    
    return reporteData.productos_mas_vendidos.map((producto, index) => {
      console.log(`🔍 Producto ${index}:`, producto);
      
      // Según la documentación del backend, la estructura es:
      // { "nombre": "Jarra", "total_cantidad": 5 }
      if (producto && typeof producto === 'object') {
        const nombre = producto.nombre || producto.producto || `Producto ${index + 1}`;
        // Usar total_cantidad según la documentación del backend
        const cantidad = producto.total_cantidad || producto.cantidad || producto.total || 'N/A';
        
        return { nombre, cantidad };
      }
      // Si es un string simple
      else if (typeof producto === 'string') {
        return { nombre: producto, cantidad: 'N/A' };
      }
      // Si no se reconoce la estructura
      else {
        console.warn('❌ Estructura de producto no reconocida:', producto);
        return { nombre: `Producto ${index + 1}`, cantidad: 'N/A' };
      }
    });
  };

  // ✅ FUNCIÓN PARA FORMATEAR TIPOS DE PAGO - CORREGIDA
  const getTiposPagoFormateados = () => {
    if (!reporteData || !reporteData.tipo_pago_mas_usado || !Array.isArray(reporteData.tipo_pago_mas_usado)) {
      return [];
    }
    
    console.log('🔍 Estructura REAL de tipo_pago_mas_usado:', reporteData.tipo_pago_mas_usado);
    
    return reporteData.tipo_pago_mas_usado.map((tipoPago, index) => {
      console.log(`🔍 Tipo Pago ${index}:`, tipoPago);
      
      // Según la documentación del backend, la estructura es:
      // { "tipo_pago": "Efectivo", "total": 45.00 }
      if (tipoPago && typeof tipoPago === 'object') {
        const tipo = tipoPago.tipo_pago || tipoPago.tipo || tipoPago.metodo_pago || `Tipo ${index + 1}`;
        const total = tipoPago.total || tipoPago.cantidad || 'N/A';
        
        return { tipo, total };
      }
      // Si es un string simple
      else if (typeof tipoPago === 'string') {
        return { tipo: tipoPago, total: 'N/A' };
      }
      // Si no se reconoce la estructura
      else {
        console.warn('❌ Estructura de tipo pago no reconocida:', tipoPago);
        return { tipo: `Tipo ${index + 1}`, total: 'N/A' };
      }
    });
  };

  const totalVendido = getTotalVendido();
  const productosFormateados = getProductosFormateados();
  const tiposPagoFormateados = getTiposPagoFormateados();

  const tieneDatos = reporteData && (
    totalVendido > 0 ||
    (reporteData.productos_mas_vendidos && reporteData.productos_mas_vendidos.length > 0) ||
    (reporteData.tipo_pago_mas_usado && reporteData.tipo_pago_mas_usado.length > 0)
  );

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

        {tieneDatos && (
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>📌 Resumen del Reporte</h3>

            {/* TOTAL VENDIDO */}
            <div style={{ marginBottom: '0.8rem', padding: '0.5rem', backgroundColor: '#f0e6d2', borderRadius: '6px' }}>
              <strong>Total Vendido: </strong> 
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2d5016' }}>
                ${totalVendido.toFixed(2)}
              </span>
            </div>

            {/* PRODUCTOS MÁS VENDIDOS */}
            {productosFormateados.length > 0 && (
              <div style={{ marginBottom: '0.8rem' }}>
                <strong>Productos Más Vendidos:</strong>
                <ul>
                  {productosFormateados.map((producto, index) => (
                    <li key={index}>
                      {producto.nombre} 
                      {producto.cantidad !== 'N/A' && `: ${producto.cantidad} unidades`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* TIPOS DE PAGO MÁS USADOS */}
            {tiposPagoFormateados.length > 0 && (
              <div style={{ marginBottom: '0.8rem' }}>
                <strong>Tipos de Pago Más Usados:</strong>
                <ul>
                  {tiposPagoFormateados.map((tipoPago, index) => (
                    <li key={index}>
                      {tipoPago.tipo} 
                      {tipoPago.total !== 'N/A' && `: $${tipoPago.total}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button style={styles.buttonPrimary} onClick={descargarCSV}>
              ⬇️ Descargar CSV
            </button>
          </div>
        )}

        {/* Mensaje cuando no hay datos pero la respuesta fue exitosa */}
        {reporteData && !tieneDatos && !error && (
          <div style={{ marginTop: '1rem', textAlign: 'center', color: '#666' }}>
            No se encontraron ventas en el período seleccionado
          </div>
        )}

        {/* Debug info - remover en producción */}
        
      </div>
    </div>
  );
}

// 🎨 Estilos (mantener los mismos)
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
    backgroundPosition: 'center'
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