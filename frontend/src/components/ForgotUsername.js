// ForgotUsername.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../api/loginApi';

export default function ForgotUsername({ onClose }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await authService.forgotUsername(email);
      setMessage(response.message || 'Se ha enviado tu nombre de usuario al correo.');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

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
    formGroup: { marginBottom: '1rem', display: 'flex', flexDirection: 'column' },
    input: { padding: '0.5rem', borderRadius: '8px', border: '1px solid #c2a878', fontSize: '1rem', marginTop: '0.3rem' },
    button: {
      backgroundColor: '#a67c52',
      color: 'white',
      border: 'none',
      padding: '0.6rem 1.2rem',
      borderRadius: '8px',
      cursor: 'pointer',
      width: '100%',
      marginTop: '0.5rem',
    },
    errorMessage: { color: '#b00020', textAlign: 'center', marginBottom: '1rem' },
    successMessage: { color: '#2e7d32', textAlign: 'center', marginBottom: '1rem' },
    links: { textAlign: 'center', marginTop: '1rem' },
    link: { color: '#4b3621', margin: '0 0.5rem' },
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.title}>Recuperar Nombre de Usuario</div>
        <div style={styles.message}>Te enviaremos tu nombre de usuario por correo electrónico</div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="email">Correo Electrónico:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Ingresa tu correo registrado"
              disabled={loading}
              style={styles.input}
            />
          </div>

          {message && <div style={styles.successMessage}>{message}</div>}
          {error && <div style={styles.errorMessage}>{error}</div>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Enviando...' : 'Recuperar Usuario'}
          </button>
        </form>

        <div style={styles.links}>
          <Link to="/login" style={styles.link}>← Volver al Login</Link>
          <Link to="/forgot-password" style={styles.link}>¿Olvidaste tu contraseña?</Link>
        </div>
      </div>
    </div>
  );
}
