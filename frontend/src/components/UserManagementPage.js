import React, { useState, useEffect } from "react";
import PageBackground from "./PageBackground";
import api from "../api/api";
import Marco from "../images/Marco.png";

// Función para normalizar rol
const normalizarRol = (rol) => {
  if (!rol) return 'empleado';
  const rolStr = rol.toString().toLowerCase().trim();
  if (rolStr.includes('admin') || rolStr.includes('administrador')) {
    return 'admin';
  }
  return 'empleado';
};

// ========== COMPONENTES MODALES ==========

// Modal para Registrar Usuario
function RegisterUserModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "empleado",
    telefono: "",
    direccion: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        nombre: "",
        email: "",
        password: "",
        rol: "empleado",
        telefono: "",
        direccion: ""
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await api.crearUsuario(formData);
      
      if (result && !result.error) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess(result.usuario);
          onClose();
        }, 1500);
      } else {
        setError(result?.error || 'Error al crear usuario');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión al servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <h2 style={modalStyles.title}>👤 Registrar Nuevo Usuario</h2>
        
        {error && (
          <div style={modalStyles.errorBox}>
            <strong>❌ Error:</strong> {error}
          </div>
        )}
        
        {success ? (
          <div style={modalStyles.successBox}>
            <div style={modalStyles.successIcon}>✅</div>
            <h3 style={modalStyles.successTitle}>¡Usuario Creado!</h3>
            <p>El usuario ha sido registrado exitosamente.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={modalStyles.form}>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>
                Nombre Completo *
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  style={modalStyles.input}
                  placeholder="Ej: Juan Pérez"
                  required
                  disabled={loading}
                />
              </label>
            </div>

            <div style={modalStyles.row}>
              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>
                  Email *
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    style={modalStyles.input}
                    placeholder="usuario@ejemplo.com"
                    required
                    disabled={loading}
                  />
                </label>
              </div>

              <div style={modalStyles.formGroup}>
                <label style={modalStyles.label}>
                  Contraseña *
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    style={modalStyles.input}
                    placeholder="Mínimo 6 caracteres"
                    minLength="6"
                    required
                    disabled={loading}
                  />
                </label>
              </div>
            </div>

            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>
                Rol *
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  style={modalStyles.select}
                  required
                  disabled={loading}
                >
                  <option value="empleado">👤 Empleado</option>
                  <option value="admin">👑 Administrador</option>
                </select>
              </label>
            </div>

            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>
                Teléfono
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  style={modalStyles.input}
                  placeholder="Ej: 5551234567"
                  disabled={loading}
                />
              </label>
            </div>

            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>
                Dirección
                <textarea
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  style={modalStyles.textarea}
                  placeholder="Dirección completa"
                  rows="3"
                  disabled={loading}
                />
              </label>
            </div>

            <div style={modalStyles.buttonGroup}>
              <button 
                type="submit" 
                style={{ 
                  ...modalStyles.buttonPrimary, 
                  opacity: loading ? 0.7 : 1 
                }}
                disabled={loading}
              >
                {loading ? 'Creando...' : '👥 Crear Usuario'}
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
        )}
      </div>
    </div>
  );
}

// Modal de Confirmación para Eliminar Usuario
function DeleteUserConfirmModal({ isOpen, onClose, usuario, onConfirm }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !usuario) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(usuario);
    } catch (error) {
      console.error('Error en confirmación:', error);
    } finally {
      setLoading(false);
    }
  };

  const esAdmin = normalizarRol(usuario.rol) === 'admin';

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <h2 style={modalStyles.title}>⚠️ Confirmar Eliminación</h2>
        
        <div style={modalStyles.confirmContent}>
          <div style={modalStyles.warningIcon}>🗑️</div>
          
          <div style={modalStyles.confirmMessage}>
            <p>
              ¿Estás seguro de que deseas eliminar al usuario <strong>"{usuario.nombre}"</strong>?
            </p>
            <div style={modalStyles.userDetails}>
              <div><strong>Email:</strong> {usuario.email}</div>
              <div><strong>Rol:</strong> {esAdmin ? '👑 Administrador' : '👤 Empleado'}</div>
              {usuario.telefono && (
                <div><strong>Teléfono:</strong> {usuario.telefono}</div>
              )}
            </div>
          </div>
          
          <div style={modalStyles.warningBox}>
            ❗ <strong>Esta acción no se puede deshacer.</strong>
            <br />
            El usuario perderá acceso permanente al sistema.
          </div>
        </div>
        
        <div style={modalStyles.buttonGroup}>
          <button 
            style={{ 
              ...modalStyles.buttonDanger, 
              opacity: loading ? 0.7 : 1 
            }}
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

// Modal de Error Específico para Restricciones
function ErrorRestriccionModal({ isOpen, onClose, errorData }) {
  if (!isOpen || !errorData) return null;

  const { titulo, mensaje, solucion, tipo } = errorData;
  
  const getIcon = () => {
    switch(tipo) {
      case 'ventas': return '💰';
      case 'admin': return '👑';
      case 'propio': return '👤';
      default: return '⚠️';
    }
  };

  const getColor = () => {
    switch(tipo) {
      case 'ventas': return '#dc3545';
      case 'admin': return '#ffc107';
      case 'propio': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={{
          ...modalStyles.errorHeader,
          borderLeftColor: getColor()
        }}>
          <div style={modalStyles.errorIcon}>
            {getIcon()}
          </div>
          <h2 style={modalStyles.errorTitle}>{titulo}</h2>
        </div>
        
        <div style={modalStyles.errorContent}>
          <div style={modalStyles.errorMessage}>
            <p>{mensaje}</p>
            
            {solucion && (
              <div style={modalStyles.solucionBox}>
                <h4 style={modalStyles.solucionTitle}>💡 Solución:</h4>
                <p>{solucion}</p>
              </div>
            )}
            
            {tipo === 'ventas' && (
              <div style={modalStyles.pasosBox}>
                <h4 style={modalStyles.pasosTitle}>📋 Pasos a seguir:</h4>
                <ol style={modalStyles.pasosList}>
                  <li>Revisa las ventas realizadas por este usuario</li>
                  <li>Transfiere las ventas a otro usuario si es necesario</li>
                  <li>O archiva las ventas antes de eliminar el usuario</li>
                  <li>Intenta eliminar el usuario nuevamente</li>
                </ol>
              </div>
            )}
            
            {tipo === 'admin' && (
              <div style={modalStyles.pasosBox}>
                <h4 style={modalStyles.pasosTitle}>📋 Pasos a seguir:</h4>
                <ol style={modalStyles.pasosList}>
                  <li>Promueve a otro usuario a administrador</li>
                  <li>Asegúrate de que haya al menos otro administrador activo</li>
                  <li>Intenta eliminar el usuario nuevamente</li>
                </ol>
              </div>
            )}
          </div>
          
          <div style={modalStyles.buttonGroupCenter}>
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

// Modal de Éxito
function SuccessModal({ isOpen, onClose, title, message, buttonText = "Aceptar" }) {
  if (!isOpen) return null;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.successContent}>
          <div style={modalStyles.successIconLarge}>✅</div>
          <h2 style={modalStyles.successTitle}>{title}</h2>
          <p style={modalStyles.successMessage}>{message}</p>
          <div style={modalStyles.buttonGroupCenter}>
            <button
              style={modalStyles.buttonPrimary}
              onClick={onClose}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== COMPONENTE PRINCIPAL ==========

export default function UserManagementPage({ onClose }) {
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');
  
  // Estados para modales
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [successData, setSuccessData] = useState({});
  const [errorData, setErrorData] = useState({});
  
  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    administradores: 0,
    empleados: 0
  });

  // Cargar usuarios
  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await api.getUsuarios();
      
      if (Array.isArray(data)) {
        const usuariosNormalizados = data.map(usuario => ({
          ...usuario,
          rolNormalizado: normalizarRol(usuario.rol)
        }));
        
        setUsuarios(usuariosNormalizados);
        setFilteredUsuarios(usuariosNormalizados);
        
        const total = usuariosNormalizados.length;
        const administradores = usuariosNormalizados.filter(u => 
          u.rolNormalizado === 'admin'
        ).length;
        const empleados = total - administradores;
        
        setEstadisticas({ total, administradores, empleados });
        
        setMessage(null);
      } else {
        showMessage('Error al cargar usuarios', 'error');
      }
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      showMessage(`Error de conexión: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  // Filtrar usuarios
  useEffect(() => {
    const term = (searchTerm || "").toString().trim().toLowerCase();
    
    if (!term) {
      setFilteredUsuarios(usuarios);
      return;
    }
    
    const filtered = usuarios.filter((u) => {
      const nameMatch = (u.nombre || "").toLowerCase().includes(term);
      const emailMatch = (u.email || "").toLowerCase().includes(term);
      const rolMatch = (u.rol || "").toLowerCase().includes(term);
      const telefonoMatch = (u.telefono || "").includes(term);
      
      return nameMatch || emailMatch || rolMatch || telefonoMatch;
    });
    
    setFilteredUsuarios(filtered);
  }, [searchTerm, usuarios]);

  // Mostrar mensajes
  const showMessage = (text, type = 'info', duration = 5000) => {
    setMessage(text);
    setMessageType(type);
    
    if (duration > 0) {
      setTimeout(() => {
        setMessage(null);
      }, duration);
    }
  };

  // Analizar errores del backend y mostrar modal específico
  const manejarErrorEliminacion = (errorMessage) => {
    let errorData = {
      titulo: "Error al Eliminar Usuario",
      mensaje: errorMessage,
      solucion: "",
      tipo: "general"
    };

    // Convertir a minúsculas para comparación insensible
    const errorLower = errorMessage.toLowerCase();
    
    // Detectar tipo de error específico
    if (errorLower.includes('último administrador') || errorLower.includes('ultimo administrador')) {
      errorData = {
        titulo: "⚠️ No se puede eliminar el último administrador",
        mensaje: "Debe haber al menos un administrador activo en el sistema para gestionar usuarios y configuraciones.",
        solucion: "Promueve a otro usuario a administrador antes de eliminar este usuario.",
        tipo: "admin"
      };
    } else if (errorLower.includes('no puedes eliminar tu propia cuenta') || 
               errorLower.includes('no se puede eliminar a sí mismo') ||
               errorLower.includes('eliminarte a ti mismo')) {
      errorData = {
        titulo: "👤 No puedes eliminarte a ti mismo",
        mensaje: "Por razones de seguridad, no puedes eliminar tu propia cuenta mientras estás conectado.",
        solucion: "Pídele a otro administrador que elimine tu cuenta, o cierra sesión y pídele a otro administrador que lo haga.",
        tipo: "propio"
      };
    } else if (errorLower.includes('violates foreign key constraint') || 
               errorLower.includes('llave foránea') ||
               errorLower.includes('ventas') ||
               errorLower.includes('registros asociados') ||
               errorLower.includes('transacciones') ||
               errorLower.includes('integridad de datos') ||
               errorLower.includes('relación') ||
               errorLower.includes('referencia')) {
      errorData = {
        titulo: "💰 Usuario tiene ventas registradas",
        mensaje: "Este usuario tiene ventas registradas en el sistema. Por integridad de datos, no se puede eliminar un usuario que tiene transacciones asociadas.",
        solucion: "Es necesario eliminar o transferir las ventas de este usuario antes de eliminarlo.",
        tipo: "ventas"
      };
    } else if (errorLower.includes('no encontrado') || errorLower.includes('no existe')) {
      errorData = {
        titulo: "🔍 Usuario no encontrado",
        mensaje: "El usuario que intentas eliminar no existe o ya ha sido eliminado.",
        solucion: "Actualiza la lista de usuarios para ver los cambios.",
        tipo: "general"
      };
    }

    setErrorData(errorData);
    setShowErrorModal(true);
  };

  // Manejar creación exitosa de usuario
  const handleRegisterSuccess = (usuario) => {
    setSuccessData({
      title: "✅ Usuario Creado",
      message: `El usuario "${usuario.nombre}" ha sido registrado exitosamente en el sistema.`,
      buttonText: "👥 Ver Usuarios"
    });
    setShowSuccessModal(true);
    loadUsuarios();
    showMessage(`Usuario "${usuario.nombre}" creado exitosamente`, 'success');
  };

  // Abrir modal de eliminación
  const handleDeleteClick = (usuario) => {
    setSelectedUsuario(usuario);
    setShowDeleteModal(true);
  };

  // Confirmar eliminación
  const handleConfirmDelete = async (usuario) => {
    try {
      const result = await api.deleteUsuario(usuario.id);
      
      if (result && !result.error) {
        setSuccessData({
          title: "✅ Usuario Eliminado",
          message: `El usuario "${usuario.nombre}" ha sido eliminado exitosamente del sistema.`,
          buttonText: "👥 Ver Usuarios"
        });
        setShowDeleteModal(false);
        setShowSuccessModal(true);
        loadUsuarios();
        showMessage(`Usuario "${usuario.nombre}" eliminado exitosamente`, 'success');
      } else {
        // Manejar error específico del backend
        if (result?.error) {
          manejarErrorEliminacion(result.error);
        } else {
          showMessage('Error al eliminar usuario', 'error');
        }
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error('Error completo al eliminar:', err);
      
      // EXTRAER EL MENSAJE DE ERROR CORRECTAMENTE
      let errorMessage = err.message || 'Error desconocido';
      
      // Intentar extraer el mensaje del error si viene como objeto o string JSON
      try {
        // Si el error es un string que parece JSON
        if (typeof err.message === 'string' && (err.message.includes('{') || err.message.includes('['))) {
          try {
            const errorObj = JSON.parse(err.message);
            if (errorObj.error) {
              errorMessage = errorObj.error;
            } else if (errorObj.message) {
              errorMessage = errorObj.message;
            } else if (typeof errorObj === 'string') {
              errorMessage = errorObj;
            }
          } catch (parseErr) {
            // Si falla el parseo, usar el mensaje original
            console.log('No se pudo parsear como JSON:', err.message);
          }
        }
        
        // Si el error completo es un objeto con propiedad 'error'
        if (err.error && typeof err.error === 'string') {
          errorMessage = err.error;
        }
        
        // Si el error tiene una propiedad 'response' (común en fetch/axios)
        if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } catch (parseError) {
        console.error('Error al parsear mensaje de error:', parseError);
      }
      
      // Ahora analizar el mensaje extraído
      manejarErrorEliminacion(errorMessage);
      
      setShowDeleteModal(false);
    }
  };

  // Formatear fecha
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return "No disponible";
    
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  // Determinar color del badge según rol
  const getRoleColor = (rol) => {
    const rolNormalizado = normalizarRol(rol);
    return rolNormalizado === 'admin' ? '#2c3e50' : '#27ae60';
  };

  // Determinar texto del badge según rol
  const getRoleText = (rol) => {
    const rolNormalizado = normalizarRol(rol);
    return rolNormalizado === 'admin' ? ' Admin' : ' Empleado';
  };

  // Obtener clase CSS para mensaje
  const getMessageClass = () => {
    switch (messageType) {
      case 'success': return styles.messageSuccess;
      case 'error': return styles.messageError;
      default: return styles.messageInfo;
    }
  };

  return (
    <PageBackground>
      <div style={styles.container}>
        <h1 style={styles.title}>👥 Administración de Usuarios</h1>
        <p style={styles.subtitle}>
          Gestiona los usuarios del sistema. Solo visible para administradores.
        </p>

        {/* Barra de búsqueda y acciones */}
        <div style={styles.headerActions}>
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="🔍 Buscar por nombre, email, rol o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={styles.clearSearchButton}
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          <div style={styles.actionButtons}>
            <button
              style={styles.buttonPrimary}
              onClick={() => setShowRegisterModal(true)}
              title="Registrar nuevo usuario"
            >
              ➕ Nuevo Usuario
            </button>
            <button
              style={styles.buttonRefresh}
              onClick={loadUsuarios}
              title="Actualizar lista"
              disabled={loading}
            >
              {loading ? '🔄' : '🔄'}
            </button>
            <button
              style={styles.buttonClose}
              onClick={onClose}
              title="Volver al dashboard"
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* Mensajes */}
        {message && (
          <div style={getMessageClass()}>
            {messageType === 'success' && '✅ '}
            {messageType === 'error' && '❌ '}
            {message}
          </div>
        )}

        {/* Tarjetas de estadísticas */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>👥</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{estadisticas.total}</div>
              <div style={styles.statLabel}>Usuarios Totales</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: '#2c3e50' }}>👑</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{estadisticas.administradores}</div>
              <div style={styles.statLabel}>Administradores</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: '#27ae60' }}>👤</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{estadisticas.empleados}</div>
              <div style={styles.statLabel}>Empleados</div>
            </div>
          </div>
        </div>

        {/* Información sobre restricciones */}
        <div style={styles.infoBox}>
          <div style={styles.infoIcon}>ℹ️</div>
          <div style={styles.infoContent}>
            <strong>Información importante:</strong>
            <ul style={styles.infoList}>
              <li>No se puede eliminar el <strong>último administrador</strong> del sistema</li>
              <li>No se pueden eliminar usuarios con <strong>ventas registradas</strong></li>
              <li>No puedes <strong>eliminarte a ti mismo</strong> mientras estás conectado</li>
            </ul>
          </div>
        </div>

        {/* Tabla de usuarios */}
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Cargando usuarios...</p>
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Usuario</th>
                  <th style={styles.th}>Contacto</th>
                  <th style={styles.th}>Rol</th>
                  <th style={styles.th}>Registro</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.length > 0 ? (
                  filteredUsuarios.map((usuario) => {
                    const esAdmin = usuario.rolNormalizado === 'admin';
                    
                    return (
                      <tr key={usuario.id} style={styles.tr}>
                        <td style={styles.td}>
                          <span style={styles.idBadge}>#{usuario.id}</span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.userCell}>
                            <div style={styles.userName}>
                              <strong>{usuario.nombre}</strong>
                              {esAdmin && (
                                <span style={styles.adminTag} title="Administrador">
                                  👑
                                </span>
                              )}
                            </div>
                            {usuario.direccion && (
                              <div style={styles.userAddress}>
                                 {usuario.direccion}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.contactCell}>
                            <div style={styles.email}>
                               {usuario.email}
                            </div>
                            {usuario.telefono && (
                              <div style={styles.phone}>
                                 {usuario.telefono}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.roleBadge,
                            backgroundColor: getRoleColor(usuario.rol)
                          }}>
                            {getRoleText(usuario.rol)}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.dateCell}>
                            {formatFecha(usuario.fecha_creacion)}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.actionsCell}>
                            <button
                              onClick={() => handleDeleteClick(usuario)}
                              style={styles.deleteButton}
                              title={`Eliminar a ${usuario.nombre}`}
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={styles.noData}>
                      <div style={styles.noDataContent}>
                        <div style={styles.noDataIcon}>👤</div>
                        <p>No se encontraron usuarios</p>
                        {searchTerm && (
                          <p style={styles.noDataHint}>
                            Intenta con otros términos de búsqueda
                          </p>
                        )}
                        <button
                          style={styles.noDataButton}
                          onClick={() => setSearchTerm("")}
                        >
                          Limpiar búsqueda
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {/* Pie de tabla */}
            {filteredUsuarios.length > 0 && (
              <div style={styles.tableFooter}>
                <div style={styles.tableStats}>
                  Mostrando {filteredUsuarios.length} de {usuarios.length} usuarios
                  {searchTerm && ` (filtrados por: "${searchTerm}")`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modales */}
        <RegisterUserModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onSuccess={handleRegisterSuccess}
        />

        <DeleteUserConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          usuario={selectedUsuario}
          onConfirm={handleConfirmDelete}
        />

        <ErrorRestriccionModal
          isOpen={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          errorData={errorData}
        />

        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title={successData.title}
          message={successData.message}
          buttonText={successData.buttonText}
        />
      </div>
    </PageBackground>
  );
}

// ========== ESTILOS ==========

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(75, 54, 33, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(3px)',
  },
  modal: {
    backgroundColor: '#f5f1e3',
    color: '#4b3621',
    borderRadius: '16px',
    padding: '2rem',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    fontFamily: '"Poppins", sans-serif',
    animation: 'modalFadeIn 0.3s ease-out',
    backgroundImage: `url(${Marco})`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    border: '2px solid #a67c52',
  },
  title: {
    textAlign: 'center',
    fontSize: '1.8rem',
    marginBottom: '1.5rem',
    color: '#3e2c1c',
    fontWeight: '600',
  },
  errorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e8dfd0',
    borderLeft: '5px solid #dc3545',
    paddingLeft: '1rem',
  },
  errorIcon: {
    fontSize: '2.5rem',
  },
  errorTitle: {
    color: '#3e2c1c',
    margin: 0,
    fontSize: '1.5rem',
  },
  errorContent: {
    padding: '1rem 0',
  },
  errorMessage: {
    fontSize: '1rem',
    lineHeight: 1.6,
    color: '#5a432c',
    marginBottom: '2rem',
  },
  solucionBox: {
    backgroundColor: '#e8f5e9',
    borderLeft: '4px solid #4caf50',
    padding: '1rem',
    borderRadius: '8px',
    margin: '1.5rem 0',
  },
  solucionTitle: {
    margin: '0 0 0.5rem 0',
    color: '#2d5016',
  },
  pasosBox: {
    backgroundColor: '#e3f2fd',
    borderLeft: '4px solid #2196f3',
    padding: '1rem',
    borderRadius: '8px',
    margin: '1.5rem 0',
  },
  pasosTitle: {
    margin: '0 0 0.5rem 0',
    color: '#1565c0',
  },
  pasosList: {
    margin: '0.5rem 0 0 1.5rem',
    padding: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  formGroup: {
    marginBottom: '0.5rem',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    fontWeight: '500',
    fontSize: '0.95rem',
    marginBottom: '0.3rem',
    color: '#5a432c',
  },
  input: {
    padding: '0.8rem',
    borderRadius: '8px',
    border: '1px solid #c2a878',
    backgroundColor: '#fffdf8',
    color: '#3e2c1c',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontSize: '1rem',
    marginTop: '0.3rem',
  },
  select: {
    padding: '0.8rem',
    borderRadius: '8px',
    border: '1px solid #c2a878',
    backgroundColor: '#fffdf8',
    color: '#3e2c1c',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontSize: '1rem',
    marginTop: '0.3rem',
    cursor: 'pointer',
  },
  textarea: {
    padding: '0.8rem',
    borderRadius: '8px',
    border: '1px solid #c2a878',
    backgroundColor: '#fffdf8',
    color: '#3e2c1c',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontSize: '1rem',
    marginTop: '0.3rem',
    resize: 'vertical',
    minHeight: '80px',
    fontFamily: 'inherit',
  },
  row: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '2rem',
    gap: '1rem',
  },
  buttonGroupCenter: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '2rem',
  },
  buttonPrimary: {
    backgroundColor: '#a67c52',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '1rem',
    fontWeight: '500',
    flex: 1,
  },
  buttonCancel: {
    backgroundColor: '#8b6b4a',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '1rem',
    fontWeight: '500',
    flex: 1,
  },
  buttonDanger: {
    backgroundColor: '#b26a55',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '1rem',
    fontWeight: '500',
    flex: 1,
  },
  errorBox: {
    backgroundColor: '#fce8e6',
    color: '#7a3e2f',
    borderLeft: '4px solid #b26a55',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    fontSize: '0.95rem',
  },
  successBox: {
    backgroundColor: '#e8f5e9',
    color: '#2d5016',
    borderLeft: '4px solid #4caf50',
    padding: '1.5rem',
    borderRadius: '8px',
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    borderLeft: '4px solid #ffc107',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
  },
  adminWarning: {
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    borderLeft: '4px solid #2196f3',
    padding: '0.8rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  confirmContent: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  warningIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  confirmMessage: {
    marginBottom: '1.5rem',
    fontSize: '1.1rem',
    lineHeight: '1.6',
  },
  userDetails: {
    backgroundColor: '#f8f9fa',
    padding: '1rem',
    borderRadius: '6px',
    marginTop: '1rem',
    textAlign: 'left',
    fontSize: '0.9rem',
  },
  successContent: {
    textAlign: 'center',
    padding: '1rem',
  },
  successIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  successIconLarge: {
    fontSize: '4rem',
    marginBottom: '1.5rem',
  },
  successTitle: {
    fontSize: '2rem',
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

const styles = {
  container: {
    backgroundColor: "#f5f1e3",
    color: "#4b3621",
    padding: "2rem",
    borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    maxWidth: "1200px",
    margin: "2rem auto",
    fontFamily: '"Poppins", sans-serif',
    minHeight: "80vh",
  },
  title: {
    textAlign: "center",
    color: "#3e2c1c",
    fontSize: "2.5rem",
    marginBottom: "0.5rem",
    fontWeight: "700",
  },
  subtitle: {
    textAlign: "center",
    color: "#6b4f3b",
    fontSize: "1.1rem",
    marginBottom: "2rem",
    opacity: 0.8,
  },
  headerActions: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  searchContainer: {
    flex: 1,
    position: "relative",
    maxWidth: "600px",
  },
  searchInput: {
    width: "100%",
    padding: "0.9rem 1.2rem",
    paddingRight: "3rem",
    border: "2px solid #c2a878",
    borderRadius: "10px",
    fontSize: "1rem",
    outline: "none",
    color: "#3e2c1c",
    backgroundColor: "#fff8ef",
    transition: "all 0.3s ease",
  },
  clearSearchButton: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "#8b6b4a",
    cursor: "pointer",
    fontSize: "1.2rem",
    padding: "0.3rem 0.5rem",
    borderRadius: "50%",
  },
  actionButtons: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: "#a67c52",
    color: "white",
    border: "none",
    padding: "0.8rem 1.5rem",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "1rem",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  buttonRefresh: {
    backgroundColor: "#8b6b4a",
    color: "white",
    border: "none",
    padding: "0.8rem",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "1.2rem",
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonClose: {
    backgroundColor: "#735f53",
    color: "white",
    border: "none",
    padding: "0.8rem 1.5rem",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "1rem",
    fontWeight: "600",
  },
  messageInfo: {
    backgroundColor: "#e0d6c2",
    borderLeft: "5px solid #8b6b4a",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    textAlign: "center",
    fontWeight: "500",
    fontSize: "1rem",
  },
  messageSuccess: {
    backgroundColor: "#d4edda",
    borderLeft: "5px solid #28a745",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    textAlign: "center",
    fontWeight: "500",
    fontSize: "1rem",
    color: "#155724",
  },
  messageError: {
    backgroundColor: "#f8d7da",
    borderLeft: "5px solid #dc3545",
    padding: "1rem",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    textAlign: "center",
    fontWeight: "500",
    fontSize: "1rem",
    color: "#721c24",
  },
  infoBox: {
    backgroundColor: "#e3f2fd",
    borderLeft: "5px solid #2196f3",
    padding: "1rem 1.5rem",
    borderRadius: "10px",
    marginBottom: "2rem",
    display: "flex",
    alignItems: "flex-start",
    gap: "1rem",
  },
  infoIcon: {
    fontSize: "1.5rem",
    marginTop: "0.2rem",
  },
  infoContent: {
    flex: 1,
  },
  infoList: {
    margin: "0.5rem 0 0 1.5rem",
    padding: 0,
  },
  statsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  statIcon: {
    backgroundColor: "#a67c52",
    color: "white",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.8rem",
    flexShrink: 0,
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#3e2c1c",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "0.9rem",
    color: "#6b4f3b",
    marginTop: "0.3rem",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem",
    gap: "1.5rem",
  },
  spinner: {
    width: "60px",
    height: "60px",
    border: "5px solid #f3f3f3",
    borderTop: "5px solid #a67c52",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: "#6b4f3b",
    fontSize: "1.1rem",
    fontWeight: "500",
  },
  tableContainer: {
    overflowX: "auto",
    borderRadius: "12px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "white",
    borderRadius: "12px",
    overflow: "hidden",
  },
  th: {
    backgroundColor: "#a67c52",
    color: "white",
    padding: "1rem",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "0.95rem",
  },
  tr: {
    borderBottom: "1px solid #e8dfd0",
  },
  td: {
    padding: "1rem",
    color: "#3e2c1c",
    verticalAlign: "top",
  },
  noData: {
    padding: "3rem 1rem",
  },
  noDataContent: {
    textAlign: "center",
    color: "#8b6b4a",
  },
  noDataIcon: {
    fontSize: "3rem",
    marginBottom: "1rem",
    opacity: 0.5,
  },
  noDataHint: {
    fontSize: "0.9rem",
    margin: "0.5rem 0 1rem",
    color: "#6b4f3b",
  },
  noDataButton: {
    backgroundColor: "#8b6b4a",
    color: "white",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  idBadge: {
    backgroundColor: "#e8dfd0",
    padding: "0.4rem 0.8rem",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#5a432c",
    display: "inline-block",
  },
  userCell: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },
  userName: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "1rem",
    fontWeight: "600",
  },
  adminTag: {
    fontSize: "0.8rem",
  },
  userAddress: {
    fontSize: "0.85rem",
    color: "#6b4f3b",
    fontStyle: "italic",
  },
  contactCell: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },
  email: {
    fontSize: "0.95rem",
    fontWeight: "500",
  },
  phone: {
    fontSize: "0.85rem",
    color: "#6b4f3b",
  },
  roleBadge: {
    display: "inline-block",
    padding: "0.4rem 1rem",
    borderRadius: "20px",
    fontSize: "0.85rem",
    color: "white",
    fontWeight: "600",
    textAlign: "center",
    minWidth: "80px",
  },
  dateCell: {
    fontSize: "0.9rem",
    whiteSpace: "nowrap",
  },
  actionsCell: {
    display: "flex",
    justifyContent: "center",
  },
  deleteButton: {
    backgroundColor: "#b26a55",
    color: "white",
    border: "none",
    padding: "0.6rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "500",
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
  },
  tableFooter: {
    backgroundColor: "#f8f9fa",
    padding: "1rem",
    borderTop: "1px solid #e8dfd0",
    borderRadius: "0 0 12px 12px",
  },
  tableStats: {
    textAlign: "center",
    color: "#6b4f3b",
    fontSize: "0.9rem",
  },
};

// Añadir estilos globales
const globalStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes modalFadeIn {
    from { opacity: 0; transform: translateY(-20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  
  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
  }
  
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Inyectar estilos globales
const styleSheet = document.createElement('style');
styleSheet.textContent = globalStyles;
document.head.appendChild(styleSheet);