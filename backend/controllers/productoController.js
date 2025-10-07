// src/controllers/productoController.js
import { pool } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

// Helper: validate product payload for crearProducto
// Comentarios de errores posibles:
// - Si el body no es un objeto JSON -> respondemos 400 con mensaje claro
// - Si faltan campos obligatorios (nombre, cantidad, precio) o son de tipo incorrecto -> 400 con detalles
// - Estos errores evitan llegar a la base de datos con datos inválidos
const validateNuevoProducto = (body) => {
  const errors = [];
  if (!body || typeof body !== 'object') {
    errors.push('Request body must be a JSON object');
    return errors;
  }
  const { nombre, cantidad, precio, id_categoria } = body;
  if (!nombre || typeof nombre !== 'string') errors.push('nombre is required and must be a string');
  if (body.descripcion && typeof body.descripcion !== 'string') errors.push('descripcion must be a string');
  if (cantidad === undefined || typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad < 0) errors.push('cantidad is required, must be a non-negative integer');
  if (precio === undefined || typeof precio !== 'number' || precio < 0) errors.push('precio is required and must be a non-negative number');
  if (id_categoria !== undefined && !(Number.isInteger(id_categoria) || (typeof id_categoria === 'number' && Number.isInteger(id_categoria)))) errors.push('id_categoria must be an integer if provided');
  return errors;
};

// Registrar producto nuevo (usa transacción para consistencia)
// Errores en esta función y cómo se mapean a respuestas HTTP:
// - 400: validación de entrada falló (tipos o campos faltantes)
// - 400: violation de clave foránea (error.code === '23503') => id_categoria no existe
// - 409: conflict (unique violation, '23505') => intento de crear un recurso duplicado
// - 500: tabla no encontrada ('42P01') => la BD no tiene las tablas necesarias
// - 500: error inesperado de base de datos (código desconocido) => devolvemos código y detalle para debugging
// - 500: si la inserción no retorna id (caso extraño) => rollback y error genérico
export const crearProducto = async (req, res) => {
  const validationErrors = validateNuevoProducto(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Invalid request body', details: validationErrors });
  }

  const { nombre, descripcion = null, cantidad, precio, id_categoria = null } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verificación preventiva: si ya existe un producto con el mismo nombre, devolvemos 409
    // Esto evita intentar insertar y obtener una 23505; sin embargo mantenemos el handler
    // de 23505 para cubrir condiciones de carrera.
    const existsByName = await client.query(`SELECT id_producto FROM producto WHERE nombre = $1`, [nombre]);
    if (existsByName.rowCount > 0) {
      // Si ya existe un producto con el mismo nombre devolvemos 409 y el id existente
      const existingId = existsByName.rows[0].id_producto;
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Producto con el mismo nombre ya existe', existingId });
    }

    const insertProductoText = `INSERT INTO producto (nombre, descripcion, cantidad, precio, id_categoria)
      VALUES ($1, $2, $3, $4, $5) RETURNING id_producto`;

    const nuevoProducto = await client.query(insertProductoText, [nombre, descripcion, cantidad, precio, id_categoria]);

    if (!nuevoProducto.rows || nuevoProducto.rows.length === 0) {
      // Caso raro: la inserción no devolvió id_producto
      // Respuesta: hacemos ROLLBACK y devolvemos 500 porque la operación no se completó
      await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Failed to create producto (no id returned)' });
    }

    const id_producto = nuevoProducto.rows[0].id_producto;
    const codigo = uuidv4(); // Genera un código único

    const insertCodigoText = `INSERT INTO codigo_barras (codigo, id_producto) VALUES ($1, $2)`;
    await client.query(insertCodigoText, [codigo, id_producto]);

    await client.query('COMMIT');

    return res.status(201).json({ message: 'Producto registrado exitosamente', id_producto, codigo_barras: codigo });
  } catch (error) {
  // Si ocurre cualquier error durante la transacción, intentamos hacer ROLLBACK
  await client.query('ROLLBACK').catch(() => {});
  // Mensajes en consola (ejemplos y cómo interpretarlos):
  // - "crearProducto error: error message" -> mensaje general; ver `error.code` para más detalle
  // - Si aparece "error code: 23503" en el objeto, significa foreign key violation (id_categoria no existe)
  // - Si aparece "error code: 23505", significa unique violation (p. ej. codigo_barras duplicado)
  // - Si aparece "error code: 42P01", significa tabla no encontrada: falta ejecutar el script de creación de tablas
  // Estos logs ayudan a depurar en el servidor; no se retornan directamente al cliente (salvo código y detalle mínimo)
  console.error('crearProducto error:', error && error.message ? error.message : error, error && error.code ? `code=${error.code}` : '');

    // Manejo específico para errores de PostgreSQL:
    // - 23503: foreign_key_violation -> normalmente id_categoria no existe. Mapeamos a 400
    // - 23505: unique_violation -> intento de insertar un valor único duplicado (409)
    // - 42P01: undefined_table -> tablas faltantes; mapear a 500 con mensaje claro
    // - Otros códigos -> 500 con código y detalle para ayudar a depuración
    if (error && error.code) {
      switch (error.code) {
        case '23503':
          // Violación de FK: el cliente suministró un id_categoria que no existe
          return res.status(400).json({ error: 'Referential integrity error', detail: error.detail || 'Foreign key violation (id_categoria may not exist)' });
        case '23505':
          // Violación de unicidad: por ejemplo si codigo_barras debe ser único y ya existe
          return res.status(409).json({ error: 'Conflict', detail: 'Duplicate entry' });
        case '42P01':
          // Tabla no existe: el proyecto no creó las tablas necesarias
          return res.status(500).json({ error: 'Database table not found', detail: 'One or more required tables do not exist' });
        default:
          // Código no esperado: devolvemos el código y detalle para depuración
          return res.status(500).json({ error: 'Database error', code: error.code, detail: error.detail || error.message });
      }
    }

    // Fallback genérico si no es un error de Postgres con código
    return res.status(500).json({ error: 'Unexpected error while creating producto' });
  } finally {
    // Liberamos siempre el cliente para evitar fugas de conexiones
    client.release();
  }
};

// Actualizar stock de un producto existente
export const actualizarStock = async (req, res) => {
  const { id_producto } = req.params;
  const { cantidad } = req.body;

  // Validate params and body
  if (!id_producto || isNaN(Number(id_producto))) {
    // id_producto inválido en la URL -> 400
    return res.status(400).json({ error: 'id_producto must be a numeric parameter' });
  }
  // Requerimos un entero POSITIVO mayor que 0 para aumentar stock.
  // No permitimos enviar 0 ni valores negativos en este endpoint.
  if (cantidad === undefined || typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad <= 0) {
    // cantidad inválida en el body -> 400
    return res.status(400).json({ error: 'cantidad is required in body and must be a positive integer greater than 0' });
  }

  try {
    // Use parameterized queries to avoid injections
    const producto = await pool.query(`SELECT cantidad FROM producto WHERE id_producto = $1`, [id_producto]);

    if (producto.rowCount === 0) {
      // No existe el producto solicitado -> 404
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const current = producto.rows[0].cantidad;
    // Sumamos cantidad positiva al stock actual
    const nuevaCantidad = current + cantidad;

    const update = await pool.query(`UPDATE producto SET cantidad = $1 WHERE id_producto = $2 RETURNING cantidad`, [nuevaCantidad, id_producto]);

    if (!update.rows || update.rows.length === 0) {
      // Resultado inesperado: no se devolvió la fila actualizada -> 500
      return res.status(500).json({ error: 'No se pudo actualizar el stock' });
    }

    return res.json({ message: 'Stock actualizado correctamente', nuevaCantidad: update.rows[0].cantidad });
  } catch (error) {
  // Log del error y mapeo de errores PG
  // Mensajes en consola (ejemplos y cómo interpretarlos):
  // - "actualizarStock error: error message" -> mensaje general de fallo
  // - Si aparece "code=42P01" significa que la tabla `producto` no existe
  // - Otros códigos PG indican distintos problemas (constraint violations, etc.)
  // Revisa también `error.detail` para información adicional proporcionada por Postgres.
  console.error('actualizarStock error:', error && error.message ? error.message : error, error && error.code ? `code=${error.code}` : '');
    if (error && error.code) {
      switch (error.code) {
        case '42P01':
          // Tabla producto no existe
          return res.status(500).json({ error: 'Database table not found' });
        default:
          // Cualquier otro error de BD
          return res.status(500).json({ error: 'Database error', code: error.code });
      }
    }
    // Fallback genérico
    return res.status(500).json({ error: 'Unexpected error while updating stock' });
  }
};

// Eliminar un producto por id
export const eliminarProducto = async (req, res) => {
  const { id_producto } = req.params;
  if (!id_producto || isNaN(Number(id_producto))) {
    return res.status(400).json({ error: 'id_producto must be a numeric parameter' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Primero eliminar códigos de barras asociados para evitar violación FK
    await client.query(`DELETE FROM codigo_barras WHERE id_producto = $1`, [id_producto]);

    const deleted = await client.query(`DELETE FROM producto WHERE id_producto = $1 RETURNING id_producto`, [id_producto]);
    if (deleted.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await client.query('COMMIT');
    return res.json({ message: 'Producto eliminado correctamente', id_producto: deleted.rows[0].id_producto });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('eliminarProducto error:', error && error.message ? error.message : error, error && error.code ? `code=${error.code}` : '');
    if (error && error.code) {
      switch (error.code) {
        case '42P01':
          return res.status(500).json({ error: 'Database table not found' });
        default:
          return res.status(500).json({ error: 'Database error', code: error.code });
      }
    }
    return res.status(500).json({ error: 'Unexpected error while deleting producto' });
  } finally {
    client.release();
  }
};

// Actualizar detalles del producto (nombre, descripcion, precio, id_categoria)
export const actualizarDetalles = async (req, res) => {
  const { id_producto } = req.params;
  const { nombre, descripcion, precio, id_categoria } = req.body;

  if (!id_producto || isNaN(Number(id_producto))) {
    return res.status(400).json({ error: 'id_producto must be a numeric parameter' });
  }

  // Validar al menos un campo a actualizar
  if (nombre === undefined && descripcion === undefined && precio === undefined && id_categoria === undefined) {
    return res.status(400).json({ error: 'At least one field (nombre, descripcion, precio, id_categoria) must be provided' });
  }

  const updates = [];
  const values = [];
  let idx = 1;

  if (nombre !== undefined) {
    if (typeof nombre !== 'string' || nombre.trim() === '') return res.status(400).json({ error: 'nombre must be a non-empty string' });
    updates.push(`nombre = $${idx++}`);
    values.push(nombre);
  }
  if (descripcion !== undefined) {
    if (descripcion !== null && typeof descripcion !== 'string') return res.status(400).json({ error: 'descripcion must be a string or null' });
    updates.push(`descripcion = $${idx++}`);
    values.push(descripcion);
  }
  if (precio !== undefined) {
    if (typeof precio !== 'number' || precio < 0) return res.status(400).json({ error: 'precio must be a non-negative number' });
    updates.push(`precio = $${idx++}`);
    values.push(precio);
  }
  if (id_categoria !== undefined) {
    if (id_categoria !== null && !(Number.isInteger(id_categoria) || (typeof id_categoria === 'number' && Number.isInteger(id_categoria)))) return res.status(400).json({ error: 'id_categoria must be an integer or null' });
    updates.push(`id_categoria = $${idx++}`);
    values.push(id_categoria);
  }

  // Begin transaction to check uniqueness and update atomically
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Si se actualiza nombre, validar unicidad (excluyendo este producto)
    if (nombre !== undefined) {
      const exists = await client.query(`SELECT id_producto FROM producto WHERE nombre = $1 AND id_producto <> $2`, [nombre, id_producto]);
      if (exists.rowCount > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Otro producto con ese nombre ya existe', existingId: exists.rows[0].id_producto });
      }
    }

    // Construir query dinamica
    const setClause = updates.join(', ');
    const queryText = `UPDATE producto SET ${setClause} WHERE id_producto = $${idx} RETURNING id_producto, nombre, descripcion, cantidad, precio, id_categoria`;
    values.push(id_producto);

    const result = await client.query(queryText, values);
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await client.query('COMMIT');
    return res.json({ message: 'Producto actualizado correctamente', producto: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('actualizarDetalles error:', error && error.message ? error.message : error, error && error.code ? `code=${error.code}` : '');
    if (error && error.code) {
      switch (error.code) {
        case '23503':
          return res.status(400).json({ error: 'Referential integrity error (id_categoria posiblemente no existe)' });
        case '23505':
          return res.status(409).json({ error: 'Conflict: valor único duplicado' });
        case '42P01':
          return res.status(500).json({ error: 'Database table not found' });
        default:
          return res.status(500).json({ error: 'Database error', code: error.code });
      }
    }
    return res.status(500).json({ error: 'Unexpected error while updating producto details' });
  } finally {
    client.release();
  }
};
