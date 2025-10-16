import { pool } from "../config/db.js";
import QRCode from "qrcode";

// -------------------- Generar QR para un producto --------------------
export const generarQRProducto = async (req, res) => {
  const { id_producto } = req.params;

  if (!id_producto || isNaN(Number(id_producto))) {
    return res.status(400).json({ error: "id_producto must be numeric" });
  }

  try {
    // Obtener el código QR de la base de datos
    const result = await pool.query(
      "SELECT codigo_qr FROM codigo_qr WHERE id_producto = $1",
      [id_producto]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Producto o QR no encontrado" });
    }

    const codigoQR = result.rows[0].codigo_qr;

    // Generar la imagen del QR en formato Data URL
    const qrDataURL = await QRCode.toDataURL(codigoQR);

    return res.json({
      id_producto,
      codigoQR,
      qrDataURL, // Puedes usar esto en el frontend para mostrar el QR directamente
    });
  } catch (error) {
    console.error("generarQRProducto error:", error.message);
    return res.status(500).json({ error: "Error al generar QR" });
  }
};
