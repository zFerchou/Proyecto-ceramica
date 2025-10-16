import { pool } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

// -------------------- Helper de validación --------------------
const validateNuevoProducto = (body) => {
  const errors = [];
  if (!body || typeof body !== "object") {
    errors.push("Request body must be a JSON object");
    return errors;
  }
  const { nombre, cantidad, precio, id_categoria } = body;
  if (!nombre || typeof nombre !== "string")
    errors.push("nombre is required and must be a string");
  if (body.descripcion && typeof body.descripcion !== "string")
    errors.push("descripcion must be a string");
  if (
    cantidad === undefined ||
    typeof cantidad !== "number" ||
    !Number.isInteger(cantidad) ||
    cantidad < 0
  )
    errors.push(
      "cantidad is required, must be a non-negative integer"
    );
  if (precio === undefined || typeof precio !== "number" || precio < 0)
    errors.push("precio is required and must be a non-negative number");
  if (
    id_categoria !== undefined &&
    !(
      Number.isInteger(id_categoria) ||
      (typeof id_categoria === "number" && Number.isInteger(id_categoria))
    )
  )
    errors.push("id_categoria must be an integer if provided");
  return errors;
};

// -------------------- Crear producto --------------------
export const crearProducto = async (req, res) => {
  const validationErrors = validateNuevoProducto(req.body);
  if (validationErrors.length > 0) {
    return res
      .status(400)
      .json({ error: "Invalid request body", details: validationErrors });
  }

  const { nombre, descripcion = null, cantidad, precio, id_categoria = null } =
    req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Verificar si ya existe un producto con el mismo nombre
    const existsByName = await client.query(
      `SELECT id_producto FROM producto WHERE nombre = $1`,
      [nombre]
    );
    if (existsByName.rowCount > 0) {
      const existingId = existsByName.rows[0].id_producto;
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({ error: "Producto con el mismo nombre ya existe", existingId });
    }

    // Insertar producto
    const insertProductoText = `
      INSERT INTO producto (nombre, descripcion, cantidad, precio, id_categoria)
      VALUES ($1, $2, $3, $4, $5) RETURNING id_producto
    `;
    const nuevoProducto = await client.query(insertProductoText, [
      nombre,
      descripcion,
      cantidad,
      precio,
      id_categoria,
    ]);

    if (!nuevoProducto.rows || nuevoProducto.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(500)
        .json({ error: "Failed to create producto (no id returned)" });
    }

    const id_producto = nuevoProducto.rows[0].id_producto;

    // Generar códigos independientes
    const codigoBarras = uuidv4();
    const codigoQR = uuidv4();

    // Insertar código de barras
    await client.query(
      `INSERT INTO codigo_barras (codigo, id_producto) VALUES ($1, $2)`,
      [codigoBarras, id_producto]
    );

    // Insertar código QR en BD
    await client.query(
      `INSERT INTO codigo_qr (codigo_qr, id_producto) VALUES ($1, $2)`,
      [codigoQR, id_producto]
    );

    // Generar imagen del código QR en /public/qr/
    const qrDir = path.resolve("public", "qr");
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    const qrPath = path.join(qrDir, `${codigoQR}.png`);
    await QRCode.toFile(qrPath, codigoQR, {
      color: { dark: "#000000", light: "#FFFFFF" },
      width: 300,
    });

    await client.query("COMMIT");
    return res.status(201).json({
      message: "Producto registrado exitosamente",
      id_producto,
      codigo_barras: codigoBarras,
      codigo_qr: codigoQR,
      qr_image_path: `/public/qr/${codigoQR}.png`,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(
      "crearProducto error:",
      error.message,
      error.code ? `code=${error.code}` : ""
    );
    if (error && error.code) {
      switch (error.code) {
        case "23503":
          return res.status(400).json({ error: "Referential integrity error" });
        case "23505":
          return res.status(409).json({ error: "Duplicate entry" });
        case "42P01":
          return res.status(500).json({ error: "Database table not found" });
        default:
          return res
            .status(500)
            .json({ error: "Database error", code: error.code });
      }
    }
    return res
      .status(500)
      .json({ error: "Unexpected error while creating producto" });
  } finally {
    client.release();
  }
};

// -------------------- Listar productos --------------------
export const listarProductos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT nombre, descripcion, cantidad, precio 
       FROM producto 
       ORDER BY nombre ASC`
    );
    return res.json(result.rows);
  } catch (error) {
    console.error(
      "listarProductos error:",
      error.message,
      error.code ? `code=${error.code}` : ""
    );
    return res
      .status(500)
      .json({ error: "Error al listar productos", code: error.code });
  }
};

// -------------------- Actualizar stock --------------------
export const actualizarStock = async (req, res) => {
  const { id_producto } = req.params;
  const { cantidad } = req.body;

  if (!id_producto || isNaN(Number(id_producto)))
    return res.status(400).json({ error: "id_producto must be numeric" });
  if (
    cantidad === undefined ||
    !Number.isInteger(cantidad) ||
    cantidad <= 0
  )
    return res
      .status(400)
      .json({ error: "cantidad must be positive integer" });

  try {
    const producto = await pool.query(
      `SELECT cantidad FROM producto WHERE id_producto = $1`,
      [id_producto]
    );
    if (producto.rowCount === 0)
      return res.status(404).json({ error: "Producto no encontrado" });

    const nuevaCantidad = producto.rows[0].cantidad + cantidad;
    const update = await pool.query(
      `UPDATE producto SET cantidad = $1 WHERE id_producto = $2 RETURNING cantidad`,
      [nuevaCantidad, id_producto]
    );
    return res.json({
      message: "Stock actualizado correctamente",
      nuevaCantidad: update.rows[0].cantidad,
    });
  } catch (error) {
    console.error(
      "actualizarStock error:",
      error.message,
      error.code ? `code=${error.code}` : ""
    );
    return res.status(500).json({ error: "Database error", code: error.code });
  }
};

// -------------------- Actualizar stock por código de barras --------------------
export const actualizarStockPorCodigo = async (req, res) => {
  const { codigo, cantidad } = req.body;
  if (!codigo || typeof codigo !== "string")
    return res.status(400).json({ error: "codigo must be string" });
  if (!cantidad || !Number.isInteger(cantidad) || cantidad <= 0)
    return res
      .status(400)
      .json({ error: "cantidad must be positive integer" });

  try {
    const prod = await pool.query(
      `
      SELECT p.id_producto 
      FROM producto p 
      JOIN codigo_barras c ON p.id_producto = c.id_producto 
      WHERE c.codigo = $1
    `,
      [codigo]
    );
    if (prod.rowCount === 0)
      return res
        .status(404)
        .json({ error: "Producto no encontrado para el codigo" });

    const id_producto = prod.rows[0].id_producto;
    const producto = await pool.query(
      `SELECT cantidad FROM producto WHERE id_producto = $1`,
      [id_producto]
    );
    const nuevaCantidad = producto.rows[0].cantidad + cantidad;
    const update = await pool.query(
      `UPDATE producto SET cantidad = $1 WHERE id_producto = $2 RETURNING cantidad`,
      [nuevaCantidad, id_producto]
    );
    return res.json({
      message: "Stock actualizado correctamente",
      nuevaCantidad: update.rows[0].cantidad,
    });
  } catch (error) {
    console.error(
      "actualizarStockPorCodigo error:",
      error.message,
      error.code ? `code=${error.code}` : ""
    );
    return res.status(500).json({ error: "Database error", code: error.code });
  }
};

// -------------------- Eliminar producto --------------------
export const eliminarProducto = async (req, res) => {
  const { id_producto } = req.params;
  if (!id_producto || isNaN(Number(id_producto)))
    return res.status(400).json({ error: "id_producto must be numeric" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Borrar ambos códigos relacionados
    await client.query(`DELETE FROM codigo_barras WHERE id_producto = $1`, [
      id_producto,
    ]);
    await client.query(`DELETE FROM codigo_qr WHERE id_producto = $1`, [
      id_producto,
    ]);

    const deleted = await client.query(
      `DELETE FROM producto WHERE id_producto = $1 RETURNING id_producto`,
      [id_producto]
    );
    if (deleted.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    await client.query("COMMIT");
    return res.json({
      message: "Producto eliminado correctamente",
      id_producto: deleted.rows[0].id_producto,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(
      "eliminarProducto error:",
      error.message,
      error.code ? `code=${error.code}` : ""
    );
    return res.status(500).json({ error: "Database error", code: error.code });
  } finally {
    client.release();
  }
};

// -------------------- Actualizar detalles --------------------
export const actualizarDetalles = async (req, res) => {
  const { id_producto } = req.params;
  const { nombre, descripcion, precio, id_categoria } = req.body;

  if (!id_producto || isNaN(Number(id_producto)))
    return res.status(400).json({ error: "id_producto must be numeric" });
  if (
    nombre === undefined &&
    descripcion === undefined &&
    precio === undefined &&
    id_categoria === undefined
  ) {
    return res
      .status(400)
      .json({ error: "At least one field must be provided" });
  }

  const updates = [];
  const values = [];
  let idx = 1;

  if (nombre !== undefined) {
    updates.push(`nombre = $${idx++}`);
    values.push(nombre);
  }
  if (descripcion !== undefined) {
    updates.push(`descripcion = $${idx++}`);
    values.push(descripcion);
  }
  if (precio !== undefined) {
    updates.push(`precio = $${idx++}`);
    values.push(precio);
  }
  if (id_categoria !== undefined) {
    updates.push(`id_categoria = $${idx++}`);
    values.push(id_categoria);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (nombre !== undefined) {
      const exists = await client.query(
        `SELECT id_producto FROM producto WHERE nombre = $1 AND id_producto <> $2`,
        [nombre, id_producto]
      );
      if (exists.rowCount > 0) {
        await client.query("ROLLBACK");
        return res
          .status(409)
          .json({ error: "Otro producto con ese nombre ya existe" });
      }
    }

    const setClause = updates.join(", ");
    const queryText = `UPDATE producto SET ${setClause} WHERE id_producto = $${idx} RETURNING id_producto, nombre, descripcion, cantidad, precio, id_categoria`;
    values.push(id_producto);

    const result = await client.query(queryText, values);
    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    await client.query("COMMIT");
    return res.json({
      message: "Producto actualizado correctamente",
      producto: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(
      "actualizarDetalles error:",
      error.message,
      error.code ? `code=${error.code}` : ""
    );
    return res.status(500).json({ error: "Database error", code: error.code });
  } finally {
    client.release();
  }
};
