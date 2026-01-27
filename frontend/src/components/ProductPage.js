import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";

export default function ProductPage() {
  const { id } = useParams(); // URL: /producto/:id
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const res = await api.get(`/productos/${id}`);
        const data = await res.json();
        if (res.ok) setProducto(data);
        else console.error("Error al cargar producto:", data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducto();
  }, [id]);

  if (loading) return <p>Cargando...</p>;
  if (!producto) return <p>Producto no encontrado</p>;

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "auto", background: "#fff8ef", borderRadius: "12px" }}>
      <h1>{producto.nombre}</h1>
      <p><strong>Descripción:</strong> {producto.descripcion}</p>
      <p><strong>Cantidad:</strong> {producto.cantidad}</p>
      <p><strong>Precio:</strong> ${producto.precio}</p>
      <p><strong>ID:</strong> {producto.id_producto}</p>
      <img 
        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`} 
        alt="QR Producto" 
      />
    </div>
  );
}
