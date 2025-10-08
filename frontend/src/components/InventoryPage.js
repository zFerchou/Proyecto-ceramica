import React, { useState, useEffect } from 'react';
import RegisterProductModal from './RegisterProductModal';
import UpdateStockModal from './UpdateStockModal';
import api from './api';

export default function InventoryPage({ onClose }) {
  const [showRegister, setShowRegister] = useState(false);
  const [showUpdateStock, setShowUpdateStock] = useState(false);
  const [productos, setProductos] = useState([]);
  const [message, setMessage] = useState(null);

  const load = async () => {
    try {
      const res = await api.getProductos();
      const body = await res.json().catch(() => null);
      if (res.ok) setProductos(body || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRegisterSuccess = (body) => {
    setMessage('Producto creado: ' + (body && body.id_producto));
    setShowRegister(false);
    // preguntar si quiere otro registro o actualizar stock
    const again = window.confirm('¿Desea registrar otro producto? (OK) o actualizar stock (Cancel)');
    if (again) setShowRegister(true); else setShowUpdateStock(true);
    load();
  };

  const handleUpdateSuccess = (body) => {
    setMessage('Stock actualizado');
    setShowUpdateStock(false);
    load();
  };

  return (
    <div>
      <h1>Inventario</h1>
      <div>
        <button onClick={() => setShowRegister(true)}>Registrar producto</button>
        <button onClick={() => setShowUpdateStock(true)}>Actualizar stock</button>
        <button onClick={onClose}>Cerrar</button>
      </div>
      {message && <div className="message">{message}</div>}
      <table>
        <thead>
          <tr><th>ID</th><th>Nombre</th><th>Descripcion</th><th>Cantidad</th><th>Precio</th></tr>
        </thead>
        <tbody>
          {productos.map(p => (
            <tr key={p.id_producto}><td>{p.id_producto}</td><td>{p.nombre}</td><td>{p.descripcion}</td><td>{p.cantidad}</td><td>{p.precio}</td></tr>
          ))}
        </tbody>
      </table>

      {showRegister && <RegisterProductModal onClose={() => setShowRegister(false)} onSuccess={handleRegisterSuccess} />}
      {showUpdateStock && <UpdateStockModal onClose={() => setShowUpdateStock(false)} onSuccess={handleUpdateSuccess} />}
    </div>
  );
}
