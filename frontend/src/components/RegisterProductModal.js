import React, { useState } from 'react';
import { postProducto } from '../api/api';

export default function RegisterProductModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    cantidad: 0,
    precio: 0,
    id_categoria: 1, // valor por defecto
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  // Lista de categorías (id y nombre)
  const categorias = [
    { id: 1, nombre: 'Joyeria' },
    { id: 2, nombre: 'Macetas' },
    { id: 3, nombre: 'Productos de cocina' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'cantidad' || name === 'precio' || name === 'id_categoria'
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        cantidad: Number.parseInt(form.cantidad, 10),
        precio: Number.parseFloat(form.precio),
        id_categoria: Number.parseInt(form.id_categoria, 10),
      };
      const res = await postProducto(payload, file);
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body || { error: 'Error desconocido' });
      } else {
        onSuccess(body);
      }
    } catch (err) {
      setError({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>🧾 Registrar producto</h2>

        {error && <div style={styles.errorBox}>{JSON.stringify(error)}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Nombre:
            <input
              style={styles.input}
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej. jarron"
            />
          </label>

          <label style={styles.label}>
            Descripción:
            <input
              style={styles.input}
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Detalles del producto"
            />
          </label>

          <label style={styles.label}>
            Cantidad:
            <input
              style={styles.input}
              name="cantidad"
              type="number"
              value={form.cantidad}
              onChange={handleChange}
            />
          </label>

          <label style={styles.label}>
            Precio:
            <input
              style={styles.input}
              name="precio"
              type="number"
              step="0.01"
              value={form.precio}
              onChange={handleChange}
            />
          </label>

          <label style={styles.label}>
            Imagen del producto:
            <input
              style={styles.input}
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          <label style={styles.label}>
            Categoría:
            <select
              style={styles.input}
              name="id_categoria"
              value={form.id_categoria}
              onChange={handleChange}
            >
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </label>

          <div style={styles.buttonGroup}>
            <button
              type="submit"
              style={{ ...styles.buttonPrimary, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? 'Guardando...' : '💾 Guardar'}
            </button>
            <button
              type="button"
              style={styles.buttonCancel}
              onClick={onClose}
            >
              ✖ Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// 🎨 Estilos café-caqui
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(75, 54, 33, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
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
    animation: 'fadeIn 0.3s ease-in-out',
  },
  title: {
    textAlign: 'center',
    fontSize: '1.6rem',
    marginBottom: '1.2rem',
    color: '#3e2c1c',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    fontWeight: '500',
  },
  input: {
    marginTop: '0.3rem',
    padding: '0.6rem',
    borderRadius: '6px',
    border: '1px solid #c2a878',
    backgroundColor: '#fffdf8',
    color: '#3e2c1c',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '1rem',
  },
  buttonPrimary: {
    backgroundColor: '#a67c52',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.4rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
  buttonCancel: {
    backgroundColor: '#8b6b4a',
    color: 'white',
    border: 'none',
    padding: '0.6rem 1.4rem',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
  errorBox: {
    backgroundColor: '#fce8e6',
    color: '#7a3e2f',
    borderLeft: '5px solid #b26a55',
    padding: '0.7rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
};
