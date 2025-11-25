import React, { useState, useEffect } from 'react';
import api from '../api/api';
import Marco from "../images/Marco.png";

function CategoriesModal({ isOpen, onClose, onCategorySelect, selectedCategory }) {
  const [categorias, setCategorias] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({ type: '', message: '', categoriaProducto: null });

  // Mostrar notificación en modal
  const showNotification = (type, message, categoriaProducto = null) => {
    setNotificationData({ type, message, categoriaProducto });
    setShowNotificationModal(true);
  };

  // Cerrar modal de notificación
  const closeNotification = () => {
    setShowNotificationModal(false);
    setNotificationData({ type: '', message: '', categoriaProducto: null });
  };

  // Cargar categorías
  const loadCategorias = async () => {
    try {
      const res = await api.getCategorias();
      if (res.ok) {
        const data = await res.json();
        setCategorias(data);
      } else {
        showNotification('error', 'Error al cargar categorías');
      }
    } catch (err) {
      showNotification('error', 'Error de conexión al cargar categorías');
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategorias();
      setError(null);
      setMessage(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.postCategoria(formData);
      if (res.ok) {
        const result = await res.json();
        showNotification('success', '✅ Categoría creada exitosamente');
        setFormData({ nombre: '', descripcion: '' });
        setShowAddForm(false);
        loadCategorias();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Error al crear categoría' }));
        showNotification('error', errorData.error || 'Error al crear categoría');
      }
    } catch (err) {
      showNotification('error', 'Error de conexión al crear categoría');
    } finally {
      setLoading(false);
    }
  };

  // Verificar si una categoría tiene productos asociados
  const checkCategoriaHasProducts = async (idCategoria) => {
    try {
      const res = await api.getProductos();
      if (res.ok) {
        const productos = await res.json();
        const productosEnCategoria = productos.filter(producto => 
          producto.id_categoria === idCategoria
        );
        return productosEnCategoria.length > 0 ? productosEnCategoria : null;
      }
      return null;
    } catch (err) {
      console.error('Error al verificar productos:', err);
      return null;
    }
  };

  const handleDeleteClick = async (categoria) => {
    // Verificar si la categoría tiene productos antes de eliminar
    const productosAsociados = await checkCategoriaHasProducts(categoria.id_categoria);
    
    if (productosAsociados && productosAsociados.length > 0) {
      // Mostrar modal de notificación con información de productos
      showNotification(
        'warning', 
        `No se puede eliminar la categoría "${categoria.nombre}" porque tiene productos asociados.`,
        {
          categoria: categoria,
          productos: productosAsociados
        }
      );
      return;
    }

    // Si no tiene productos, proceder con la eliminación
    setCategoriaToDelete(categoria);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoriaToDelete) return;

    try {
      const res = await api.deleteCategoria(categoriaToDelete.id_categoria);
      if (res.ok) {
        showNotification('success', '✅ Categoría eliminada exitosamente');
        loadCategorias();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Error al eliminar categoría' }));
        showNotification('error', errorData.error || 'Error al eliminar categoría');
      }
    } catch (err) {
      showNotification('error', 'Error de conexión al eliminar categoría');
    } finally {
      setShowDeleteModal(false);
      setCategoriaToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setCategoriaToDelete(null);
  };

  const handleCategorySelect = (categoria) => {
    if (onCategorySelect) {
      onCategorySelect(categoria);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <h2 style={modalStyles.title}>📁 Gestión de Categorías</h2>

        {/* Botón para agregar nueva categoría */}
        {!showAddForm && (
          <button
            style={modalStyles.buttonPrimary}
            onClick={() => setShowAddForm(true)}
          >
            ➕ Nueva Categoría
          </button>
        )}

        {/* Formulario para agregar categoría */}
        {showAddForm && (
          <form onSubmit={handleSubmit} style={modalStyles.form}>
            <h3 style={modalStyles.subtitle}>Agregar Nueva Categoría</h3>
            <label style={modalStyles.label}>
              Nombre:
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                style={modalStyles.input}
                required
                placeholder="Ej: Electrónicos"
              />
            </label>
            <label style={modalStyles.label}>
              Descripción:
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                style={{...modalStyles.input, minHeight: '80px'}}
                placeholder="Ej: Productos electrónicos y dispositivos"
              />
            </label>
            <div style={modalStyles.buttonGroup}>
              <button 
                type="submit" 
                style={{...modalStyles.buttonPrimary, opacity: loading ? 0.7 : 1}}
                disabled={loading}
              >
                {loading ? 'Creando...' : '💾 Guardar'}
              </button>
              <button 
                type="button"
                style={modalStyles.buttonCancel}
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ nombre: '', descripcion: '' });
                }}
              >
                ✖ Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Lista de categorías existentes */}
        <div style={modalStyles.categoriesList}>
          <h3 style={modalStyles.subtitle}>Categorías Existentes</h3>
          {categorias.length === 0 ? (
            <p style={modalStyles.noData}>No hay categorías registradas</p>
          ) : (
            categorias.map(categoria => (
              <div 
                key={categoria.id_categoria} 
                style={{
                  ...modalStyles.categoryItem,
                  ...(selectedCategory?.id_categoria === categoria.id_categoria ? modalStyles.selectedCategory : {})
                }}
              >
                <div 
                  style={modalStyles.categoryContent}
                  onClick={() => handleCategorySelect(categoria)}
                >
                  <div style={modalStyles.categoryName}>{categoria.nombre}</div>
                  {categoria.descripcion && (
                    <div style={modalStyles.categoryDesc}>{categoria.descripcion}</div>
                  )}
                </div>
                <button
                  style={modalStyles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(categoria);
                  }}
                  title="Eliminar categoría"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        <div style={modalStyles.buttonGroup}>
          <button 
            style={modalStyles.buttonCancel}
            onClick={onClose}
          >
            ✖ Cerrar
          </button>
        </div>
      </div>

      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && (
        <div style={modalStyles.confirmOverlay}>
          <div style={modalStyles.confirmModal}>
            <h2 style={modalStyles.confirmTitle}>🗑️ Eliminar Categoría</h2>

            <div style={modalStyles.confirmContent}>
              <p style={modalStyles.confirmText}>
                ¿Estás seguro de que deseas eliminar la categoría?
              </p>
              <div style={modalStyles.categoryInfo}>
                <strong style={modalStyles.categoryNameConfirm}>
                  "{categoriaToDelete?.nombre}"
                </strong>
                {categoriaToDelete?.descripcion && (
                  <p style={modalStyles.categoryDescConfirm}>
                    {categoriaToDelete.descripcion}
                  </p>
                )}
              </div>
              <p style={modalStyles.warningText}>
                ⚠️ Esta acción no se puede deshacer
              </p>
            </div>

            <div style={modalStyles.confirmButtonGroup}>
              <button 
                style={modalStyles.confirmDeleteButton}
                onClick={handleConfirmDelete}
              >
                ✅ Aceptar
              </button>
              <button 
                style={modalStyles.buttonCancel}
                onClick={handleCancelDelete}
              >
                ✖ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de notificaciones */}
      {showNotificationModal && (
        <div style={modalStyles.notificationOverlay}>
          <div style={modalStyles.notificationModal}>
            <div style={{
              ...modalStyles.notificationHeader,
              backgroundColor: notificationData.type === 'success' ? '#4caf50' : 
                              notificationData.type === 'warning' ? '#ff9800' : '#f44336'
            }}>
              {notificationData.type === 'success' ? '✅ Éxito' : 
               notificationData.type === 'warning' ? '⚠️ Advertencia' : '❌ Error'}
            </div>
            
            <div style={modalStyles.notificationContent}>
              <p style={modalStyles.notificationText}>{notificationData.message}</p>
              
              {/* Mostrar información de productos si la categoría tiene productos */}
              {notificationData.categoriaProducto && (
                <div style={modalStyles.productosInfo}>
                  <h4 style={modalStyles.productosTitle}>
                    Productos en esta categoría:
                  </h4>
                  <div style={modalStyles.productosList}>
                    {notificationData.categoriaProducto.productos.map((producto, index) => (
                      <div key={index} style={modalStyles.productoItem}>
                        <strong>• {producto.nombre}</strong>
                        {producto.descripcion && (
                          <span style={modalStyles.productoDesc}>
                            - {producto.descripcion}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p style={modalStyles.productosCount}>
                    Total: {notificationData.categoriaProducto.productos.length} producto(s)
                  </p>
                </div>
              )}
            </div>

            <div style={modalStyles.notificationButtons}>
              <button 
                style={modalStyles.buttonPrimary}
                onClick={closeNotification}
              >
                ✅ Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  confirmOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(75, 54, 33, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
  notificationOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(75, 54, 33, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1002,
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
  confirmModal: {
    backgroundColor: '#f5f1e3',
    color: '#4b3621',
    borderRadius: '14px',
    padding: '2rem',
    width: '400px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
    fontFamily: '"Poppins", sans-serif',
    animation: 'fadeIn 0.3s ease-in-out',
    backgroundImage: `url(${Marco})`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  },
  notificationModal: {
    backgroundColor: '#f5f1e3',
    color: '#4b3621',
    borderRadius: '14px',
    width: '450px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
    fontFamily: '"Poppins", sans-serif',
    animation: 'fadeIn 0.3s ease-in-out',
    backgroundImage: `url(${Marco})`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    overflow: 'hidden',
  },
  notificationHeader: {
    padding: '1rem',
    color: 'white',
    textAlign: 'center',
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
  notificationContent: {
    padding: '1.5rem',
  },
  notificationText: {
    fontSize: '1rem',
    marginBottom: '1rem',
    lineHeight: '1.5',
    textAlign: 'center',
  },
  notificationButtons: {
    padding: '1rem',
    display: 'flex',
    justifyContent: 'center',
    borderTop: '1px solid #d2b48c',
  },
  productosInfo: {
    backgroundColor: '#fff8ef',
    border: '1px solid #d2b48c',
    borderRadius: '8px',
    padding: '1rem',
    marginTop: '1rem',
  },
  productosTitle: {
    fontSize: '1rem',
    color: '#3e2c1c',
    marginBottom: '0.8rem',
    textAlign: 'center',
  },
  productosList: {
    maxHeight: '150px',
    overflowY: 'auto',
    marginBottom: '0.8rem',
  },
  productoItem: {
    padding: '0.4rem 0',
    borderBottom: '1px solid #e8dfd0',
    fontSize: '0.9rem',
  },
  productoDesc: {
    color: '#6b4f3b',
    fontSize: '0.85rem',
    marginLeft: '0.5rem',
    fontStyle: 'italic',
  },
  productosCount: {
    textAlign: 'center',
    fontSize: '0.9rem',
    color: '#8b6b4a',
    fontWeight: 'bold',
    margin: 0,
  },
  // ... (el resto de los estilos se mantienen igual)
  title: {
    textAlign: 'center',
    fontSize: '1.6rem',
    marginBottom: '1.2rem',
    color: '#3e2c1c',
  },
  confirmTitle: {
    textAlign: 'center',
    fontSize: '1.6rem',
    marginBottom: '1.2rem',
    color: '#b26a55',
  },
  confirmContent: {
    marginBottom: '1.5rem',
  },
  confirmText: {
    fontSize: '1rem',
    marginBottom: '1rem',
    lineHeight: '1.5',
    textAlign: 'center',
  },
  categoryInfo: {
    backgroundColor: '#fff8ef',
    border: '1px solid #d2b48c',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    textAlign: 'center',
  },
  categoryNameConfirm: {
    fontSize: '1.1rem',
    color: '#3e2c1c',
    display: 'block',
    marginBottom: '0.5rem',
  },
  categoryDescConfirm: {
    fontSize: '0.9rem',
    color: '#6b4f3b',
    margin: 0,
    fontStyle: 'italic',
  },
  warningText: {
    fontSize: '0.9rem',
    color: '#b26a55',
    textAlign: 'center',
    fontWeight: 'bold',
    margin: 0,
  },
  subtitle: {
    fontSize: '1.1rem',
    marginBottom: '1rem',
    color: '#5a432c',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: '#e8dfd0',
    borderRadius: '8px',
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
    fontSize: '0.9rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.8rem',
    marginTop: '1rem',
    justifyContent: 'center',
  },
  confirmButtonGroup: {
    display: 'flex',
    gap: '0.8rem',
    marginTop: '1rem',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#a67c52',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1.4rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
  },
  buttonCancel: {
    backgroundColor: '#8b6b4a',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1.4rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
  },
  confirmDeleteButton: {
    backgroundColor: '#b26a55',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1.4rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    fontWeight: 'bold',
  },
  categoriesList: {
    marginTop: '1rem',
  },
  categoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.8rem',
    marginBottom: '0.5rem',
    backgroundColor: '#fff8ef',
    borderRadius: '6px',
    border: '1px solid #d2b48c',
    transition: 'all 0.3s ease',
  },
  categoryContent: {
    flex: 1,
    cursor: 'pointer',
  },
  selectedCategory: {
    backgroundColor: '#e8dfd0',
    borderColor: '#a67c52',
    borderWidth: '2px',
  },
  categoryName: {
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  categoryDesc: {
    fontSize: '0.8rem',
    color: '#6b4f3b',
    marginTop: '0.3rem',
  },
  deleteButton: {
    backgroundColor: '#b26a55',
    color: 'white',
    border: 'none',
    padding: '0.4rem 0.6rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    transition: 'all 0.3s ease',
  },
  noData: {
    textAlign: 'center',
    color: '#8b6b4a',
    fontStyle: 'italic',
    padding: '1rem',
  }
};

// Añadir la animación al documento si no existe
if (typeof document !== 'undefined') {
  const styleSheet = document.styleSheets[0];
  const keyframes = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  `;
  
  let animationExists = false;
  try {
    for (let i = 0; i < styleSheet.cssRules.length; i++) {
      if (styleSheet.cssRules[i].name === 'fadeIn') {
        animationExists = true;
        break;
      }
    }
  } catch (e) {
    animationExists = false;
  }
  
  if (!animationExists) {
    try {
      styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
    } catch (e) {
      console.log('No se pudo insertar la animación fadeIn:', e);
    }
  }
}

export default CategoriesModal;