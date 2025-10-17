import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../api/loginApi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Hook para navegación

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await authService.forgotPassword(email);

      // Mensaje de éxito
      setMessage(response.message || 'Se envió el enlace de recuperación');

      // Si el backend devuelve un token temporal para resetear contraseña
      if (response.token) {
        // Redirige a ResetPassword con token
        navigate(`/reset-password/${encodeURIComponent(response.token)}`);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.toString() || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Recuperar Contraseña</h2>
          <p>Te enviaremos un enlace para restablecer tu contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Ingresa tu correo electrónico"
              disabled={loading}
            />
          </div>

          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login" className="link">← Volver al Login</Link>
          <Link to="/forgot-username" className="link">¿Olvidaste tu nombre de usuario?</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
