import React, { useState } from 'react';
import loginapi from '../api/loginapi';

export default function Verificar2FA({ userId, email, onSuccess, onError }) {
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
      setErr(error.message || 'Error verificando código');
      onError && onError(error.message || 'Error verificando código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h3>Verificar código 2FA</h3>
        <p>Se envió un código al correo {email || 'tu correo'}. Ingresa el código de 6 dígitos.</p>
        {err && <div className="error-message">⚠️ {err}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="codigo">Código</label>
            <input id="codigo" name="codigo" value={codigo} onChange={e => setCodigo(e.target.value)} disabled={loading} required minLength={4} />
          </div>
          <button type="submit" className="login-button" disabled={loading}>{loading ? 'Verificando...' : 'Verificar'}</button>
        </form>
      </div>
    </div>
  );
}
