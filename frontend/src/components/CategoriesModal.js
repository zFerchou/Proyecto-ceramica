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

  // Cargar categorías
  const loadCategorias = async () => {
    try {
      const res = await api.getCategorias();
      if (res.ok) {
        const data = await res.json();
        setCategorias(data);
      } else {
        setError('Error al cargar categorías');
      }
    } catch (err) {
      setError('Error de conexión al cargar categorías');
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
        setMessage('✅ Categoría creada exitosamente');
        setFormData({ nombre: '', descripcion: '' });
        setShowAddForm(false);
        loadCategorias();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Error al crear categoría' }));
        setError(errorData.error || 'Error al crear categoría');
      }
    } catch (err) {
      setError('Error de conexión al crear categoría');
    } finally {
      setLoading(false);
    }
  };

  // Esta función reemplaza completamente a handleDeleteCategoria
  const handleDeleteClick = (categoria) => {
    setCategoriaToDelete(categoria);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoriaToDelete) return;

    try {
      const res = await api.deleteCategoria(categoriaToDelete.id_categoria);
      if (res.ok) {
        setMessage('✅ Categoría eliminada exitosamente');
        loadCategorias();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Error al eliminar categoría' }));
        setError(errorData.error || 'Error al eliminar categoría');
      }
    } catch (err) {
      setError('Error de conexión al eliminar categoría');
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

        {message && <div style={modalStyles.message}>{message}</div>}
        {error && <div style={modalStyles.errorBox}>{error}</div>}

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
                    e.stopPropagation(); // Evita que se active el click de selección
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
    zIndex: 1001, // Mayor z-index para que aparezca encima
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
    zIndex: 1002,
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
  errorBox: {
    backgroundColor: '#fce8e6',
    color: '#7a3e2f',
    borderLeft: '5px solid #b26a55',
    padding: '0.7rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  message: {
    backgroundColor: '#e0d6c2',
    borderLeft: '5px solid #8b6b4a',
    padding: '0.8rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    textAlign: 'center',
    fontWeight: '500'
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