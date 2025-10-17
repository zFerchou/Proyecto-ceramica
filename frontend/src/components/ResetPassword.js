import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import loginApi from '../api/loginApi';

const ResetPassword = ({ onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(true);

  const { token } = useParams();
  const navigate = useNavigate();

  // Verifica el token al montar el componente
  useEffect(() => {
    const verifyTokenAsync = async () => {
      try {
        if (!token) throw new Error('No hay token para verificar');
        const decodedToken = decodeURIComponent(token);
        await loginApi.verifyToken(decodedToken);
        setValidToken(true);
      } catch (err) {
        setValidToken(false);
        setError(err?.message || 'Enlace inválido o expirado');
      }
    };
    verifyTokenAsync();
  }, [token]);

  // Manejo del submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const decodedToken = decodeURIComponent(token);
      const response = await loginApi.resetPassword(decodedToken, newPassword);
      setMessage(response.message || 'Contraseña restablecida con éxito');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err?.message || 'Error al restablecer la contraseña');
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

  if (!validToken) {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.title}>Enlace Inválido</div>
          <div style={styles.message}>{error}</div>
          <div style={styles.links}>
            <Link to="/forgot-password" style={styles.link}>Solicitar nuevo enlace</Link>
            <Link to="/login" style={styles.link}>Volver al Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.title}>Restablecer Contraseña</div>
        <div style={styles.message}>Crea una nueva contraseña para tu cuenta</div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="newPassword">Nueva Contraseña:</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Repite tu contraseña"
              disabled={loading}
              style={styles.input}
            />
          </div>

          {message && <div style={styles.successMessage}>{message}</div>}
          {error && <div style={styles.errorMessage}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
          </button>
        </form>

        <div style={styles.links}>
          <Link to="/login" style={styles.link}>← Volver al Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
