import React from "react";

export default function ProductQRModal({ producto, onClose }) {
  if (!producto) return null;

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <h2>{producto.nombre}</h2>
        <p><strong>Descripción:</strong> {producto.descripcion}</p>
        <p><strong>Cantidad:</strong> {producto.cantidad}</p>
        <p><strong>Precio:</strong> ${producto.precio}</p>
        <p><strong>ID Producto:</strong> {producto.id_producto}</p>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent("Producto: " + producto.nombre)}`}
          alt="QR Producto"
        />
        <button onClick={onClose} style={modalStyles.button}>Cerrar</button>
      </div>
    </div>
  );
}

const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999
  },
  modal: {
    backgroundColor: "#fff8ef",
    padding: "2rem",
    borderRadius: "12px",
    maxWidth: "400px",
    textAlign: "center",
    color: "#3e2c1c"
  },
  button: {
    marginTop: "1rem",
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#a67c52",
    color: "white",
    cursor: "pointer"
  }
};
