// src/components/AuthModal.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../api/loginapi';
import authService from '../services/authService';
import Verificar2FA from './Verificar2FA';

export default function AuthModal({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'forgotUsername' | 'forgotPassword'
  const [isVisible, setIsVisible] = useState(true);

  // --- Login ---
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [pending2FA, setPending2FA] = useState(null);

  // --- Forgot Username ---
  const [emailFU, setEmailFU] = useState('');
  const [messageFU, setMessageFU] = useState('');
  const [errorFU, setErrorFU] = useState('');
  const [loadingFU, setLoadingFU] = useState(false);

  // --- Forgot Password ---
  const [emailFP, setEmailFP] = useState('');
  const [messageFP, setMessageFP] = useState('');
  const [errorFP, setErrorFP] = useState('');
  const [loadingFP, setLoadingFP] = useState(false);

  // Normaliza errores para mostrar mensajes legibles
  const normalizeError = (err) => {
    const raw = typeof err === 'string' ? err : (err?.message || 'Ocurrió un error');
    try {
      if (typeof raw === 'string' && raw.trim().startsWith('{')) {
        const obj = JSON.parse(raw);
        return obj.error || obj.message || raw;
      }
    } catch {}
    return raw;
  };

  // --- Handlers ---
  const handleLoginChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setLoginError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    
    if (!credentials.email || !credentials.password) {
      setLoginError('Por favor completa todos los campos');
      setLoginLoading(false);
      return;
    }
    
    try {
      const data = await authApi.login(credentials);
      
      if (data.require2FA) {
        setPending2FA({ 
          userId: data.userId || data.id, 
          email: data.email,
          nombre: data.nombre,
          rol: data.rol 
        });
      } else if (data.token && data.user) {
        // Guardar autenticación con datos completos
        authService.setAuthData(data.token, data.user);
        
        if (onLoginSuccess) onLoginSuccess(data.user);
        setIsVisible(false);
        
        // Redirigir según el rol (comparación insensible a mayúsculas)
        const userRol = data.user.rol?.toLowerCase() || 'empleado';
        if (userRol === 'admin') {
          navigate('/');
        } else {
          navigate('/ventas');
        }
      } else {
        setLoginError('Respuesta inesperada del servidor');
      }
    } catch (err) {
      setLoginError(normalizeError(err) || 'Error en el login');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleForgotUsername = async (e) => {
    e.preventDefault();
    setLoadingFU(true);
    setMessageFU('');
    setErrorFU('');
    
    try {
      const res = await authApi.forgotUsername(emailFU);
      setMessageFU(res.message || 'Revisa tu correo.');
    } catch (err) {
      setErrorFU(normalizeError(err) || 'Error al recuperar usuario');
    } finally {
      setLoadingFU(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoadingFP(true);
    setMessageFP('');
    setErrorFP('');
    
    try {
      const res = await authApi.forgotPassword(emailFP);
      setMessageFP(res.message || 'Si el correo existe, se envió el enlace de recuperación');
    } catch (err) {
      setErrorFP(normalizeError(err) || 'Error al enviar correo');
    } finally {
      setLoadingFP(false);
    }
  };

  if (!isVisible) return null;

  // --- 2FA ---
  if (pending2FA) {
    return (
      <Verificar2FA
        userId={pending2FA.userId}
        email={pending2FA.email}
        nombre={pending2FA.nombre}
        rol={pending2FA.rol}
        onSuccess={(data) => {
          console.log('Datos de autenticación 2FA recibidos:', data);
          if (data.token && data.user) {
            // Guardar autenticación con datos completos
            authService.setAuthData(data.token, data.user);
            
            if (onLoginSuccess) onLoginSuccess(data.user);
            setIsVisible(false);
            
            // Redirigir según el rol (comparación insensible a mayúsculas)
            const userRol = data.user.rol?.toLowerCase() || 'empleado';
            console.log('Rol del usuario:', userRol);
            if (userRol === 'admin') {
              navigate('/');
            } else {
              navigate('/ventas');
            }
          }
        }}
        onError={(msg) => setLoginError(normalizeError(msg))}
        onCancel={() => setPending2FA(null)}
      />
    );
  }

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(75,54,33,0.6)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: '#f5f1e3',
      color: '#4b3621',
      borderRadius: '14px',
      padding: '2rem',
      width: '400px',
      boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
      fontFamily: '"Poppins", sans-serif',
    },
    title: { textAlign: 'center', marginBottom: '1rem', fontSize: '1.5rem' },
    message: { textAlign: 'center', marginBottom: '1.5rem' },
    buttonGroup: { display: 'flex', justifyContent: 'space-between', gap: '0.5rem' },
    buttonPrimary: {
      backgroundColor: '#a67c52', color: 'white', border: 'none',
      padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer',
      transition: 'background-color 0.3s'
    },
    buttonCancel: {
      backgroundColor: '#8b6b4a', color: 'white', border: 'none',
      padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer',
      transition: 'background-color 0.3s'
    },
    formGroup: { marginBottom: '1rem', display: 'flex', flexDirection: 'column' },
    input: { padding: '0.5rem', borderRadius: '8px', border: '1px solid #c2a878', fontSize: '1rem', marginTop: '0.3rem' },
    errorMessage: { color: '#b00020', textAlign: 'center', marginBottom: '1rem', padding: '10px', backgroundColor: 'rgba(176,0,32,0.1)', borderRadius: '8px' },
    successMessage: { color: '#1b5e20', textAlign: 'center', marginBottom: '1rem', padding: '10px', backgroundColor: 'rgba(27,94,32,0.1)', borderRadius: '8px' },
    link: { color: '#4b3621', cursor: 'pointer', margin: '0 0.25rem', textDecoration: 'underline' },
    loadingText: { color: '#735f53', textAlign: 'center', marginTop: '10px' }
  };

  return (
    <div style={styles.overlay} onClick={() => setIsVisible(false)}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {mode === 'login' && (
          <>
            <div style={styles.title}>Iniciar Sesión</div>
            <div style={styles.message}>Ingresa tus credenciales</div>
            <form onSubmit={handleLoginSubmit}>
              {loginError && <div style={styles.errorMessage}>⚠️ {loginError}</div>}
              <div style={styles.formGroup}>
                <label>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={credentials.email} 
                  onChange={handleLoginChange} 
                  placeholder="tu.email@ejemplo.com" 
                  style={styles.input} 
                  required 
                  disabled={loginLoading}
                />
              </div>
              <div style={styles.formGroup}>
                <label>Contraseña</label>
                <input 
                  type="password" 
                  name="password" 
                  value={credentials.password} 
                  onChange={handleLoginChange} 
                  placeholder="Tu contraseña" 
                  style={styles.input} 
                  required 
                  minLength={6} 
                  disabled={loginLoading}
                />
              </div>
              <div style={styles.buttonGroup}>
                <button 
                  type="submit" 
                  style={styles.buttonPrimary} 
                  disabled={loginLoading}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#8b6b4a'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#a67c52'}
                >
                  {loginLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                </button>
                <button 
                  type="button" 
                  style={styles.buttonCancel}
                  onClick={() => setIsVisible(false)}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#735f53'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#8b6b4a'}
                >
                  Cancelar
                </button>
              </div>
              {loginLoading && <div style={styles.loadingText}>Verificando credenciales...</div>}
            </form>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <span style={styles.link} onClick={() => setMode('forgotUsername')}>¿Olvidaste tu nombre de usuario?</span> | 
              <span style={styles.link} onClick={() => setMode('forgotPassword')}>¿Olvidaste tu contraseña?</span>
            </div>
          </>
        )}

        {mode === 'forgotUsername' && (
          <>
            <div style={styles.title}>Recuperar Usuario</div>
            <form onSubmit={handleForgotUsername}>
              <div style={styles.formGroup}>
                <label>Correo Electrónico</label>
                <input 
                  type="email" 
                  value={emailFU} 
                  onChange={(e) => setEmailFU(e.target.value)} 
                  placeholder="correo registrado" 
                  style={styles.input} 
                  required 
                  disabled={loadingFU}
                />
              </div>
              {messageFU && <div style={styles.successMessage}>{messageFU}</div>}
              {errorFU && <div style={styles.errorMessage}>{errorFU}</div>}
              <div style={styles.buttonGroup}>
                <button 
                  type="submit" 
                  style={styles.buttonPrimary} 
                  disabled={loadingFU}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#8b6b4a'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#a67c52'}
                >
                  {loadingFU ? 'Enviando...' : 'Recuperar Usuario'}
                </button>
                <button 
                  type="button" 
                  style={styles.buttonCancel}
                  onClick={() => setMode('login')}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#735f53'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#8b6b4a'}
                >
                  Volver
                </button>
              </div>
            </form>
          </>
        )}

        {mode === 'forgotPassword' && (
          <>
            <div style={styles.title}>Recuperar Contraseña</div>
            <form onSubmit={handleForgotPassword}>
              <div style={styles.formGroup}>
                <label>Correo Electrónico</label>
                <input 
                  type="email" 
                  value={emailFP} 
                  onChange={(e) => setEmailFP(e.target.value)} 
                  placeholder="correo registrado" 
                  style={styles.input} 
                  required 
                  disabled={loadingFP}
                />
              </div>
              {messageFP && <div style={styles.successMessage}>{messageFP}</div>}
              {errorFP && <div style={styles.errorMessage}>{errorFP}</div>}
              <div style={styles.buttonGroup}>
                <button 
                  type="submit" 
                  style={styles.buttonPrimary} 
                  disabled={loadingFP}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#8b6b4a'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#a67c52'}
                >
                  {loadingFP ? 'Enviando...' : 'Recuperar Contraseña'}
                </button>
                <button 
                  type="button" 
                  style={styles.buttonCancel}
                  onClick={() => setMode('login')}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#735f53'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#8b6b4a'}
                >
                  Volver
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}