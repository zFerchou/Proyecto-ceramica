import { pool } from '../config/db.js';

export default class Categoria {
  
  // ------------------------
  // Obtener todas las categorías activas
  // ------------------------
  static async obtenerTodas() {
    try {
      const result = await pool.query(
        `SELECT id_categoria, nombre, descripcion 
         FROM categoria 
         WHERE activa = true 
         ORDER BY nombre ASC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error en Categoria.obtenerTodas:', error);
      throw error;
    }
  }

  // ------------------------
  // Obtener categoría por ID
  // ------------------------
  static async obtenerPorId(id_categoria) {
    try {
      const result = await pool.query(
        `SELECT id_categoria, nombre, descripcion, activa 
         FROM categoria 
         WHERE id_categoria = $1 AND activa = true`,
        [id_categoria]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error en Categoria.obtenerPorId:', error);
      throw error;
    }
  }

  // ------------------------
  // Crear nueva categoría
  // ------------------------
  static async crear(nombre, descripcion = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar si ya existe una categoría con el mismo nombre
      const existe = await client.query(
        `SELECT id_categoria FROM categoria WHERE nombre = $1 AND activa = true`,
        [nombre.trim()]
      );

      if (existe.rows.length > 0) {
        throw new Error('Ya existe una categoría con este nombre');
      }

      // Insertar nueva categoría
      const result = await client.query(
        `INSERT INTO categoria (nombre, descripcion) 
         VALUES ($1, $2) 
         RETURNING id_categoria, nombre, descripcion`,
        [nombre.trim(), descripcion ? descripcion.trim() : null]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error en Categoria.crear:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ------------------------
  // Actualizar categoría
  // ------------------------
  static async actualizar(id_categoria, nombre, descripcion = null) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar si la categoría existe
      const categoriaExistente = await client.query(
        `SELECT id_categoria FROM categoria WHERE id_categoria = $1 AND activa = true`,
        [id_categoria]
      );

      if (categoriaExistente.rows.length === 0) {
        throw new Error('Categoría no encontrada');
      }

      // Verificar si el nuevo nombre ya existe en otra categoría
      if (nombre) {
        const nombreExistente = await client.query(
          `SELECT id_categoria FROM categoria 
           WHERE nombre = $1 AND id_categoria != $2 AND activa = true`,
          [nombre.trim(), id_categoria]
        );

        if (nombreExistente.rows.length > 0) {
          throw new Error('Ya existe otra categoría con este nombre');
        }
      }

      // Actualizar categoría
      const result = await client.query(
        `UPDATE categoria 
         SET nombre = COALESCE($1, nombre), 
             descripcion = COALESCE($2, descripcion)
         WHERE id_categoria = $3 AND activa = true
         RETURNING id_categoria, nombre, descripcion`,
        [nombre ? nombre.trim() : null, descripcion ? descripcion.trim() : null, id_categoria]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error en Categoria.actualizar:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ------------------------
  // Eliminar categoría (borrado lógico)
  // ------------------------
  static async eliminar(id_categoria) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar si la categoría existe
      const categoriaExistente = await client.query(
        `SELECT id_categoria FROM categoria WHERE id_categoria = $1 AND activa = true`,
        [id_categoria]
      );

      if (categoriaExistente.rows.length === 0) {
        throw new Error('Categoría no encontrada');
      }

      // Verificar si la categoría está siendo usada por productos
      const productosConCategoria = await client.query(
        `SELECT COUNT(*) as count FROM producto WHERE id_categoria = $1`,
        [id_categoria]
      );

      if (parseInt(productosConCategoria.rows[0].count) > 0) {
        throw new Error('No se puede eliminar la categoría porque está siendo utilizada por productos existentes');
      }

      // Borrado lógico
      const result = await client.query(
        `UPDATE categoria SET activa = false 
         WHERE id_categoria = $1 
         RETURNING id_categoria, nombre`,
        [id_categoria]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error en Categoria.eliminar:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // ------------------------
  // Restaurar categoría eliminada
  // ------------------------
  static async restaurar(id_categoria) {
    try {
      const result = await pool.query(
        `UPDATE categoria SET activa = true 
         WHERE id_categoria = $1 
         RETURNING id_categoria, nombre, descripcion`,
        [id_categoria]
      );

      if (result.rows.length === 0) {
        throw new Error('Categoría no encontrada');
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error en Categoria.restaurar:', error);
      throw error;
    }
  }

  // ------------------------
  // Verificar si categoría existe
  // ------------------------
  static async existe(id_categoria) {
    try {
      const result = await pool.query(
        `SELECT 1 FROM categoria WHERE id_categoria = $1 AND activa = true`,
        [id_categoria]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error en Categoria.existe:', error);
      throw error;
    }
  }
}