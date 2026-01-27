import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

export default class Usuario {

  // ------------------------
  // Crear un nuevo usuario
  // ------------------------
  static async crear(nombre, email, password, rol, telefono, direccion) {
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Normalizar rol para consistencia
    const rolNormalizado = rol.toLowerCase() === 'admin' ? 'admin' : 'empleado';
    
    const res = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol, telefono, direccion, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, nombre, email, rol, telefono, direccion, fecha_creacion`,
      [nombre, email, hashedPassword, rolNormalizado, telefono, direccion]
    );
    
    return {
      ...res.rows[0],
      rol: rolNormalizado // Asegurar rol normalizado
    };
  }

  // ------------------------
  // Obtener todos los usuarios
  // ------------------------
  static async obtenerTodos() {
    const res = await pool.query(
      `SELECT 
        id, 
        nombre, 
        email, 
        COALESCE(rol, 'empleado') as rol, 
        telefono, 
        direccion, 
        fecha_creacion 
       FROM usuarios 
       ORDER BY fecha_creacion DESC`
    );
    return res.rows;
  }

  // ------------------------
  // Eliminar un usuario
  // ------------------------
  static async eliminar(id) {
    try {
      // Primero obtener el usuario para verificar si es admin
      const usuario = await this.obtenerPorId(id);
      
      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }
      
      // Contar administradores actuales
      const adminCount = await this.contarAdministradores();
      
      // Si el usuario a eliminar es admin y es el último, no permitir
      if (usuario.rol === 'admin' && adminCount <= 1) {
        throw new Error('No se puede eliminar el último administrador');
      }
      
      // Proceder con la eliminación
      const res = await pool.query(
        'DELETE FROM usuarios WHERE id = $1 RETURNING id, nombre, email, rol',
        [id]
      );
      
      return res.rows[0] || null;
      
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  }

  // ------------------------
  // Contar administradores
  // ------------------------
  static async contarAdministradores() {
    const res = await pool.query(
      `SELECT COUNT(*) as count 
       FROM usuarios 
       WHERE LOWER(TRIM(rol)) IN ('admin', 'administrador')`
    );
    return parseInt(res.rows[0].count);
  }

  // ------------------------
  // Obtener usuario por ID
  // ------------------------
  static async obtenerPorId(id) {
    const res = await pool.query(
      `SELECT 
        id, 
        nombre, 
        email, 
        COALESCE(rol, 'empleado') as rol, 
        telefono, 
        direccion, 
        fecha_creacion 
       FROM usuarios 
       WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  // ------------------------
  // Obtener usuario por correo
  // ------------------------
  static async obtenerPorEmail(email) {
    const res = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email.trim()]
    );
    return res.rows[0] || null;
  }

  // ------------------------
  // Actualizar token de recuperación
  // ------------------------
  static async actualizarToken(email, token) {
    const expiryTime = new Date(Date.now() + 3600000);
    const expiryUTC = expiryTime.toISOString();
    const res = await pool.query(
      `UPDATE usuarios
       SET reset_password_token = $1,
           reset_password_expires = $2
       WHERE email = $3
       RETURNING id, nombre, email`,
      [token, expiryUTC, email]
    );
    return res.rows[0];
  }

  // ------------------------
  // Obtener usuario por token
  // ------------------------
  static async obtenerPorToken(token) {
    const query = `
      SELECT * 
      FROM usuarios 
      WHERE reset_password_token = $1 
        AND reset_password_expires > NOW()
    `;
    const res = await pool.query(query, [token]);
    return res.rows[0] || null;
  }

  // ------------------------
  // Actualizar contraseña
  // ------------------------
  static async actualizarPassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const res = await pool.query(
      `UPDATE usuarios 
       SET password = $1,
           reset_password_token = NULL,
           reset_password_expires = NULL
       WHERE id = $2
       RETURNING id, nombre, email`,
      [hashedPassword, id]
    );
    return res.rows[0] || null;
  }

  // ------------------------
  // Normalizar rol de usuario
  // ------------------------
  static normalizarRol(rol) {
    if (!rol) return 'empleado';
    
    const rolLower = rol.toString().toLowerCase().trim();
    
    // Detectar diferentes formatos de admin
    if (rolLower.includes('admin') || rolLower.includes('administrador')) {
      return 'admin';
    }
    
    return 'empleado';
  }
}