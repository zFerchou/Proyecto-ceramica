import { pool } from "../config/db.js";

// GET /api/dashboard/productos-resumen
// Returns: { top: [...], recientes: [...], agotando: [...] }
export const getProductosResumen = async (req, res) => {
  try {
    // Top vendidos: sumar cantidades vendidas por producto
    const topVendidosQuery = `
      SELECT p.id_producto,
             p.nombre,
             p.descripcion,
             p.precio,
             p.imagen_url,
             p.cantidad AS stock,
             COALESCE(SUM(tp.cantidad), 0) AS ventas,
             ('/qr/' || q.codigo_qr || '.png') AS qr_image_path
      FROM producto p
      LEFT JOIN codigo_qr q ON p.id_producto = q.id_producto
      LEFT JOIN ticket_producto tp ON tp.id_producto = p.id_producto
      LEFT JOIN ticket t ON t.id_ticket = tp.id_ticket
      LEFT JOIN venta v ON v.id_venta = t.id_venta
      GROUP BY p.id_producto, p.nombre, p.descripcion, p.precio, p.imagen_url, p.cantidad, q.codigo_qr
      ORDER BY ventas DESC, p.id_producto DESC
      LIMIT 3`;

    const recientesQuery = `
      SELECT p.id_producto,
             p.nombre,
             p.descripcion,
             p.precio,
             p.imagen_url,
             p.cantidad AS stock,
             0 AS ventas,
             ('/qr/' || q.codigo_qr || '.png') AS qr_image_path
      FROM producto p
      LEFT JOIN codigo_qr q ON p.id_producto = q.id_producto
      ORDER BY p.id_producto DESC
      LIMIT 3`;

    const agotandoQuery = `
      SELECT p.id_producto,
        p.nombre,
        p.descripcion,
        p.precio,
        p.imagen_url,
        p.cantidad AS stock,
        COALESCE(SUM(tp.cantidad), 0) AS ventas,
        ('/qr/' || q.codigo_qr || '.png') AS qr_image_path
      FROM producto p
      LEFT JOIN codigo_qr q ON p.id_producto = q.id_producto
      LEFT JOIN ticket_producto tp ON tp.id_producto = p.id_producto
      WHERE p.cantidad <= 3
      GROUP BY p.id_producto, p.nombre, p.descripcion, p.precio, p.imagen_url, p.cantidad, q.codigo_qr
      ORDER BY p.cantidad ASC, p.id_producto DESC
      LIMIT 3`;

    const [topVendidos, recientes, agotando] = await Promise.all([
      pool.query(topVendidosQuery),
      pool.query(recientesQuery),
      pool.query(agotandoQuery),
    ]);

    return res.json({
      top: topVendidos.rows,
      recientes: recientes.rows,
      agotando: agotando.rows,
    });
  } catch (error) {
    console.error("getProductosResumen error:", error.message);
    return res.status(500).json({ error: "Error al obtener resumen de productos" });
  }
};

export default { getProductosResumen };
