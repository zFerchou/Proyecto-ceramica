import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import loginapi from '../api/loginapi';
import authService from '../services/authService';
import Verificar2FA from './Verificar2FA';
import './Login.css';

export default function Login() {
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
        userId={pending2FA.userId}
        email={pending2FA.email}
        onSuccess={(data) => {
          if (data.token && data.user) {
            authService.setAuthData(data.token, data.user);
            navigate('/');
          } else {
            setError('No se recibió token después de verificar 2FA');
          }
        }}
        onError={(msg) => setError(msg)}
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
          {error && <div className="error-message">⚠️ {error}</div>}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={credentials.email} onChange={handleInputChange} required placeholder="tu.email@ejemplo.com" disabled={loading} />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input type="password" id="password" name="password" value={credentials.password} onChange={handleInputChange} required placeholder="Tu contraseña" minLength="6" disabled={loading} />
          </div>
          <button type="submit" className="login-button" disabled={loading}>{loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}</button>
        </form>

        <div className="login-footer">
          <p>¿No tienes cuenta? <span className="link">Contacta al administrador</span></p>
          <div className="recovery-links">
            <Link to="/forgot-username" className="link">¿Olvidaste tu nombre de usuario?</Link>
            <Link to="/forgot-password" className="link">¿Olvidaste tu contraseña?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
