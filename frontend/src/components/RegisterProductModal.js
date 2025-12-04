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
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoriesRefreshTrigger, setCategoriesRefreshTrigger] = useState(0);
  
  // Estados para manejo de errores con modal
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorData, setErrorData] = useState({ title: '', message: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState({ title: '', message: '' });

  // Cargar categorías del backend
  const loadCategorias = async () => {
    try {
      const data = await api.getCategorias();
      if (Array.isArray(data)) {
        setCategorias(data);
      } else {
        showError('Error de Categorías', 'No se pudieron cargar las categorías');
      }
    } catch (err) {
      console.error('Error cargando categorías:', err);
      showError('Error de Conexión', 'No se pudo conectar al servidor');
    }
  };

  useEffect(() => {
    loadCategorias();
  }, [categoriesRefreshTrigger]);

  // Funciones para mostrar modales
  const showError = (title, message) => {
    setErrorData({ title, message });
    setShowErrorModal(true);
  };

  const showSuccess = (title, message) => {
    setSuccessData({ title, message });
    setShowSuccessModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorData({ title: '', message: '' });
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessData({ title: '', message: '' });
    onClose();
  };

  // Función mejorada para extraer el mensaje de error
  const extractErrorMessage = (error) => {
    console.log('Error crudo recibido:', error);
    console.log('Tipo de error:', typeof error);
    
    // Si es undefined o null
    if (!error) {
      return 'Error desconocido';
    }
    
    // Si ya es un string limpio
    if (typeof error === 'string' && !error.startsWith('{') && !error.startsWith('[')) {
      return error;
    }
    
    // Si es un string que parece JSON
    if (typeof error === 'string') {
      try {
        const parsed = JSON.parse(error);
        console.log('JSON parseado:', parsed);
        
        // Buscar la propiedad 'error' en el objeto parseado
        if (parsed && typeof parsed === 'object') {
          if (parsed.error && typeof parsed.error === 'string') {
            return parsed.error;
          }
          if (parsed.message && typeof parsed.message === 'string') {
            return parsed.message;
          }
          // Si no tiene propiedades conocidas, intentar stringificar solo el contenido relevante
          return JSON.stringify(parsed);
        }
        return error;
      } catch (parseError) {
        console.log('No es JSON válido, devolviendo string original');
        return error;
      }
    }
    
    // Si es un objeto
    if (typeof error === 'object') {
      console.log('Es un objeto, propiedades:', Object.keys(error));
      
      // Caso 1: error.error (formato de tu API)
      if (error.error !== undefined) {
        if (typeof error.error === 'string') {
          return error.error;
        }
        // Si error.error es otro objeto o array
        if (typeof error.error === 'object') {
          return JSON.stringify(error.error);
        }
      }
      
      // Caso 2: error.message (Error estándar)
      if (error.message && typeof error.message === 'string') {
        return error.message;
      }
      
      // Caso 3: Tiene propiedad response (errores de fetch/axios)
      if (error.response && error.response.data) {
        const data = error.response.data;
        if (data.error && typeof data.error === 'string') {
          return data.error;
        }
        if (data.message && typeof data.message === 'string') {
          return data.message;
        }
        return JSON.stringify(data);
      }
      
      // Caso 4: Convertir a string solo si es pequeño
      const stringified = JSON.stringify(error);
      if (stringified.length < 100) {
        return stringified;
      }
      
      return 'Error del servidor';
    }
    
    // Cualquier otro caso
    return String(error);
  };

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

  const validateForm = () => {
    // Validar nombre
    if (!form.nombre.trim()) {
      showError('Nombre Requerido', 'El nombre del producto es obligatorio');
      return false;
    }

    // Validar cantidad
    if (form.cantidad === '' || isNaN(Number(form.cantidad)) || Number(form.cantidad) < 0) {
      showError('Cantidad Inválida', 'La cantidad debe ser un número válido mayor o igual a 0');
      return false;
    }

    // Validar precio
    if (form.precio === '' || isNaN(Number(form.precio)) || Number(form.precio) < 0) {
      showError('Precio Inválido', 'El precio debe ser un número válido mayor o igual a 0');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const payload = {
        ...form,
        cantidad: Number.parseInt(form.cantidad, 10),
        precio: Number.parseFloat(form.precio),
        id_categoria: form.id_categoria ? Number.parseInt(form.id_categoria, 10) : null,
      };
      
      console.log('Enviando producto:', payload, 'Archivo:', file);
      
      const result = await api.postProducto(payload, file);
      
      console.log('Resultado del servidor:', result);
      console.log('Tipo de resultado:', typeof result);
      
      if (result && !result.error) {
        showSuccess('✅ Producto Registrado', 'El producto ha sido creado exitosamente');
        onSuccess(result);
      } else {
        // Usar la función mejorada para extraer el mensaje
        const errorMessage = extractErrorMessage(result);
        console.log('Mensaje de error extraído:', errorMessage);
        
        let errorTitle = 'Error';
        
        // Personalizar título según el contenido del mensaje
        const msgLower = errorMessage.toLowerCase();
        if (msgLower.includes('nombre') || 
            msgLower.includes('existe') ||
            msgLower.includes('duplicado') ||
            msgLower.includes('ya existe')) {
          errorTitle = 'Producto Duplicado';
        } else if (msgLower.includes('categoría') || 
                  msgLower.includes('categoria')) {
          errorTitle = 'Categoría Inválida';
        } else if (msgLower.includes('imagen') || 
                  msgLower.includes('archivo')) {
          errorTitle = 'Error de Imagen';
        } else if (msgLower.includes('conexión') || 
                  msgLower.includes('conexion') ||
                  msgLower.includes('network')) {
          errorTitle = 'Error de Conexión';
        } else if (msgLower.includes('sistema')) {
          errorTitle = 'Error del Sistema';
        }
        
        showError(errorTitle, errorMessage);
      }
    } catch (err) {
      console.error('Error en handleSubmit catch:', err);
      console.error('Error completo:', err);
      
      // Extraer el mensaje del error de catch
      const errorMessage = extractErrorMessage(err);
      console.log('Mensaje de error de catch extraído:', errorMessage);
      
      let errorTitle = 'Error';
      const msgLower = errorMessage.toLowerCase();
      
      if (msgLower.includes('network') || 
          msgLower.includes('conexión') ||
          msgLower.includes('conexion') ||
          msgLower.includes('failed to fetch')) {
        errorTitle = 'Error de Conexión';
      } else if (msgLower.includes('timeout')) {
        errorTitle = 'Tiempo de Espera';
      }
      
      showError(errorTitle, errorMessage);
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

          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>
              Nombre:
              <input
                style={styles.input}
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej. Jarron"
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

      {/* Modal de Error */}
      {showErrorModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <div style={modalStyles.errorHeader}>
              ❌ {errorData.title}
            </div>
            
            <div style={modalStyles.content}>
              <p style={modalStyles.message}>{errorData.message}</p>
            </div>

            <div style={modalStyles.buttonGroup}>
              <button 
                style={modalStyles.buttonPrimary}
                onClick={closeErrorModal}
              >
                ✅ Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito */}
      {showSuccessModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <div style={modalStyles.successHeader}>
              {successData.title}
            </div>
            
            <div style={modalStyles.content}>
              <p style={modalStyles.message}>{successData.message}</p>
            </div>

            <div style={modalStyles.buttonGroup}>
              <button 
                style={modalStyles.buttonSuccess}
                onClick={closeSuccessModal}
              >
                ✅ Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Estilos (mantener igual que antes)
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
};

const modalStyles = {
  overlay: {
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
    width: '400px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
    fontFamily: '"Poppins", sans-serif',
    animation: 'fadeIn 0.3s ease-in-out',
    backgroundImage: `url(${Marco})`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    overflow: 'hidden',
  },
  errorHeader: {
    padding: '1rem',
    backgroundColor: '#f44336',
    color: 'white',
    textAlign: 'center',
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
  successHeader: {
    padding: '1rem',
    backgroundColor: '#4caf50',
    color: 'white',
    textAlign: 'center',
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
  content: {
    padding: '1.5rem',
  },
  message: {
    fontSize: '1rem',
    lineHeight: '1.5',
    textAlign: 'center',
    margin: 0,
  },
  buttonGroup: {
    padding: '1rem',
    display: 'flex',
    justifyContent: 'center',
    borderTop: '1px solid #d2b48c',
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
    fontWeight: 'bold',
  },
  buttonSuccess: {
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1.4rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    fontWeight: 'bold',
  },
};