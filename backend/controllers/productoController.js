// src/controllers/productoController.js
import { pool } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

// Registrar producto nuevo
export const crearProducto = async (req, res) => {
  const { nombre, descripcion, cantidad, precio, id_categoria } = req.body;

  try {
    const nuevoProducto = await pool.query(
      `INSERT INTO producto (nombre, descripcion, cantidad, precio, id_categoria)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_producto`,
      [nombre, descripcion, cantidad, precio, id_categoria]
    );

    const id_producto = nuevoProducto.rows[0].id_producto;
    const codigo = uuidv4(); // Genera un código único

    await pool.query(
      `INSERT INTO codigo_barras (codigo, id_producto)
       VALUES ($1, $2)`,
      [codigo, id_producto]
    );

    res.status(201).json({
      message: "Producto registrado exitosamente",
      id_producto,
      codigo_barras: codigo,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar el producto" });
  }
};

// Actualizar stock de un producto existente
export const actualizarStock = async (req, res) => {
  const { id_producto } = req.params;
  const { cantidad } = req.body;

  try {
    const producto = await pool.query(
      `SELECT cantidad FROM producto WHERE id_producto = $1`,
      [id_producto]
    );

    if (producto.rowCount === 0)
      return res.status(404).json({ error: "Producto no encontrado" });

    const nuevaCantidad = producto.rows[0].cantidad + cantidad;

    await pool.query(
      `UPDATE producto SET cantidad = $1 WHERE id_producto = $2`,
      [nuevaCantidad, id_producto]
    );

    res.json({
      message: "Stock actualizado correctamente",
      nuevaCantidad,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el stock" });
  }
};
