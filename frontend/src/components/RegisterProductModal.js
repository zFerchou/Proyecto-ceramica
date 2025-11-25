import React, { useState, useEffect } from 'react';
import api from '../api/api';
import CategoriesModal from './CategoriesModal';
import Marco from "../images/Marco.png";

export default function RegisterProductModal({ onClose, onSuccess }) {
  // Permitimos '' para cantidad y precio para que el usuario pueda borrar el 0 inicial fácilmente
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
  // ELIMINADO: [showSuccessModal, setShowSuccessModal] = useState(false);

  // Cargar categorías del backend
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

  useEffect(() => {
    loadCategorias();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Para cantidad y precio permitir '' y validar más tarde
    if (name === 'cantidad' || name === 'precio') {
      // Si el usuario borra todo, dejamos '' en el estado
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

  // Limpia el 0 inicial al enfocar si está en '0' o '0.00'
  const handleNumericFocus = (e) => {
    const { name, value } = e.target;
    if ((name === 'cantidad' || name === 'precio') && (value === '0' || value === '0.0' || value === '0.00')) {
      setForm(prev => ({ ...prev, [name]: '' }));
      // Usar setTimeout para esperar a que React actualice antes de cambiar el valor del input directamente
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
      const payload = {
        ...form,
        cantidad: Number.parseInt(form.cantidad, 10),
        precio: Number.parseFloat(form.precio),
        id_categoria: form.id_categoria ? Number.parseInt(form.id_categoria, 10) : null,
      };
      const res = await api.postProducto(payload, file);
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body || { error: 'Error desconocido' });
      } else {
        // ELIMINADO: No mostrar modal de éxito aquí
        // setShowSuccessModal(true);
        
        // SOLO llamar al callback de éxito y cerrar el modal
        onSuccess(body);
        onClose(); // Cerrar el modal de registro
      }
    } catch (err) {
      setError({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoria) => {
    setSelectedCategory(categoria);
    setForm(prev => ({
      ...prev,
      id_categoria: categoria.id_categoria
    }));
  };

  // ELIMINADO: handleSuccessClose ya no es necesario

  return (
    <>
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <h2 style={styles.title}>🧾 Registrar producto</h2>

          {error && <div style={styles.errorBox}>{JSON.stringify(error)}</div>}

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
              >
                ✖ Cancelar
              </button>
            </div>
          </form>

          {/* Modal de categorías */}
          {showCategoriesModal && (
            <CategoriesModal
              isOpen={showCategoriesModal}
              onClose={() => setShowCategoriesModal(false)}
              onCategorySelect={handleCategorySelect}
              selectedCategory={selectedCategory}
            />
          )}
        </div>
      </div>

      {/* ELIMINADO: Modal de éxito - ahora lo maneja el InventoryPage */}
    </>
  );
}

// 🎨 Estilos café-caqui (sin cambios en los estilos)
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
  },
};