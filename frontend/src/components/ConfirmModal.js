import React from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>{title}</h2>
        <p style={styles.message}>{message}</p>
        <div style={styles.buttonGroup}>
          <button style={styles.buttonPrimary} onClick={onConfirm}>
            Registrar otro
          </button>
          <button style={styles.buttonSecondary} onClick={onCancel}>
            Actualizar stock
          </button>
          <button style={styles.buttonCancel} onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// Estilos café-caqui similares a tus otros modales
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
  }
};
