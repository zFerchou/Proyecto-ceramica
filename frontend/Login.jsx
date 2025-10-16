import React, { useState } from 'react';
import Verificar2FA from './Verificar2FA';
import { useNavigate, Link } from 'react-router-dom'; // Mantener useNavigate y Link
import { authAPI } from '../services/api';
import authService from '../services/authService';
import '../styles/Login.css';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { geolocAPI } from '../services/api';

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pending2FA, setPending2FA] = useState(null); // { email }
  const navigate = useNavigate();
  const online = useOnlineStatus();

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError(''); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validación básica
    if (!credentials.email || !credentials.password) {
      setError('Por favor, completa todos los campos');
      setLoading(false);
      return;
    }

    try {
      const data = await authAPI.login(credentials);
      if (data.require2FA) {
        setPending2FA({ email: data.email });
      } else if (data.token && data.user) {
        authService.setAuthData(data.token, data.user);
        // Enviar ubicación al login si es posible
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            geolocAPI.guardarLogin({ lat: latitude, lng: longitude, accuracy }).catch(() => {});
          });
        }
        navigate('/');
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
        email={pending2FA.email}
        onSuccess={data => {
          authService.setAuthData(data.token, data.user);
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
              const { latitude, longitude, accuracy } = pos.coords;
              geolocAPI.guardarLogin({ lat: latitude, lng: longitude, accuracy }).catch(() => {});
            });
          }
          navigate('/');
        }}
        onError={errMsg => setError(errMsg)}
      />
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Iniciar Sesión</h2>
          <p>Ingresa tus credenciales para acceder al sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleInputChange}
              required
              placeholder="tu.email@ejemplo.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              required
              placeholder="Tu contraseña"
              minLength="6"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            ¿No tienes cuenta? 
            <span className="link"> Contacta al administrador</span>
          </p>
          
          {/* ENLACES DE RECUPERACIÓN - CORREGIDOS */}
          <div className="recovery-links">
            <Link to="/forgot-username" className="link">
              ¿Olvidaste tu nombre de usuario?
            </Link>
            <Link to="/forgot-password" className="link">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Acceso offline antes del login */}
          <div style={{ marginTop: 12 }}>
            {!online && (
              <>
                <div style={{ color: '#666', marginBottom: 6 }}>
                  Estás sin conexión. Si ya iniciaste sesión antes en este dispositivo, puedes entrar en modo offline.
                </div>
                <button
                  type="button"
                  className="login-button"
                  onClick={() => {
                    if (authService.canLoginOffline()) {
                      authService.enterOfflineMode();
                      navigate('/perfil-offline');
                    } else {
                      alert('No hay sesión previa válida. Necesitas iniciar sesión al menos una vez con Internet.');
                    }
                  }}
                >
                  Entrar en modo offline (solo lectura)
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;