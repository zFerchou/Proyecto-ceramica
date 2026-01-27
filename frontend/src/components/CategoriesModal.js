import React, { useState, useEffect } from 'react';
import api from '../api/api'; // Importar api
import Marco from "../images/Marco.png";

const CATEGORIAS_PROTEGIDAS = [1, 2, 3];

function CategoriesModal({ isOpen, onClose, onCategorySelect, selectedCategory, refreshTrigger }) {
  const [categorias, setCategorias] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({ type: '', message: '', categoriaProducto: null });

  const isCategoriaProtegida = (idCategoria) => {
    return CATEGORIAS_PROTEGIDAS.includes(idCategoria);
  };

  const showNotification = (type, message, categoriaProducto = null) => {
    setNotificationData({ type, message, categoriaProducto });
    setShowNotificationModal(true);
  };

  const closeNotification = () => {
    setShowNotificationModal(false);
    setNotificationData({ type: '', message: '', categoriaProducto: null });
  };

  // Cargar categorías - CORREGIDO
  const loadCategorias = async () => {
    try {
      const data = await api.getCategorias(); // api.getCategorias() devuelve datos directamente
      if (Array.isArray(data)) {
        setCategorias(data);
      } else {
        showNotification('error', 'Error al cargar categorías');
      }
    } catch (err) {
      console.error('Error cargando categorías:', err);
      showNotification('error', 'Error de conexión al cargar categorías');
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategorias();
    }
  }, [isOpen, refreshTrigger]);

  const handleEditClick = (categoria) => {
    if (isCategoriaProtegida(categoria.id_categoria)) {
      showNotification('warning', `La categoría "${categoria.nombre}" es una categoría base y no se puede editar.`);
      return;
    }
    
    setEditingCategory(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || ''
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingCategory(null);
    setFormData({ nombre: '', descripcion: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // CORRECCIÓN: api.putCategoria devuelve datos directamente
      const result = await api.putCategoria(editingCategory.id_categoria, formData);
      
      if (result && !result.error) {
        showNotification('success', '✅ Categoría actualizada exitosamente');
        setFormData({ nombre: '', descripcion: '' });
        setShowEditForm(false);
        setEditingCategory(null);
        loadCategorias();
        
        if (typeof onCategorySelect === 'function') {
          onCategorySelect('updated', result);
        }
      } else {
        showNotification('error', result?.error || 'Error al actualizar categoría');
      }
    } catch (err) {
      console.error('Error actualizando categoría:', err);
      showNotification('error', 'Error de conexión al actualizar categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // CORRECCIÓN: api.postCategoria devuelve datos directamente
      const result = await api.postCategoria(formData);
      
      if (result && !result.error) {
        showNotification('success', '✅ Categoría creada exitosamente');
        setFormData({ nombre: '', descripcion: '' });
        setShowAddForm(false);
        loadCategorias();
        
        if (typeof onCategorySelect === 'function') {
          onCategorySelect('created', result);
        }
      } else {
        showNotification('error', result?.error || 'Error al crear categoría');
      }
    } catch (err) {
      console.error('Error creando categoría:', err);
      showNotification('error', 'Error de conexión al crear categoría');
    } finally {
      setLoading(false);
    }
  };

  const checkCategoriaHasProducts = async (idCategoria) => {
    try {
      const productos = await api.getProductos(); // api.getProductos() devuelve datos directamente
      if (Array.isArray(productos)) {
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
    if (isCategoriaProtegida(categoria.id_categoria)) {
      showNotification(
        'warning', 
        `No se puede eliminar la categoría "${categoria.nombre}" porque es una categoría base del sistema.`,
        categoria
      );
      return;
    }

    const productosAsociados = await checkCategoriaHasProducts(categoria.id_categoria);
    
    if (productosAsociados && productosAsociados.length > 0) {
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

    setCategoriaToDelete(categoria);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoriaToDelete) return;

    try {
      // CORRECCIÓN: api.deleteCategoria devuelve datos directamente
      const result = await api.deleteCategoria(categoriaToDelete.id_categoria);
      
      if (result && !result.error) {
        showNotification('success', '✅ Categoría eliminada exitosamente');
        loadCategorias();
        
        if (typeof onCategorySelect === 'function') {
          onCategorySelect('deleted', categoriaToDelete);
        }
      } else {
        showNotification('error', result?.error || 'Error al eliminar categoría');
      }
    } catch (err) {
      console.error('Error eliminando categoría:', err);
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
    if (onCategorySelect && typeof onCategorySelect === 'function') {
      onCategorySelect('selected', categoria);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <h2 style={modalStyles.title}>📁 Gestión de Categorías</h2>

        {!showAddForm && !showEditForm && (
          <button
            style={modalStyles.buttonPrimary}
            onClick={() => {
              setShowAddForm(true);
              setShowEditForm(false);
              setEditingCategory(null);
            }}
            disabled={loading}
          >
            ➕ Nueva Categoría
          </button>
        )}

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
                disabled={loading}
              />
            </label>
            <label style={modalStyles.label}>
              Descripción:
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                style={{...modalStyles.input, minHeight: '80px'}}
                placeholder="Ej: Productos electrónicos y dispositivos"
                disabled={loading}
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
                disabled={loading}
              >
                ✖ Cancelar
              </button>
            </div>
          </form>
        )}

        {showEditForm && (
          <form onSubmit={handleEditSubmit} style={modalStyles.form}>
            <h3 style={modalStyles.subtitle}>Editar Categoría</h3>
            <label style={modalStyles.label}>
              Nombre:
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                style={modalStyles.input}
                required
                placeholder="Ej: Electrónicos"
                disabled={loading}
              />
            </label>
            <label style={modalStyles.label}>
              Descripción:
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                style={{...modalStyles.input, minHeight: '80px'}}
                placeholder="Ej: Productos electrónicos y dispositivos"
                disabled={loading}
              />
            </label>
            <div style={modalStyles.buttonGroup}>
              <button 
                type="submit" 
                style={{...modalStyles.buttonPrimary, opacity: loading ? 0.7 : 1}}
                disabled={loading}
              >
                {loading ? 'Actualizando...' : '💾 Actualizar'}
              </button>
              <button 
                type="button"
                style={modalStyles.buttonCancel}
                onClick={handleCancelEdit}
                disabled={loading}
              >
                ✖ Cancelar
              </button>
            </div>
          </form>
        )}

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
                  ...(selectedCategory?.id_categoria === categoria.id_categoria ? modalStyles.selectedCategory : {}),
                  ...(isCategoriaProtegida(categoria.id_categoria) ? modalStyles.protectedCategory : {})
                }}
              >
                <div 
                  style={modalStyles.categoryContent}
                  onClick={() => handleCategorySelect(categoria)}
                >
                  <div style={modalStyles.categoryName}>
                    {categoria.nombre}
                    {isCategoriaProtegida(categoria.id_categoria) && (
                      <span style={modalStyles.protectedBadge}> 🔒 Base</span>
                    )}
                  </div>
                  {categoria.descripcion && (
                    <div style={modalStyles.categoryDesc}>{categoria.descripcion}</div>
                  )}
                </div>
                <div style={modalStyles.categoryActions}>
                  <button
                    style={{
                      ...modalStyles.editButton,
                      ...(isCategoriaProtegida(categoria.id_categoria) ? modalStyles.disabledButton : {})
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(categoria);
                    }}
                    title={isCategoriaProtegida(categoria.id_categoria) ? "Categoría base no editable" : "Editar categoría"}
                    disabled={isCategoriaProtegida(categoria.id_categoria) || loading}
                  >
                    ✏️
                  </button>
                  <button
                    style={{
                      ...modalStyles.deleteButton,
                      ...(isCategoriaProtegida(categoria.id_categoria) ? modalStyles.disabledButton : {})
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(categoria);
                    }}
                    title={isCategoriaProtegida(categoria.id_categoria) ? "Categoría base no eliminable" : "Eliminar categoría"}
                    disabled={isCategoriaProtegida(categoria.id_categoria) || loading}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={modalStyles.buttonGroup}>
          <button 
            style={modalStyles.buttonCancel}
            onClick={onClose}
            disabled={loading}
          >
            ✖ Cerrar
          </button>
        </div>
      </div>

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
                disabled={loading}
              >
                {loading ? 'Eliminando...' : '✅ Aceptar'}
              </button>
              <button 
                style={modalStyles.buttonCancel}
                onClick={handleCancelDelete}
                disabled={loading}
              >
                ✖ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

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
              
              {notificationData.categoriaProducto && notificationData.categoriaProducto.productos && (
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
  categoryActions: {
    display: 'flex',
    gap: '0.3rem',
  },
  editButton: {
    backgroundColor: '#8b6b4a',
    color: 'white',
    border: 'none',
    padding: '0.4rem 0.6rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    transition: 'all 0.3s ease',
  },
  selectedCategory: {
    backgroundColor: '#e8dfd0',
    borderColor: '#a67c52',
    borderWidth: '2px',
  },
  protectedCategory: {
    backgroundColor: '#f0f8ff',
    borderColor: '#4a90e2',
    borderWidth: '2px',
  },
  protectedBadge: {
    fontSize: '0.7rem',
    color: '#4a90e2',
    fontWeight: 'normal',
    marginLeft: '0.5rem',
    fontStyle: 'italic',
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
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: '#cccccc',
  },
  noData: {
    textAlign: 'center',
    color: '#8b6b4a',
    fontStyle: 'italic',
    padding: '1rem',
  }
};

export default CategoriesModal;