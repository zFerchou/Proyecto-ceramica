import { pool } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// __dirname helper for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sanitizeProductName(name) {
  if (!name || typeof name !== "string") return "imagen";
  const trimmed = name.trim();
  const sanitized = trimmed.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
  return sanitized || "imagen";
}

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
    errors.push("cantidad is required, must be a non-negative integer");
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
  const raw = req.body || {};
  const parsedPayload = {
    nombre: raw.nombre,
    descripcion: raw.descripcion,
    cantidad:
      typeof raw.cantidad === "string"
        ? Number.parseInt(raw.cantidad, 10)
        : raw.cantidad,
    precio:
      typeof raw.precio === "string"
        ? Number.parseFloat(raw.precio)
        : raw.precio,
    id_categoria:
      raw.id_categoria === undefined || raw.id_categoria === null || raw.id_categoria === ""
        ? undefined
        : typeof raw.id_categoria === "string"
        ? Number.parseInt(raw.id_categoria, 10)
        : raw.id_categoria,
  };

  const validationErrors = validateNuevoProducto(parsedPayload);
  if (validationErrors.length > 0) {
    return res
      .status(400)
      .json({ error: "Invalid request body", details: validationErrors });
  }

  const {
    nombre,
    descripcion = null,
    cantidad,
    precio,
    id_categoria = null,
  } = parsedPayload;
  const imagenFile = req.file || null;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

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

    let imagen_url = null;
    if (imagenFile) {
      try {
        const uploadsDir = path.join(__dirname, "../public/uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const safeName = sanitizeProductName(nombre);
        const finalName = `${safeName}.png`;
        const finalPath = path.join(uploadsDir, finalName);

        await sharp(imagenFile.buffer).png({ quality: 90 }).toFile(finalPath);
        imagen_url = `/uploads/${finalName}`;
      } catch (imgErr) {
        await client.query("ROLLBACK");
        console.error("Error procesando imagen:", imgErr);
        return res.status(500).json({ error: "Error al procesar/guardar la imagen" });
      }
    }

    const insertProductoText = `
      INSERT INTO producto (nombre, descripcion, cantidad, precio, id_categoria, imagen_url)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_producto
    `;
    const nuevoProducto = await client.query(insertProductoText, [
      nombre,
      descripcion,
      cantidad,
      precio,
      id_categoria,
      imagen_url,
    ]);

    if (!nuevoProducto.rows || nuevoProducto.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(500)
        .json({ error: "Failed to create producto (no id returned)" });
    }

    const id_producto = nuevoProducto.rows[0].id_producto;

    const codigoBarras = await generarEAN13Unico(client);
    const codigoQR = uuidv4();

    await client.query(
      `INSERT INTO codigo_barras (codigo, id_producto) VALUES ($1, $2)`,
      [codigoBarras, id_producto]
    );

    await client.query(
      `INSERT INTO codigo_qr (codigo_qr, id_producto) VALUES ($1, $2)`,
      [codigoQR, id_producto]
    );

    const frontendURL = `http://localhost:3000/producto/${id_producto}`;

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Producto registrado exitosamente",
      id_producto,
      codigo_barras: codigoBarras,
      codigo_qr: codigoQR,
      qr_link: frontendURL,
      imagen_url,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("crearProducto error:", error.message);
    return res
      .status(500)
      .json({ error: "Unexpected error while creating producto" });
  } finally {
    client.release();
  }
};

// -------------------- Helpers de código de barras EAN-13 --------------------
function calcularCheckDigitEAN13(base12) {
  const digits = base12.split("").map((d) => parseInt(d, 10));
  if (digits.length !== 12 || digits.some((d) => Number.isNaN(d))) {
    throw new Error("Base EAN-13 inválida: requiere 12 dígitos");
  }
  let sumOdd = 0;
  let sumEven = 0;
  for (let i = 0; i < 12; i++) {
    if ((i + 1) % 2 === 0) sumEven += digits[i];
    else sumOdd += digits[i];
  }
  const total = sumOdd + sumEven * 3;
  const mod = total % 10;
  return (10 - mod) % 10;
}

function generarDigitosAleatorios(cuantos) {
  let s = "";
  for (let i = 0; i < cuantos; i++) {
    s += String(crypto.randomInt(0, 10));
  }
  return s;
}

async function generarEAN13Unico(client) {
  let prefix = process.env.EAN_PREFIX || "290";
  prefix = String(prefix).replace(/\D/g, "");
  if (!prefix || prefix.length >= 12) prefix = "290";

  const maxIntentos = 30;
  for (let intento = 0; intento < maxIntentos; intento++) {
    const faltan = 12 - prefix.length;
    const base12 = prefix + generarDigitosAleatorios(faltan);
    const check = calcularCheckDigitEAN13(base12);
    const codigo = base12 + String(check);

    const exists = await client.query(
      `SELECT 1 FROM codigo_barras WHERE codigo = $1 LIMIT 1`,
      [codigo]
    );
    if (exists.rowCount === 0) {
      return codigo;
    }
  }
  throw new Error("No fue posible generar un código EAN-13 único después de varios intentos");
}

export const listarProductos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         p.id_producto,
         p.nombre, 
         p.descripcion, 
         p.cantidad, 
         p.precio,
         p.id_categoria,
         c.nombre as nombre_categoria,  -- NUEVO: nombre de la categoría
         p.imagen_url,
         cb.codigo AS codigo_barras,
         q.codigo_qr AS codigo_qr
       FROM producto p
       LEFT JOIN categoria c ON p.id_categoria = c.id_categoria  -- NUEVO JOIN
       LEFT JOIN codigo_barras cb ON p.id_producto = cb.id_producto
       LEFT JOIN codigo_qr q ON p.id_producto = q.id_producto
       ORDER BY p.nombre ASC`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("listarProductos error:", error.message);
    return res.status(500).json({ error: "Error al listar productos" });
  }
};

// -------------------- Actualizar stock --------------------
export const actualizarStock = async (req, res) => {
  const { id_producto } = req.params;
  const { cantidad } = req.body;

  if (!id_producto || isNaN(Number(id_producto)))
    return res.status(400).json({ error: "id_producto must be numeric" });
  if (cantidad === undefined || !Number.isInteger(cantidad) || cantidad <= 0)
    return res.status(400).json({ error: "cantidad must be positive integer" });

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
    console.error("actualizarStock error:", error.message);
    return res.status(500).json({ error: "Database error" });
  }
};

// -------------------- Actualizar stock por código de barras --------------------
export const actualizarStockPorCodigo = async (req, res) => {
  const { codigo, cantidad } = req.body;
  if (!codigo || typeof codigo !== "string")
    return res.status(400).json({ error: "codigo must be string" });
  if (!cantidad || !Number.isInteger(cantidad) || cantidad <= 0)
    return res.status(400).json({ error: "cantidad must be positive integer" });

  try {
    const prod = await pool.query(
      `SELECT p.id_producto 
       FROM producto p 
       JOIN codigo_barras c ON p.id_producto = c.id_producto 
       WHERE c.codigo = $1`,
      [codigo]
    );
    if (prod.rowCount === 0)
      return res.status(404).json({ error: "Producto no encontrado para el codigo" });

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
    console.error("actualizarStockPorCodigo error:", error.message);
    return res.status(500).json({ error: "Database error" });
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

    const prodInfo = await client.query(
      `SELECT id_producto, imagen_url FROM producto WHERE id_producto = $1`,
      [id_producto]
    );
    if (prodInfo.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    const imagen_url = prodInfo.rows[0].imagen_url;

    await client.query(`DELETE FROM ticket_producto WHERE id_producto = $1`, [id_producto]);
    await client.query(`DELETE FROM codigo_barras WHERE id_producto = $1`, [id_producto]);
    await client.query(`DELETE FROM codigo_qr WHERE id_producto = $1`, [id_producto]);

    const deleted = await client.query(
      `DELETE FROM producto WHERE id_producto = $1 RETURNING id_producto`,
      [id_producto]
    );
    if (deleted.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    await client.query("COMMIT");

    try {
      if (imagen_url) {
        const publicDir = path.join(__dirname, "../public");
        const absPath = path.join(publicDir, imagen_url.replace(/^\/+/, ""));
        if (fs.existsSync(absPath)) {
          fs.unlinkSync(absPath);
        }
      }
    } catch (imgErr) {
      console.warn("No se pudo eliminar la imagen del producto:", imgErr?.message || imgErr);
    }

    return res.json({
      message: "Producto eliminado correctamente",
      id_producto: deleted.rows[0].id_producto,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("eliminarProducto error:", error.message);
    return res.status(500).json({ error: "Database error" });
  } finally {
    client.release();
  }
};

// -------------------- Actualizar detalles --------------------
export const actualizarDetalles = async (req, res) => {
  const { id_producto } = req.params;
  const { nombre, descripcion, precio, cantidad, id_categoria } = req.body; // ← AÑADIR cantidad aquí

  if (!id_producto || isNaN(Number(id_producto)))
    return res.status(400).json({ error: "id_producto must be numeric" });
  if (
    nombre === undefined &&
    descripcion === undefined &&
    precio === undefined &&
    cantidad === undefined && // ← AÑADIR cantidad aquí
    id_categoria === undefined
  ) {
    return res.status(400).json({ error: "At least one field must be provided" });
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
  if (cantidad !== undefined) { // ← AÑADIR este bloque completo
    updates.push(`cantidad = $${idx++}`);
    values.push(cantidad);
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
    console.error("actualizarDetalles error:", error.message);
    return res.status(500).json({ error: "Database error" });
  } finally {
    client.release();
  }
};
// -------------------- Exportar helpers para tests --------------------
export { sanitizeProductName, calcularCheckDigitEAN13, generarDigitosAleatorios };
