import React, { useState, useEffect } from "react";
import PageBackground from "./PageBackground";
import Barcode from "react-barcode";
import RegisterProductModal from "./RegisterProductModal";
import UpdateStockModal from "./UpdateStockModal";
import ConfirmModal from "./ConfirmModal";
import api, { API_BASE } from "../api/api";
import CategoriesModal from "./CategoriesModal";
import Marco from "../images/Marco.png";

// Modal de Éxito para Producto Creado
function SuccessModal({ isOpen, onClose, productName, onContinue }) {
  if (!isOpen) return null;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.successContent}>
          <div style={modalStyles.successIcon}>✅</div>
          <h2 style={modalStyles.successTitle}>¡Producto Creado!</h2>
          <p style={modalStyles.successMessage}>
            El producto <strong>"{productName}"</strong> se ha registrado exitosamente en el sistema.
          </p>
          <div style={modalStyles.buttonGroup}>
            <button
              style={modalStyles.buttonPrimary}
              onClick={onContinue}
            >
              ➕ Registrar Otro Producto
            </button>
            <button
              style={modalStyles.buttonSecondary}
              onClick={onClose}
            >
              📦 Ir al Inventario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal de Éxito Genérico para diferentes acciones
function ActionSuccessModal({ isOpen, onClose, title, message, buttonText, onButtonClick }) {
  if (!isOpen) return null;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.successContent}>
          <div style={modalStyles.successIcon}>✅</div>
          <h2 style={modalStyles.successTitle}>{title}</h2>
          <p style={modalStyles.successMessage}>{message}</p>
          <div style={modalStyles.buttonGroup}>
            <button
              style={modalStyles.buttonPrimary}
              onClick={onButtonClick || onClose}
            >
              {buttonText || 'Aceptar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal de Éxito para Impresión
function PrintSuccessModal({ isOpen, onClose, productName, quantity }) {
  if (!isOpen) return null;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.successContent}>
          <div style={modalStyles.successIcon}>🖨️</div>
          <h2 style={modalStyles.successTitle}>¡Etiquetas Listas!</h2>
          <p style={modalStyles.successMessage}>
            Se han generado <strong>{quantity} etiquetas</strong> para el producto <strong>"{productName}"</strong>.
            <br />
            <em>La ventana de impresión se abrirá automáticamente.</em>
          </p>
          <div style={modalStyles.buttonGroup}>
            <button
              style={modalStyles.buttonPrimary}
              onClick={onClose}
            >
              ✅ Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [categorias, setCategorias] = useState([]);

  // Cargar categorías
  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const res = await api.getCategorias();
        if (res.ok) {
          const data = await res.json();
          setCategorias(data);
        }
      } catch (err) {
        console.error('Error cargando categorías:', err);
      }
    };

    if (isOpen) {
      loadCategorias();
    }
  }, [isOpen]);

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio: producto.precio || '',
        cantidad: producto.cantidad || '',
        id_categoria: producto.id_categoria || ''
      });
    }
  }, [producto]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.patchActualizarProducto(producto.id_producto, formData);
      
      if (res.ok) {
        const result = await res.json();
        onSuccess(producto.nombre);
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
                style={modalStyles.numberInput}
                step="0.01"
                min="0"
                placeholder="0.00"
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
                style={modalStyles.numberInput}
                min="0"
                placeholder="0"
                required
              />
            </label>
          </div>

          <label style={modalStyles.label}>
            Categoría:
            <select
              name="id_categoria"
              value={formData.id_categoria || ''}
              onChange={handleChange}
              style={modalStyles.input}
            >
              <option value="">Sin categoría</option>
              {categorias.map(cat => (
                <option key={cat.id_categoria} value={cat.id_categoria}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </label>

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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [productos, setProductos] = useState([]);
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastRegisteredProduct, setLastRegisteredProduct] = useState(null);
  
  // Estados para los nuevos modales
  const [actionsModalProduct, setActionsModalProduct] = useState(null);
  const [deleteModalProduct, setDeleteModalProduct] = useState(null);
  const [editModalProduct, setEditModalProduct] = useState(null);
  const [labelQuantities, setLabelQuantities] = useState({});

  // Estados para los modales de éxito - CORREGIDOS
  const [showEditSuccessModal, setShowEditSuccessModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [showPrintSuccessModal, setShowPrintSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState({});

  // NUEVO: Estado para actualización de categorías
  const [categoriesRefreshTrigger, setCategoriesRefreshTrigger] = useState(0);

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
          initialQuantities[producto.id_producto] = '';
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

  // 💾 Manejo de registro de producto - FLUJO CORREGIDO
  const handleRegisterSuccess = (body) => {
    setLastRegisteredProduct(body);
    setShowRegister(false);
    setShowSuccessModal(true); // Primero mostrar modal de éxito
    load();
  };

  // Funciones para el modal de éxito
  const handleContinueRegister = () => {
    setShowSuccessModal(false);
    setShowRegister(true); // Volver a abrir el modal de registro
  };

  const handleGoToInventory = () => {
    setShowSuccessModal(false);
    // El usuario puede decidir qué hacer después
    setShowConfirm(true); // Ahora mostrar el modal "¿Qué deseas hacer?"
  };

  // 🛠️ Funciones para el modal de confirmación "¿Qué deseas hacer?"
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
    // Mostrar modal de éxito para actualización de stock
    setSuccessModalData({
      title: "✅ Stock Actualizado",
      message: "El stock de los productos ha sido actualizado exitosamente.",
      buttonText: "📦 Ver Inventario"
    });
    setShowUpdateStock(false);
    setShowEditSuccessModal(true); // Reutilizamos el modal de edición para stock
    load();
  };

  // Funciones para el modal de acciones
  const openActionsModal = (producto) => {
    setActionsModalProduct(producto);
  };

  const closeActionsModal = () => {
    setActionsModalProduct(null);
  };

  // Funciones para eliminar - CORREGIDAS
  const openDeleteModal = (producto) => {
    setDeleteModalProduct(producto);
    closeActionsModal();
  };

  const closeDeleteModal = () => {
    setDeleteModalProduct(null);
  };

  const handleDeleteProduct = async (producto) => {
    try {
      const res = await api.deleteProducto(producto.nombre);
      
      if (res.ok) {
        const result = await res.json();
        // Mostrar modal de éxito en lugar de mensaje - CORREGIDO
        setSuccessModalData({
          title: "✅ Producto Eliminado",
          message: `El producto "${producto.nombre}" ha sido eliminado exitosamente del sistema.`,
          buttonText: "📦 Ver Inventario"
        });
        setShowDeleteSuccessModal(true); // ESTA LÍNEA FALTABA
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

  // Funciones para editar - CORREGIDAS
  const openEditModal = (producto) => {
    setEditModalProduct(producto);
    closeActionsModal();
  };

  const closeEditModal = () => {
    setEditModalProduct(null);
  };

  const handleEditSuccess = (productName) => {
    // Mostrar modal de éxito en lugar de mensaje - CORREGIDO
    setSuccessModalData({
      title: "✅ Producto Actualizado",
      message: `El producto "${productName}" ha sido actualizado exitosamente.`,
      buttonText: "📦 Ver Cambios"
    });
    setShowEditSuccessModal(true); // ESTA LÍNEA FALTABA
    load();
  };

  // Función para imprimir etiquetas - CORREGIDA
  const handlePrintLabels = (producto) => {
    const quantity = parseInt(labelQuantities[producto.id_producto]) || 1;
    const validQuantity = Math.max(1, Math.min(300, quantity));

    // Mostrar modal de éxito primero - CORREGIDO
    setSuccessModalData({
      title: "🖨️ Etiquetas Generadas",
      message: `Se han generado ${validQuantity} etiquetas para "${producto.nombre}". La ventana de impresión se abrirá automáticamente.`,
      buttonText: "✅ Entendido"
    });
    setShowPrintSuccessModal(true); // ESTA LÍNEA FALTABA
    closeActionsModal();

    // Abrir ventana de impresión después de un breve delay
    setTimeout(() => {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Etiquetas - ${producto.nombre}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            /* Página optimizada para alta densidad */
            @page { margin: 6mm; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 4mm;
              display: flex;
              flex-wrap: wrap;
              gap: 4mm;
              background: #fff;
              justify-content: flex-start;
            }
            .label {
              width: 48mm; /* Tamaño cercano a etiqueta de rollo estándar */
              height: 30mm;
              border: 0.3mm solid #000;
              padding: 2mm 2mm 1mm 2mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-inside: avoid;
              overflow: hidden;
            }
            .product-name {
              font-weight: bold;
              font-size: 9pt;
              line-height: 1.1;
              text-transform: uppercase;
              max-height: 2.2em;
              overflow: hidden;
            }
            .barcode-container { flex: 1; display: flex; align-items: center; justify-content: center; }
            .barcode { width: 100%; height: 16mm; }
            .price {
              font-size: 10pt;
              font-weight: bold;
              text-align: center;
              margin-top: 2px;
            }
            .code-text { font-size: 7pt; text-align: center; margin-top: 1px; letter-spacing: 0.5px; }
            @media print { body { padding: 2mm; } .label { border: 0.2mm solid #000; } }
          </style>
        </head>
        <body>
      `);

      for (let i = 0; i < validQuantity; i++) {
        printWindow.document.write(`
          <div class="label">
            <div class="product-name">${producto.nombre}</div>
            <div class="barcode-container">
              <svg class="barcode"></svg>
            </div>
            ${producto.codigo_barras ? `<div class="code-text">${producto.codigo_barras}</div>` : ''}
            ${producto.precio ? `<div class="price">$${parseFloat(producto.precio).toFixed(2)}</div>` : ''}
          </div>
        `);
      }

      printWindow.document.write(`
        <script>
          window.onload = function() {
            try {
              if ('${producto.codigo_barras}') {
                JsBarcode('.barcode', '${producto.codigo_barras}', {
                  format: 'EAN13',
                  width: 1,
                  height: 50,
                  displayValue: false,
                  margin: 0,
                  background: '#ffffff',
                  lineColor: '#000'
                });
              }
            } catch (e) {
              console.error('Error generando código de barras', e);
            }
            setTimeout(() => { window.print(); setTimeout(() => window.close(), 300); }, 300);
          };
        </script>
        </body></html>
      `);
      printWindow.document.close();
    }, 1000);
  };

  // Manejar cambio en la cantidad de etiquetas
  const handleQuantityChange = (productId, value) => {
    if (value === '') {
      setLabelQuantities(prev => ({
        ...prev,
        [productId]: ''
      }));
      return;
    }
    
    const quantity = parseInt(value);
    if (!isNaN(quantity) && quantity > 0 && quantity <= 100) {
      setLabelQuantities(prev => ({
        ...prev,
        [productId]: quantity
      }));
    }
  };

  // NUEVO: Manejar actualizaciones de categorías desde el modal
  const handleCategoriesUpdate = () => {
    // Forzar recarga de categorías en todos los componentes que las usen
    setCategoriesRefreshTrigger(prev => prev + 1);
  };

  return (
    <PageBackground>
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
          <button
            style={styles.buttonTertiary}
            onClick={() => setShowCategoriesModal(true)}
          >
            📁 Categorías
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
                  <div style={styles.labelActions}>
                    <div style={styles.quantityInputContainer}>
                      <label style={styles.quantityLabel}>Etiquetas:</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={labelQuantities[p.id_producto] || ''}
                        onChange={(e) => handleQuantityChange(p.id_producto, e.target.value)}
                        style={styles.quantityInput}
                        placeholder="1"
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
              <td colSpan="7" style={styles.noData}>
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

      {/* NUEVO: Modal de Éxito para Registro */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleGoToInventory}
        productName={lastRegisteredProduct?.nombre || ""}
        onContinue={handleContinueRegister}
      />

      {/* Modal de Confirmación "¿Qué deseas hacer?" - AHORA SE MUESTRA DESPUÉS DEL ÉXITO */}
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

      {/* Modal de Categorías - ACTUALIZADO */}
      {showCategoriesModal && (
        <CategoriesModal
          isOpen={showCategoriesModal}
          onClose={() => setShowCategoriesModal(false)}
          onCategorySelect={handleCategoriesUpdate}
          refreshTrigger={categoriesRefreshTrigger}
        />
      )}

      {/* Nuevos Modales de Acciones */}
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

      {/* NUEVOS: Modales de Éxito para todas las acciones - CORREGIDOS */}
      <ActionSuccessModal
        isOpen={showEditSuccessModal}
        onClose={() => setShowEditSuccessModal(false)}
        title={successModalData.title}
        message={successModalData.message}
        buttonText={successModalData.buttonText}
      />

      <ActionSuccessModal
        isOpen={showDeleteSuccessModal}
        onClose={() => setShowDeleteSuccessModal(false)}
        title={successModalData.title}
        message={successModalData.message}
        buttonText={successModalData.buttonText}
      />

      <ActionSuccessModal
        isOpen={showPrintSuccessModal}
        onClose={() => setShowPrintSuccessModal(false)}
        title={successModalData.title}
        message={successModalData.message}
        buttonText={successModalData.buttonText}
      />
    </div>
    </PageBackground>
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
    backgroundImage: `url(${Marco})`,
    backgroundSize: '100% 100%', // ajusta el marco exactamente al tamaño del modal
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center'
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
  // NUEVO: Estilo específico para inputs numéricos sin flechas
  numberInput: {
    padding: '0.6rem',
    borderRadius: '6px',
    border: '1px solid #c2a878',
    backgroundColor: '#fffdf8',
    color: '#3e2c1c',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontSize: '0.9rem',
    // Eliminar flechas en todos los navegadores
    MozAppearance: 'textfield',
    WebkitAppearance: 'none',
    appearance: 'textfield',
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
  },
  // Estilos para el modal de éxito
  successContent: {
    textAlign: 'center',
    padding: '1rem',
  },
  successIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  successTitle: {
    fontSize: '1.8rem',
    color: '#2d5016',
    marginBottom: '1rem',
    fontWeight: '600',
  },
  successMessage: {
    fontSize: '1.1rem',
    color: '#5a432c',
    marginBottom: '2rem',
    lineHeight: '1.5',
  },
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
    fontFamily: '"Poppins", sans-serif',
    //backgroundImage: `url(${Marco})`,
    backgroundSize: "100%", // o "100% 100%" si el marco es ajustado
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center"
  },
  title: { textAlign: "center", color: "#3e2c1c", fontSize: "2rem", marginBottom: "1.5rem" },
  actionsRow: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" },
  searchContainer: { width: "100%", display: "flex", justifyContent: "center" },
  searchInput: { width: "80%", padding: "0.7rem 1rem", border: "1px solid #c2a878", borderRadius: "8px", fontSize: "1rem", outline: "none", color: "#3e2c1c", backgroundColor: "#fff8ef" },
  buttonGroup: { display: "flex", justifyContent: "center", gap: "1rem" },
  buttonPrimary: { backgroundColor: "#a67c52", color: "white", border: "none", padding: "0.7rem 1.2rem", borderRadius: "8px", cursor: "pointer", transition: "all 0.3s ease" },
  buttonSecondary: { backgroundColor: "#c2a878", color: "#3e2c1c", border: "none", padding: "0.7rem 1.2rem", borderRadius: "8px", cursor: "pointer", transition: "all 0.3s ease" },
  buttonTertiary: { backgroundColor: "#5a6b8c", color: "white", border: "none", padding: "0.7rem 1.2rem", borderRadius: "8px", cursor: "pointer", transition: "all 0.3s ease" },
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
  // CAMBIADO: Input de cantidad sin flechas y con placeholder
  quantityInput: {
    width: "60px",
    padding: "0.3rem",
    border: "1px solid #c2a878",
    borderRadius: "4px",
    textAlign: "center",
    // Eliminar flechas en todos los navegadores
    MozAppearance: 'textfield',
    WebkitAppearance: 'none',
    appearance: 'textfield',
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

// Agregar estilos CSS globales para eliminar flechas en todos los inputs numéricos
const style = document.createElement('style');
style.textContent = `
  /* Eliminar flechas en todos los inputs numéricos */
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  input[type="number"] {
    -moz-appearance: textfield;
    appearance: textfield;
  }
`;
document.head.appendChild(style);