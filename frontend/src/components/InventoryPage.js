import React, { useState, useEffect } from "react";
import RegisterProductModal from "./RegisterProductModal";
import UpdateStockModal from "./UpdateStockModal";
import ConfirmModal from "./ConfirmModal";
import ProductQRModal from "./ProductQRModal"; // Modal para mostrar info al escanear QR
import api from "../api/api";

export default function InventoryPage({ onClose }) {
  const [showRegister, setShowRegister] = useState(false);
  const [showUpdateStock, setShowUpdateStock] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [productos, setProductos] = useState([]);
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastRegisteredProduct, setLastRegisteredProduct] = useState(null);
  const [qrModalProduct, setQrModalProduct] = useState(null); // Producto a mostrar en modal QR

  // Cargar productos del backend
  const load = async () => {
    try {
      const res = await api.getProductos();
      const body = await res.json().catch(() => null);
      if (res.ok && Array.isArray(body)) {
        setProductos(body);
        setFilteredProductos(body);
      }
    } catch (err) {
      console.error("Error al cargar productos:", err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Filtrar productos por nombre
  useEffect(() => {
    const filtered = productos.filter((p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProductos(filtered);
  }, [searchTerm, productos]);

  // 💾 Manejo de registro de producto
  const handleRegisterSuccess = (body) => {
    setMessage("✅ Producto creado: " + (body?.nombre || ""));
    setLastRegisteredProduct(body);
    setShowRegister(false);
    setShowConfirm(true); // Abrimos el modal de confirmación
    load();
  };

  // 🛠️ Funciones para el modal de confirmación
  const handleConfirmRegister = () => {
    setShowConfirm(false);
    setShowRegister(true);
  };

  const handleConfirmUpdateStock = () => {
    setShowConfirm(false);
    setShowUpdateStock(true);
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false); // Solo cierra el modal
  };

  const handleUpdateSuccess = () => {
    setMessage("✅ Stock actualizado correctamente");
    setShowUpdateStock(false);
    load();
  };

  // Abrir modal al hacer click en QR
  const handleQrClick = (producto) => {
    setQrModalProduct(producto);
  };

  // Cerrar modal QR
  const closeQrModal = () => {
    setQrModalProduct(null);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📦 Inventario</h1>

      <div style={styles.actionsRow}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="🔍 Buscar producto por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.buttonGroup}>
          <button
            style={styles.buttonPrimary}
            onClick={() => setShowRegister(true)}
          >
            Registrar producto
          </button>
          <button
            style={styles.buttonSecondary}
            onClick={() => setShowUpdateStock(true)}
          >
            Actualizar stock
          </button>
          <button style={styles.buttonClose} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      {/* Tabla de productos */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Nombre</th>
            <th style={styles.th}>Descripción</th>
            <th style={styles.th}>Cantidad</th>
            <th style={styles.th}>Precio</th>
            <th style={styles.th}>QR</th>
          </tr>
        </thead>
        <tbody>
          {filteredProductos.length > 0 ? (
            filteredProductos.map((p) => (
              <tr key={p.id_producto} style={styles.tr}>
                <td style={styles.td}>{p.nombre}</td>
                <td style={styles.td}>{p.descripcion}</td>
                <td style={styles.td}>{p.cantidad}</td>
                <td style={styles.td}>${p.precio}</td>
                <td style={styles.td}>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                      "Producto: " + p.nombre
                    )}`}
                    alt="QR"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleQrClick(p)}
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={styles.noData}>
                No se encontraron productos.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modales */}
      {showRegister && (
        <RegisterProductModal
          onClose={() => setShowRegister(false)}
          onSuccess={handleRegisterSuccess}
        />
      )}
      {showUpdateStock && (
        <UpdateStockModal
          onClose={() => setShowUpdateStock(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}
      {showConfirm && (
        <ConfirmModal
          isOpen={showConfirm}
          title="¿Qué deseas hacer?"
          message={`Producto creado: ${lastRegisteredProduct?.nombre || ""}`}
          onConfirm={handleConfirmRegister}
          onCancel={handleConfirmUpdateStock}
          onClose={handleCancelConfirm} // Cierra el modal sin hacer nada
        />
      )}

      {/* Modal QR */}
      {qrModalProduct && (
        <ProductQRModal
          producto={qrModalProduct}
          onClose={closeQrModal}
        />
      )}
    </div>
  );
}

// 🎨 Estilos
const styles = {
  container: {
    backgroundColor: "#f5f1e3",
    color: "#4b3621",
    padding: "2rem",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    maxWidth: "950px",
    margin: "2rem auto",
    fontFamily: '"Poppins", sans-serif'
  },
  title: { textAlign: "center", color: "#3e2c1c", fontSize: "2rem", marginBottom: "1.5rem" },
  actionsRow: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" },
  searchContainer: { width: "100%", display: "flex", justifyContent: "center" },
  searchInput: { width: "80%", padding: "0.7rem 1rem", border: "1px solid #c2a878", borderRadius: "8px", fontSize: "1rem", outline: "none", color: "#3e2c1c", backgroundColor: "#fff8ef" },
  buttonGroup: { display: "flex", justifyContent: "center", gap: "1rem" },
  buttonPrimary: { backgroundColor: "#a67c52", color: "white", border: "none", padding: "0.7rem 1.2rem", borderRadius: "8px", cursor: "pointer", transition: "all 0.3s ease" },
  buttonSecondary: { backgroundColor: "#c2a878", color: "#3e2c1c", border: "none", padding: "0.7rem 1.2rem", borderRadius: "8px", cursor: "pointer", transition: "all 0.3s ease" },
  buttonClose: { backgroundColor: "#8b6b4a", color: "white", border: "none", padding: "0.7rem 1.2rem", borderRadius: "8px", cursor: "pointer", transition: "all 0.3s ease" },
  message: { backgroundColor: "#e0d6c2", borderLeft: "5px solid #8b6b4a", padding: "0.8rem", borderRadius: "6px", marginBottom: "1rem", textAlign: "center", fontWeight: "500" },
  table: { width: "100%", borderCollapse: "collapse", backgroundColor: "#fff8ef", borderRadius: "8px", overflow: "hidden" },
  th: { backgroundColor: "#a67c52", color: "white", padding: "0.8rem", textAlign: "left" },
  tr: { borderBottom: "1px solid #d2b48c" },
  td: { padding: "0.7rem", color: "#3e2c1c" },
  noData: { textAlign: "center", padding: "1rem", color: "#6b4f3b", fontStyle: "italic" },
};
