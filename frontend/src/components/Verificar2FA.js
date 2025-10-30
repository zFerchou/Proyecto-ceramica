import React, { useState } from 'react';
import loginapi from '../api/loginapi';

export default function Verificar2FA({ userId, email, onSuccess, onError, onClose }) {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const data = await loginapi.verify2FA({ userId, codigo });
      onSuccess && onSuccess(data);
    } catch (error) {
      const msg = error.message || 'Error verificando código';
      setErr(msg);
      onError && onError(msg);
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
    buttonGroup: { display: 'flex', justifyContent: 'space-between', gap: '0.5rem' },
    buttonPrimary: {
      backgroundColor: '#a67c52', color: 'white', border: 'none',
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
        <div style={styles.title}>Verificar código 2FA</div>
        <div style={styles.message}>
          Se envió un código al correo {email || 'tu correo'}. Ingresa el código de 6 dígitos.
        </div>
        {err && <div style={styles.errorMessage}>⚠️ {err}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="codigo">Código</label>
            <input
              id="codigo"
              name="codigo"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              disabled={loading}
              required
              minLength={4}
              style={styles.input}
              placeholder="Ingresa el código"
            />
          </div>
          <div style={styles.buttonGroup}>
            <button type="submit" style={styles.buttonPrimary} disabled={loading}>
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
            {onClose && (
              <button type="button" style={styles.buttonCancel} onClick={onClose}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
