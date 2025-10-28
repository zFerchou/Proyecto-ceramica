import React, { useState, useEffect } from "react";
import Barcode from "react-barcode";
import RegisterProductModal from "./RegisterProductModal";
import UpdateStockModal from "./UpdateStockModal";
import ConfirmModal from "./ConfirmModal";
import ProductQRModal from "./ProductQRModal";
import QRImage from "./QRImage";
import api, { API_BASE } from "../api/api";

// Modal de Acciones (Imprimir, Editar, Eliminar)
function ProductActionsModal({ isOpen, onClose, producto, onEdit, onDelete, onPrint }) {
  if (!isOpen) return null;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <h2 style={modalStyles.title}>⚙️ Acciones del Producto</h2>
        <p style={modalStyles.productName}>{producto?.nombre}</p>
        
        <div style={modalStyles.buttonGroupVertical}>
          <button 
            style={modalStyles.buttonPrimary}
            onClick={() => onPrint(producto)}
          >
            🖨️ Imprimir Etiquetas
          </button>
          <button 
            style={modalStyles.buttonSecondary}
            onClick={() => onEdit(producto)}
          >
            ✏️ Editar Producto
          </button>
          <button 
            style={modalStyles.buttonDanger}
            onClick={() => onDelete(producto)}
          >
            🗑️ Eliminar Producto
          </button>
          <button 
            style={modalStyles.buttonCancel}
            onClick={onClose}
          >
            ✖ Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de Confirmación para Eliminar
function DeleteConfirmModal({ isOpen, onClose, producto, onConfirm }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(producto);
    setLoading(false);
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <h2 style={modalStyles.title}>⚠️ Confirmar Eliminación</h2>
        <div style={modalStyles.confirmMessage}>
          ¿Estás seguro de que deseas eliminar el producto <strong>"{producto?.nombre}"</strong>?
        </div>
        <div style={modalStyles.warningBox}>
          ❗ Esta acción no se puede deshacer
        </div>
        
        <div style={modalStyles.buttonGroup}>
          <button 
            style={{ ...modalStyles.buttonDanger, opacity: loading ? 0.7 : 1 }}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Eliminando...' : '🗑️ Sí, Eliminar'}
          </button>
          <button 
            style={modalStyles.buttonCancel}
            onClick={onClose}
            disabled={loading}
          >
            ✖ Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de Edición 
function EditProductModal({ isOpen, onClose, producto, onSuccess, setMessage }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio: producto.precio || '',
        cantidad: producto.cantidad || '',
        id_categoria: producto.id_categoria || 1
      });
    }
  }, [producto]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Usar la ruta correcta del backend: PATCH /api/productos/nombre/{nombre}
      const res = await api.patchActualizarDetalles(producto.nombre, formData);
      
      if (res.ok) {
        const result = await res.json();
        setMessage("✅ Producto actualizado correctamente");
        onSuccess();
        onClose();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Error al actualizar' }));
        setError(errorData.error || 'Error al actualizar el producto');
      }
    } catch (err) {
      setError('Error de conexión al actualizar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <h2 style={modalStyles.title}>✏️ Editar Producto</h2>
        <p style={modalStyles.productName}>{producto?.nombre}</p>

        {error && <div style={modalStyles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={modalStyles.form}>
          <label style={modalStyles.label}>
            Nombre:
            <input
              type="text"
              name="nombre"
              value={formData.nombre || ''}
              onChange={handleChange}
              style={modalStyles.input}
              required
            />
          </label>

          <label style={modalStyles.label}>
            Descripción:
            <textarea
              name="descripcion"
              value={formData.descripcion || ''}
              onChange={handleChange}
              style={{...modalStyles.input, minHeight: '80px'}}
            />
          </label>

          <div style={modalStyles.row}>
            <label style={modalStyles.label}>
              Precio:
              <input
                type="number"
                name="precio"
                value={formData.precio || ''}
                onChange={handleChange}
                style={modalStyles.input}
                step="0.01"
                min="0"
                required
              />
            </label>

            <label style={modalStyles.label}>
              Cantidad:
              <input
                type="number"
                name="cantidad"
                value={formData.cantidad || ''}
                onChange={handleChange}
                style={modalStyles.input}
                min="0"
                required
              />
            </label>
          </div>

          <div style={modalStyles.buttonGroup}>
            <button 
              type="submit" 
              style={{ ...modalStyles.buttonPrimary, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? 'Guardando...' : '💾 Guardar Cambios'}
            </button>
            <button 
              type="button" 
              style={modalStyles.buttonCancel}
              onClick={onClose}
              disabled={loading}
            >
              ✖ Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Componente principal actualizado
export default function InventoryPage({ onClose }) {
  const [showRegister, setShowRegister] = useState(false);
  const [showUpdateStock, setShowUpdateStock] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [productos, setProductos] = useState([]);
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastRegisteredProduct, setLastRegisteredProduct] = useState(null);
  const [qrModalProduct, setQrModalProduct] = useState(null);
  
  // Estados para los nuevos modales
  const [actionsModalProduct, setActionsModalProduct] = useState(null);
  const [deleteModalProduct, setDeleteModalProduct] = useState(null);
  const [editModalProduct, setEditModalProduct] = useState(null);
  const [labelQuantities, setLabelQuantities] = useState({});

  // Cargar productos del backend
  const load = async () => {
    try {
      const res = await api.getProductos();
      const body = await res.json().catch(() => null);
      if (res.ok && Array.isArray(body)) {
        setProductos(body);
        setFilteredProductos(body);
        
        const initialQuantities = {};
        body.forEach(producto => {
          initialQuantities[producto.id_producto] = 1;
        });
        setLabelQuantities(initialQuantities);
      }
    } catch (err) {
      console.error("Error al cargar productos:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Filtrar productos por nombre
  useEffect(() => {
    const filtered = productos.filter((p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProductos(filtered);
  }, [searchTerm, productos]);

  // 💾 Manejo de registro de producto
  const handleRegisterSuccess = (body) => {
    setMessage("✅ Producto creado: " + (body?.nombre || ""));
    setLastRegisteredProduct(body);
    setShowRegister(false);
    setShowConfirm(true);
    load();
  };

  // 🛠️ Funciones para el modal de confirmación
  const handleConfirmRegister = () => {
    setShowConfirm(false);
    setShowRegister(true);
  };

  const handleConfirmUpdateStock = () => {
    setShowConfirm(false);
    setShowUpdateStock(true);
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
  };

  const handleUpdateSuccess = () => {
    setMessage("✅ Stock actualizado correctamente");
    setShowUpdateStock(false);
    load();
  };

  // Abrir modal al hacer click en QR
  const handleQrClick = (producto) => {
    setQrModalProduct(producto);
  };

  // Cerrar modal QR
  const closeQrModal = () => {
    setQrModalProduct(null);
  };

  // Funciones para el modal de acciones
  const openActionsModal = (producto) => {
    setActionsModalProduct(producto);
  };

  const closeActionsModal = () => {
    setActionsModalProduct(null);
  };

  // Funciones para eliminar
  const openDeleteModal = (producto) => {
    setDeleteModalProduct(producto);
    closeActionsModal();
  };

  const closeDeleteModal = () => {
    setDeleteModalProduct(null);
  };

  const handleDeleteProduct = async (producto) => {
    try {
      // Usar la ruta correcta del backend: DELETE /api/productos/nombre/{nombre}
      const res = await api.deleteProducto(producto.nombre);
      
      if (res.ok) {
        const result = await res.json();
        setMessage("✅ Producto eliminado: " + producto.nombre);
        closeDeleteModal();
        load();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Error al eliminar' }));
        setMessage("❌ " + (errorData.error || 'Error al eliminar el producto'));
      }
    } catch (err) {
      setMessage("❌ Error de conexión al eliminar el producto");
    }
  };

  // Funciones para editar
  const openEditModal = (producto) => {
    setEditModalProduct(producto);
    closeActionsModal();
  };

  const closeEditModal = () => {
    setEditModalProduct(null);
  };

  const handleEditSuccess = () => {
    setMessage("✅ Producto actualizado correctamente");
    load();
  };

  // Función para imprimir etiquetas CORREGIDA
  const handlePrintLabels = (producto) => {
    const quantity = labelQuantities[producto.id_producto] || 1;
    
    // Crear una ventana de impresión
    const printWindow = window.open('', '_blank');
    
    // Obtener la URL del QR si existe
    const qrUrl = producto.codigo_qr ? `${API_BASE}/api/productos/qr/${producto.codigo_qr}` : null;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Etiquetas - ${producto.nombre}</title>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            justify-content: center;
            background: white;
          }
          .label {
            width: 300px;
            height: 200px;
            border: 1px solid #000;
            padding: 15px;
            margin: 5px;
            text-align: center;
            page-break-inside: avoid;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .product-name {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
            text-transform: uppercase;
          }
          .barcode-container {
            margin: 5px 0;
            display: flex;
            justify-content: center;
          }
          .barcode {
            max-width: 100%;
            height: 40px;
          }
          .qr-container {
            margin: 5px 0;
            display: flex;
            justify-content: center;
          }
          .qr-image {
            width: 80px;
            height: 80px;
          }
          .price {
            font-size: 18px;
            font-weight: bold;
            color: #2c5aa0;
            margin: 5px 0;
          }
          .description {
            font-size: 12px;
            color: #666;
            margin: 5px 0;
          }
          .code-text {
            font-size: 10px;
            color: #333;
            margin: 2px 0;
          }
          @media print {
            body { 
              margin: 0; 
              padding: 10px;
              background: white !important;
            }
            .label { 
              border: 1px solid #000;
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
    `);

    // Generar las etiquetas
    for (let i = 0; i < quantity; i++) {
      printWindow.document.write(`
        <div class="label">
          <div>
            <div class="product-name">${producto.nombre}</div>
            ${producto.precio ? `<div class="price">$${parseFloat(producto.precio).toFixed(2)}</div>` : ''}
            ${producto.descripcion ? `<div class="description">${producto.descripcion}</div>` : ''}
          </div>
          
          <div>
            ${producto.codigo_barras ? `
              <div class="barcode-container">
                <svg class="barcode" id="barcode-${i}"></svg>
              </div>
              <div class="code-text">Código: ${producto.codigo_barras}</div>
            ` : ''}
            
            ${qrUrl ? `
              <div class="qr-container">
                <img src="${qrUrl}" alt="QR Code" class="qr-image" onerror="this.style.display='none'">
              </div>
            ` : `
              <div class="qr-container">
                <div style="color: #999; font-size: 10px;">QR no disponible</div>
              </div>
            `}
          </div>
        </div>
      `);
    }

    printWindow.document.write(`
        <script>
          // Generar códigos de barras después de que se cargue la página
          window.onload = function() {
            // Generar códigos de barras
            ${producto.codigo_barras ? `
              try {
                JsBarcode('.barcode', '${producto.codigo_barras}', {
                  format: "EAN13",
                  width: 2,
                  height: 40,
                  displayValue: false,
                  background: "#ffffff",
                  lineColor: "#000000"
                });
              } catch (error) {
                console.error('Error generando código de barras:', error);
                document.querySelectorAll('.barcode').forEach(bc => {
                  bc.innerHTML = '<text x="50%" y="50%" text-anchor="middle">${producto.codigo_barras}</text>';
                });
              }
            ` : ''}
            
            // Esperar a que las imágenes QR se carguen
            setTimeout(function() {
              window.print();
              // Cerrar después de imprimir
              setTimeout(function() {
                window.close();
              }, 500);
            }, 1000);
          }
          
          // Manejar errores de carga de imágenes QR
          document.addEventListener('error', function(e) {
            if (e.target.tagName === 'IMG' && e.target.className === 'qr-image') {
              e.target.style.display = 'none';
              const container = e.target.parentElement;
              container.innerHTML = '<div style="color: #999; font-size: 10px;">QR no disponible</div>';
            }
          }, true);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    
    setMessage(`🖨️ Imprimiendo ${quantity} etiquetas para ${producto.nombre}`);
    closeActionsModal();
  };

  // Manejar cambio en la cantidad de etiquetas
  const handleQuantityChange = (productId, value) => {
    const quantity = parseInt(value) || 1;
    if (quantity > 0 && quantity <= 100) {
      setLabelQuantities(prev => ({
        ...prev,
        [productId]: quantity
      }));
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📦 Inventario</h1>

      <div style={styles.actionsRow}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="🔍 Buscar producto por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.buttonGroup}>
          <button
            style={styles.buttonPrimary}
            onClick={() => setShowRegister(true)}
          >
            Registrar producto
          </button>
          <button
            style={styles.buttonSecondary}
            onClick={() => setShowUpdateStock(true)}
          >
            Actualizar stock
          </button>
          <button style={styles.buttonClose} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      {/* Tabla de productos */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Imagen</th>
            <th style={styles.th}>Nombre</th>
            <th style={styles.th}>Descripción</th>
            <th style={styles.th}>Cantidad</th>
            <th style={styles.th}>Precio</th>
            <th style={styles.th}>Código de barras</th>
            <th style={styles.th}>QR</th>
            <th style={styles.th}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredProductos.length > 0 ? (
            filteredProductos.map((p) => (
              <tr key={p.id_producto} style={styles.tr}>
                <td style={styles.td}>
                  {p.imagen_url ? (
                    <img
                      src={`${API_BASE}${p.imagen_url}`}
                      alt={p.nombre}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "";
                        e.currentTarget.alt = "Imagen no disponible";
                      }}
                      style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 6, background: "#fff" }}
                    />
                  ) : (
                    <span style={{ color: "#8b6b4a", fontStyle: "italic" }}>Sin imagen</span>
                  )}
                </td>
                <td style={styles.td}>{p.nombre}</td>
                <td style={styles.td}>{p.descripcion}</td>
                <td style={styles.td}>{p.cantidad}</td>
                <td style={styles.td}>${p.precio}</td>
                <td style={styles.td}>
                  {p.codigo_barras ? (
                    <div style={{ background: "#fff", padding: 6, borderRadius: 6, display: "inline-block" }}>
                      <Barcode
                        value={String(p.codigo_barras)}
                        format="EAN13"
                        width={1.5}
                        height={50}
                        displayValue
                        background="#ffffff"
                        lineColor="#000000"
                      />
                    </div>
                  ) : (
                    <span style={{ color: "#8b6b4a", fontStyle: "italic" }}>Sin código</span>
                  )}
                </td>
                <td style={styles.td}>
                  <div style={{ display: "inline-block", background: "#fff", padding: 6, borderRadius: 6 }} onClick={() => handleQrClick(p)}>
                    <QRImage value={JSON.stringify({ id_producto: p.id_producto, nombre: p.nombre })} size={100} />
                  </div>
                </td>
                <td style={styles.td}>
                  <div style={styles.labelActions}>
                    <div style={styles.quantityInputContainer}>
                      <label style={styles.quantityLabel}>Etiquetas:</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={labelQuantities[p.id_producto] || 1}
                        onChange={(e) => handleQuantityChange(p.id_producto, e.target.value)}
                        style={styles.quantityInput}
                      />
                    </div>
                    <button
                      onClick={() => openActionsModal(p)}
                      style={styles.actionsButton}
                    >
                      ⚙️ Acciones
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" style={styles.noData}>
                No se encontraron productos.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modales existentes */}
      {showRegister && (
        <RegisterProductModal
          onClose={() => setShowRegister(false)}
          onSuccess={handleRegisterSuccess}
        />
      )}
      {showUpdateStock && (
        <UpdateStockModal
          onClose={() => setShowUpdateStock(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}
      {showConfirm && (
        <ConfirmModal
          isOpen={showConfirm}
          title="¿Qué deseas hacer?"
          message={`Producto creado: ${lastRegisteredProduct?.nombre || ""}`}
          onConfirm={handleConfirmRegister}
          onCancel={handleConfirmUpdateStock}
          onClose={handleCancelConfirm}
        />
      )}

      {/* Modal QR */}
      {qrModalProduct && (
        <ProductQRModal
          producto={qrModalProduct}
          onClose={closeQrModal}
        />
      )}

      {/* Nuevos Modales */}
      <ProductActionsModal
        isOpen={!!actionsModalProduct}
        onClose={closeActionsModal}
        producto={actionsModalProduct}
        onPrint={handlePrintLabels}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
      />

      <DeleteConfirmModal
        isOpen={!!deleteModalProduct}
        onClose={closeDeleteModal}
        producto={deleteModalProduct}
        onConfirm={handleDeleteProduct}
      />

      <EditProductModal
        isOpen={!!editModalProduct}
        onClose={closeEditModal}
        producto={editModalProduct}
        onSuccess={handleEditSuccess}
        setMessage={setMessage}
      />
    </div>
  );
}

// 🎨 Estilos para los modales (basados en el modal de reportes)
const modalStyles = {
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
  productName: {
    textAlign: 'center',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    color: '#5a432c',
    padding: '0.5rem',
    backgroundColor: '#e8dfd0',
    borderRadius: '6px',
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
    fontSize: '0.9rem',
  },
  input: {
    padding: '0.6rem',
    borderRadius: '6px',
    border: '1px solid #c2a878',
    backgroundColor: '#fffdf8',
    color: '#3e2c1c',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
  },
  row: {
    display: 'flex',
    gap: '1rem',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '1rem',
  },
  buttonGroupVertical: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    marginTop: '1rem',
  },
  buttonPrimary: {
    backgroundColor: '#a67c52',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1.4rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    fontSize: '0.9rem',
  },
  buttonSecondary: {
    backgroundColor: '#c2a878',
    color: '#3e2c1c',
    border: 'none',
    padding: '0.8rem 1.4rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    fontSize: '0.9rem',
  },
  buttonDanger: {
    backgroundColor: '#b26a55',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1.4rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    fontSize: '0.9rem',
  },
  buttonCancel: {
    backgroundColor: '#8b6b4a',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1.4rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    fontSize: '0.9rem',
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
  warningBox: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    borderLeft: '5px solid #ffc107',
    padding: '0.7rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  confirmMessage: {
    textAlign: 'center',
    marginBottom: '1rem',
    fontSize: '1rem',
    lineHeight: '1.4',
  }
};

// 🎨 Estilos existentes
const styles = {
  container: {
    backgroundColor: "#f5f1e3",
    color: "#4b3621",
    padding: "2rem",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    maxWidth: "1100px",
    margin: "2rem auto",
    fontFamily: '"Poppins", sans-serif'
  },
  title: { textAlign: "center", color: "#3e2c1c", fontSize: "2rem", marginBottom: "1.5rem" },
  actionsRow: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" },
  searchContainer: { width: "100%", display: "flex", justifyContent: "center" },
  searchInput: { width: "80%", padding: "0.7rem 1rem", border: "1px solid #c2a878", borderRadius: "8px", fontSize: "1rem", outline: "none", color: "#3e2c1c", backgroundColor: "#fff8ef" },
  buttonGroup: { display: "flex", justifyContent: "center", gap: "1rem" },
  buttonPrimary: { backgroundColor: "#a67c52", color: "white", border: "none", padding: "0.7rem 1.2rem", borderRadius: "8px", cursor: "pointer", transition: "all 0.3s ease" },
  buttonSecondary: { backgroundColor: "#c2a878", color: "#3e2c1c", border: "none", padding: "0.7rem 1.2rem", borderRadius: "8px", cursor: "pointer", transition: "all 0.3s ease" },
  buttonClose: { backgroundColor: "#8b6b4a", color: "white", border: "none", padding: "0.7rem 1.2rem", borderRadius: "8px", cursor: "pointer", transition: "all 0.3s ease" },
  message: { backgroundColor: "#e0d6c2", borderLeft: "5px solid #8b6b4a", padding: "0.8rem", borderRadius: "6px", marginBottom: "1rem", textAlign: "center", fontWeight: "500" },
  table: { width: "100%", borderCollapse: "collapse", backgroundColor: "#fff8ef", borderRadius: "8px", overflow: "hidden" },
  th: { backgroundColor: "#a67c52", color: "white", padding: "0.8rem", textAlign: "left" },
  tr: { borderBottom: "1px solid #d2b48c" },
  td: { padding: "0.7rem", color: "#3e2c1c" },
  noData: { textAlign: "center", padding: "1rem", color: "#6b4f3b", fontStyle: "italic" },
  labelActions: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    alignItems: "center"
  },
  quantityInputContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  quantityLabel: {
    fontSize: "0.8rem",
    color: "#6b4f3b"
  },
  quantityInput: {
    width: "60px",
    padding: "0.3rem",
    border: "1px solid #c2a878",
    borderRadius: "4px",
    textAlign: "center"
  },
  actionsButton: {
    backgroundColor: "#5a6b8c",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    transition: "all 0.3s ease"
  }
};