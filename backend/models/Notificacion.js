import { pool } from "../config/db.js"; // usa directamente tu pool
import { v4 as uuidv4 } from "uuid"; // solo si lo necesitas para algo

export class Notificacion {
  static async crear(usuario_id, mensaje, critica = false) {
    const fecha_creacion = new Date();
    const fecha_expiracion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const res = await pool.query(
      `INSERT INTO notificaciones (usuario_id, mensaje, leida, critica, fecha_creacion, fecha_expiracion)
       VALUES ($1, $2, false, $3, $4, $5)
       RETURNING *`,
      [usuario_id, mensaje, critica, fecha_creacion, fecha_expiracion]
    );
    return res.rows[0];
  }

  static async listarPorUsuario(usuario_id) {
    const res = await pool.query(
      `SELECT * FROM notificaciones WHERE usuario_id = $1 AND fecha_expiracion > NOW() ORDER BY fecha_creacion DESC`,
      [usuario_id]
    );
    return res.rows;
  }

  static async marcarLeida(id) {
    const res = await pool.query(
      `UPDATE notificaciones SET leida = true WHERE id = $1 RETURNING *`,
      [id]
    );
    return res.rows[0];
  }

  static async eliminarExpiradas() {
    await pool.query(`DELETE FROM notificaciones WHERE fecha_expiracion <= NOW()`);
  }
}
