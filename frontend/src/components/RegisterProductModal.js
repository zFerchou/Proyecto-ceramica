import React, { useState, useEffect } from 'react';
import api from '../api/api';
import CategoriesModal from './CategoriesModal';
import Marco from "../images/Marco.png";

export default function RegisterProductModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    cantidad: '',
    precio: '',
    id_categoria: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoriesRefreshTrigger, setCategoriesRefreshTrigger] = useState(0);

  // Cargar categorías del backend - CORREGIDO
  const loadCategorias = async () => {
    try {
      const data = await api.getCategorias(); // api.getCategorias() ya devuelve datos directamente
      if (Array.isArray(data)) {
        setCategorias(data);
      } else {
        console.error('Error: getCategorias no devolvió un array:', data);
      }
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  };

  useEffect(() => {
    loadCategorias();
  }, [categoriesRefreshTrigger]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cantidad' || name === 'precio') {
      const numeric = value === '' ? '' : value;
      setForm(prev => ({ ...prev, [name]: numeric }));
      return;
    }
    
    if (name === 'id_categoria') {
      setForm(prev => ({ ...prev, id_categoria: value }));
      if (value) {
        const categoria = categorias.find(cat => cat.id_categoria === parseInt(value));
        setSelectedCategory(categoria || null);
      } else {
        setSelectedCategory(null);
      }
      return;
    }
    
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericFocus = (e) => {
    const { name, value } = e.target;
    if ((name === 'cantidad' || name === 'precio') && (value === '0' || value === '0.0' || value === '0.00')) {
      setForm(prev => ({ ...prev, [name]: '' }));
      setTimeout(() => { e.target.value = ''; }, 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validaciones básicas antes de construir payload
      const cantidadValida = form.cantidad !== '' && !isNaN(Number(form.cantidad));
      const precioValido = form.precio !== '' && !isNaN(Number(form.precio));
      
      if (!cantidadValida || !precioValido) {
        setError({ error: 'Cantidad y precio son obligatorios' });
        setLoading(false);
        return;
      }
      
      // Validar que el nombre no esté vacío
      if (!form.nombre.trim()) {
        setError({ error: 'El nombre del producto es obligatorio' });
        setLoading(false);
        return;
      }
      
      const payload = {
        ...form,
        cantidad: Number.parseInt(form.cantidad, 10),
        precio: Number.parseFloat(form.precio),
        id_categoria: form.id_categoria ? Number.parseInt(form.id_categoria, 10) : null,
      };
      
      console.log('Enviando producto:', payload, 'Archivo:', file);
      
      // CORRECCIÓN: api.postProducto devuelve datos directamente
      const result = await api.postProducto(payload, file);
      
      if (result && !result.error) {
        // SOLO llamar al callback de éxito y cerrar el modal
        console.log('Producto creado exitosamente:', result);
        onSuccess(result);
        onClose();
      } else {
        setError({ error: result?.error || 'Error al crear producto' });
      }
    } catch (err) {
      console.error('Error en handleSubmit:', err);
      setError({ error: err.message || 'Error al crear producto' });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryAction = (action, categoria) => {
    switch (action) {
      case 'selected':
        setSelectedCategory(categoria);
        setForm(prev => ({
          ...prev,
          id_categoria: categoria.id_categoria
        }));
        setShowCategoriesModal(false);
        break;
      
      case 'created':
      case 'updated':
      case 'deleted':
        // Forzar recarga de categorías
        setCategoriesRefreshTrigger(prev => prev + 1);
        
        if (action === 'created' && categoria) {
          setSelectedCategory(categoria);
          setForm(prev => ({
            ...prev,
            id_categoria: categoria.id_categoria
          }));
        }
        
        if (action === 'deleted' && selectedCategory && 
            selectedCategory.id_categoria === categoria.id_categoria) {
          setSelectedCategory(null);
          setForm(prev => ({
            ...prev,
            id_categoria: ''
          }));
        }
        break;
    }
  };

  return (
    <>
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <h2 style={styles.title}>🧾 Registrar producto</h2>

          {error && (
            <div style={styles.errorBox}>
              {typeof error === 'object' ? JSON.stringify(error) : error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              Nombre:
              <input
                style={styles.input}
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej. jarron"
                required
                disabled={loading}
              />
            </label>

            <label style={styles.label}>
              Descripción:
              <textarea
                style={{...styles.input, minHeight: '80px'}}
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Detalles del producto"
                disabled={loading}
              />
            </label>

            <div style={styles.row}>
              <label style={styles.label}>
                Cantidad:
                <input
                  style={styles.input}
                  name="cantidad"
                  type="number"
                  value={form.cantidad}
                  onChange={handleChange}
                  onFocus={handleNumericFocus}
                  min="0"
                  placeholder="0"
                  required
                  disabled={loading}
                />
              </label>

              <label style={styles.label}>
                Precio:
                <input
                  style={styles.input}
                  name="precio"
                  type="number"
                  step="0.01"
                  value={form.precio}
                  onChange={handleChange}
                  onFocus={handleNumericFocus}
                  min="0"
                  placeholder="0.00"
                  required
                  disabled={loading}
                />
              </label>
            </div>

            <label style={styles.label}>
              Categoría:
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  style={styles.input}
                  name="id_categoria"
                  value={form.id_categoria}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  style={styles.buttonSecondary}
                  onClick={() => setShowCategoriesModal(true)}
                  disabled={loading}
                >
                  📁 Gestionar
                </button>
              </div>
              {selectedCategory && (
                <div style={{ fontSize: '0.8rem', color: '#5a432c', marginTop: '0.3rem' }}>
                  Seleccionada: <strong>{selectedCategory.nombre}</strong>
                  {selectedCategory.descripcion && ` - ${selectedCategory.descripcion}`}
                </div>
              )}
            </label>

            <label style={styles.label}>
              Imagen del producto:
              <input
                style={styles.input}
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={loading}
              />
            </label>

            <div style={styles.buttonGroup}>
              <button
                type="submit"
                style={{ ...styles.buttonPrimary, opacity: loading ? 0.7 : 1 }}
                disabled={loading}
              >
                {loading ? 'Guardando...' : '💾 Guardar'}
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

          {showCategoriesModal && (
            <CategoriesModal
              isOpen={showCategoriesModal}
              onClose={() => setShowCategoriesModal(false)}
              onCategorySelect={handleCategoryAction}
              selectedCategory={selectedCategory}
              refreshTrigger={categoriesRefreshTrigger}
            />
          )}
        </div>
      </div>
    </>
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
    width: '450px',
    maxHeight: '90vh',
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
    fontSize: '0.9rem',
  },
  input: {
    marginTop: '0.3rem',
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
    padding: '0.6rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    fontSize: '0.8rem',
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
    wordBreak: 'break-word',
  },
};