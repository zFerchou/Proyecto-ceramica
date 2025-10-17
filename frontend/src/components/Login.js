import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import loginapi from '../api/loginapi';
import authService from '../services/authService';
import Verificar2FA from './Verificar2FA';

export default function Login({ onClose, onLoginSuccess }) {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pending2FA, setPending2FA] = useState(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!credentials.email || !credentials.password) {
      setError('Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    try {
      const data = await loginapi.login(credentials);
      if (data.require2FA) {
        setPending2FA({ userId: data.userId || data.id, email: data.email });
      } else if (data.token && data.user) {
        authService.setAuthData(data.token, data.user);
        if (onLoginSuccess) onLoginSuccess();
        navigate('/dashboard');
      } else {
        setError('Respuesta inesperada del servidor');
      }
    } catch (err) {
      setError(err.message || 'Error en el login');
    } finally {
      setLoading(false);
    }
  };

  if (pending2FA) {
    return (
      <Verificar2FA
        userId={pending2FA.userId}
        email={pending2FA.email}
        onSuccess={(data) => {
          if (data.token && data.user) {
            authService.setAuthData(data.token, data.user);
            if (onLoginSuccess) onLoginSuccess();
            navigate('/dashboard');
          } else {
            setError('No se recibió token después de verificar 2FA');
          }
        }}
        onError={(msg) => setError(msg)}
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
      padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer'
    },
    buttonSecondary: {
      backgroundColor: '#c2a878', color: '#3e2c1c', border: 'none',
      padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer'
    },
    buttonCancel: {
      backgroundColor: '#8b6b4a', color: 'white', border: 'none',
      padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer'
    },
    formGroup: { marginBottom: '1rem', display: 'flex', flexDirection: 'column' },
    input: { padding: '0.5rem', borderRadius: '8px', border: '1px solid #c2a878', fontSize: '1rem', marginTop: '0.3rem' },
    errorMessage: { color: '#b00020', textAlign: 'center', marginBottom: '1rem' },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.title}>Iniciar Sesión</div>
        <div style={styles.message}>Ingresa tus credenciales para acceder al sistema</div>
        <form onSubmit={handleSubmit}>
          {error && <div style={styles.errorMessage}>⚠️ {error}</div>}
          <div style={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleInputChange}
              placeholder="tu.email@ejemplo.com"
              disabled={loading}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              placeholder="Tu contraseña"
              minLength="6"
              disabled={loading}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.buttonGroup}>
            <button type="submit" style={styles.buttonPrimary} disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
            <button type="button" style={styles.buttonCancel} onClick={onClose}>Cancelar</button>
          </div>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p>
            ¿No tienes cuenta? <span style={{ color: '#c2a878' }}>Contacta al administrador</span>
          </p>
          <div style={{ marginTop: '0.5rem' }}>
            <Link to="/forgot-username" style={{ color: '#4b3621', marginRight: '0.5rem' }}>¿Olvidaste tu nombre de usuario?</Link>
            <Link to="/forgot-password" style={{ color: '#4b3621' }}>¿Olvidaste tu contraseña?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
