import { pool } from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

// Crear una venta con productos y generar ticket
export const crearVenta = async (req, res) => {
  const { productos, tipo_pago } = req.body;

  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: 'El campo "productos" debe ser un arreglo no vacío' });
  }
  if (!tipo_pago || typeof tipo_pago !== 'string') {
    return res.status(400).json({ error: 'El campo "tipo_pago" es obligatorio y debe ser una cadena de texto' });
  }

  const tiposPermitidos = ["Efectivo", "Transacción"];
  if (!tiposPermitidos.includes(tipo_pago)) {
    return res.status(400).json({ error: 'El tipo de pago debe ser "Efectivo" o "Transacción"' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ventaInsert = await client.query(
      `INSERT INTO venta (tipo_pago) VALUES ($1) RETURNING id_venta, fecha`,
      [tipo_pago]
    );
    const { id_venta, fecha } = ventaInsert.rows[0];
    const codigo_venta = uuidv4();

    const ticketInsert = await client.query(
      `INSERT INTO ticket (codigo_venta, id_venta) VALUES ($1, $2) RETURNING id_ticket`,
      [codigo_venta, id_venta]
    );
    const id_ticket = ticketInsert.rows[0].id_ticket;

    for (const p of productos) {
      const { nombre_producto, cantidad } = p;
      if (!nombre_producto || typeof nombre_producto !== 'string' || !Number.isInteger(cantidad) || cantidad <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cada producto debe tener "nombre_producto" válido y "cantidad" como entero positivo mayor a 0' });
      }

      const productoCheck = await client.query(
        `SELECT id_producto, cantidad, precio FROM producto WHERE nombre = $1`,
        [nombre_producto]
      );
      if (productoCheck.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Producto con nombre "${nombre_producto}" no encontrado` });
      }

      const { id_producto, cantidad: stockActual, precio } = productoCheck.rows[0];
      if (stockActual < cantidad) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Stock insuficiente para el producto "${nombre_producto}"` });
      }

      await client.query(
        `INSERT INTO ticket_producto (id_ticket, id_producto, cantidad) VALUES ($1, $2, $3)`,
        [id_ticket, id_producto, cantidad]
      );
      await client.query(
        `UPDATE producto SET cantidad = cantidad - $1 WHERE id_producto = $2`,
        [cantidad, id_producto]
      );
    }

    const productosConPrecio = [];
    for (const p of productos) {
      const prodCheck = await client.query(
        `SELECT precio FROM producto WHERE nombre = $1`,
        [p.nombre_producto]
      );
      productosConPrecio.push({
        nombre_producto: p.nombre_producto,
        cantidad: p.cantidad,
        precio: prodCheck.rows[0].precio
      });
    }

    await client.query('COMMIT');
    return res.status(201).json({
      mensaje: 'Venta registrada exitosamente',
      id_venta,
      id_ticket,
      codigo_venta,
      fecha,
      productos: productosConPrecio
    });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('crearVenta error:', error);
    return res.status(500).json({ error: 'Error inesperado al registrar la venta', detalle: error.message });
  } finally {
    client.release();
  }
};

// Consultar venta por id_venta o codigo_venta
export const obtenerVenta = async (req, res) => {
  const { id_venta, codigo_venta } = req.query;
  if (!id_venta && !codigo_venta) return res.status(400).json({ error: 'Se requiere "id_venta" o "codigo_venta"' });

  try {
    let ventaQuery, params;
    if (id_venta) {
      ventaQuery = `SELECT v.id_venta, v.fecha, v.tipo_pago, t.id_ticket, t.codigo_venta
                    FROM venta v
                    JOIN ticket t ON v.id_venta = t.id_venta
                    WHERE v.id_venta = $1`;
      params = [id_venta];
    } else {
      ventaQuery = `SELECT v.id_venta, v.fecha, v.tipo_pago, t.id_ticket, t.codigo_venta
                    FROM venta v
                    JOIN ticket t ON v.id_venta = t.id_venta
                    WHERE t.codigo_venta = $1`;
      params = [codigo_venta];
    }

    const ventaResult = await pool.query(ventaQuery, params);
    if (ventaResult.rowCount === 0) return res.status(404).json({ error: 'Venta no encontrada' });
    const venta = ventaResult.rows[0];

    const productosResult = await pool.query(
      `SELECT p.nombre AS nombre_producto, tp.cantidad, p.precio
       FROM ticket_producto tp
       JOIN producto p ON tp.id_producto = p.id_producto
       WHERE tp.id_ticket = $1`,
      [venta.id_ticket]
    );

    venta.productos = productosResult.rows;
    return res.json(venta);

  } catch (error) {
    console.error('obtenerVenta error:', error);
    return res.status(500).json({ error: 'Error inesperado al consultar la venta', detalle: error.message });
  }
};

// Deshacer venta y revertir stock usando codigo_venta
export const deshacerVenta = async (req, res) => {
  const { codigo_venta } = req.params;
  if (!codigo_venta) return res.status(400).json({ error: 'El parámetro "codigo_venta" es obligatorio' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ticketResult = await client.query(`SELECT id_ticket, id_venta FROM ticket WHERE codigo_venta = $1`, [codigo_venta]);
    if (ticketResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const { id_ticket, id_venta } = ticketResult.rows[0];

    const productosResult = await client.query(`SELECT id_producto, cantidad FROM ticket_producto WHERE id_ticket = $1`, [id_ticket]);
    for (const p of productosResult.rows) {
      await client.query(`UPDATE producto SET cantidad = cantidad + $1 WHERE id_producto = $2`, [p.cantidad, p.id_producto]);
    }

    await client.query(`DELETE FROM ticket_producto WHERE id_ticket = $1`, [id_ticket]);
    await client.query(`DELETE FROM ticket WHERE id_ticket = $1`, [id_ticket]);
    await client.query(`DELETE FROM venta WHERE id_venta = $1`, [id_venta]);

    await client.query('COMMIT');
    return res.json({ mensaje: 'Venta deshecha correctamente', codigo_venta, id_venta });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('deshacerVenta error:', error);
    return res.status(500).json({ error: 'Error inesperado al deshacer la venta', detalle: error.message });
  } finally {
    client.release();
  }
};

// Actualizar venta
export const actualizarVenta = async (req, res) => {
  const { id_venta } = req.params;
  const { tipo_pago, productos } = req.body;

  if (!tipo_pago && (!productos || !Array.isArray(productos))) return res.status(400).json({ error: 'Debe enviar tipo_pago o productos para actualizar' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (tipo_pago) {
      const tiposPermitidos = ["Efectivo", "Transacción"];
      if (!tiposPermitidos.includes(tipo_pago)) return res.status(400).json({ error: 'Tipo de pago inválido' });
      await client.query(`UPDATE venta SET tipo_pago = $1 WHERE id_venta = $2`, [tipo_pago, id_venta]);
    }

    if (productos && productos.length > 0) {
      for (const p of productos) {
        const { nombre_producto, cantidad } = p;
        const prodResult = await client.query(`SELECT id_producto, cantidad FROM producto WHERE nombre = $1`, [nombre_producto]);
        if (prodResult.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: `Producto ${nombre_producto} no encontrado` }); }

        const id_producto = prodResult.rows[0].id_producto;
        const ventaProd = await client.query(
          `SELECT cantidad FROM ticket_producto WHERE id_producto = $1 AND id_ticket = (SELECT id_ticket FROM ticket WHERE id_venta = $2)`,
          [id_producto, id_venta]
        );
        const cantidadActual = ventaProd.rowCount > 0 ? ventaProd.rows[0].cantidad : 0;
        const delta = cantidad - cantidadActual;

        if (delta > 0 && prodResult.rows[0].cantidad < delta) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Stock insuficiente para ${nombre_producto}` });
        }

        if (cantidad <= 0) {
          await client.query(`DELETE FROM ticket_producto WHERE id_ticket = (SELECT id_ticket FROM ticket WHERE id_venta = $1) AND id_producto = $2`, [id_venta, id_producto]);
        } else if (ventaProd.rowCount > 0) {
          await client.query(`UPDATE ticket_producto SET cantidad = $1 WHERE id_producto = $2 AND id_ticket = (SELECT id_ticket FROM ticket WHERE id_venta = $3)`, [cantidad, id_producto, id_venta]);
        } else {
          await client.query(`INSERT INTO ticket_producto (id_ticket, id_producto, cantidad) VALUES ((SELECT id_ticket FROM ticket WHERE id_venta = $1), $2, $3)`, [id_venta, id_producto, cantidad]);
        }

        await client.query(`UPDATE producto SET cantidad = cantidad - $1 WHERE id_producto = $2`, [delta, id_producto]);
      }
    }

    await client.query('COMMIT');
    return res.json({ mensaje: 'Venta actualizada correctamente', id_venta });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(error);
    return res.status(500).json({ error: 'Error al actualizar venta', detalle: error.message });
  } finally {
    client.release();
  }
};

// Anulación parcial de productos
export const anularProductos = async (req, res) => {
  const { id_venta } = req.params;
  const { productos } = req.body;
  if (!productos || !Array.isArray(productos)) return res.status(400).json({ error: 'Debe enviar productos a anular' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const p of productos) {
      const { nombre_producto, cantidad } = p;
      const prodResult = await pool.query(`SELECT id_producto FROM producto WHERE nombre = $1`, [nombre_producto]);
      if (prodResult.rowCount === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: `Producto ${nombre_producto} no encontrado` }); }

      const id_producto = prodResult.rows[0].id_producto;
      const ticketProd = await client.query(`SELECT cantidad FROM ticket_producto WHERE id_producto = $1 AND id_ticket = (SELECT id_ticket FROM ticket WHERE id_venta = $2)`, [id_producto, id_venta]);
      if (ticketProd.rowCount === 0) continue;

      const cantidadActual = ticketProd.rows[0].cantidad;
      const nuevaCantidad = cantidadActual - cantidad;

      if (nuevaCantidad <= 0) {
        await client.query(`DELETE FROM ticket_producto WHERE id_producto = $1 AND id_ticket = (SELECT id_ticket FROM ticket WHERE id_venta = $2)`, [id_producto, id_venta]);
        await client.query(`UPDATE producto SET cantidad = cantidad + $1 WHERE id_producto = $2`, [cantidadActual, id_producto]);
      } else {
        await client.query(`UPDATE ticket_producto SET cantidad = $1 WHERE id_producto = $2 AND id_ticket = (SELECT id_ticket FROM ticket WHERE id_venta = $3)`, [nuevaCantidad, id_producto, id_venta]);
        await client.query(`UPDATE producto SET cantidad = cantidad + $1 WHERE id_producto = $2`, [cantidad, id_producto]);
      }
    }

    await client.query('COMMIT');
    return res.json({ mensaje: 'Productos anulados correctamente', id_venta });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(error);
    return res.status(500).json({ error: 'Error al anular productos', detalle: error.message });
  } finally {
    client.release();
  }
};

// Reporte de ventas
export const generarReporte = async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  if (!fecha_inicio || !fecha_fin) return res.status(400).json({ error: 'Debe enviar fecha_inicio y fecha_fin' });

  try {
    const totalResult = await pool.query(
      `SELECT SUM(p.precio * tp.cantidad) AS total_vendido
       FROM venta v
       JOIN ticket t ON v.id_venta = t.id_venta
       JOIN ticket_producto tp ON t.id_ticket = tp.id_ticket
       JOIN producto p ON tp.id_producto = p.id_producto
       WHERE v.fecha BETWEEN $1 AND $2`,
      [fecha_inicio, fecha_fin]
    );

    const productosResult = await pool.query(
      `SELECT p.nombre, SUM(tp.cantidad) AS total_cantidad
       FROM venta v
       JOIN ticket t ON v.id_venta = t.id_venta
       JOIN ticket_producto tp ON t.id_ticket = tp.id_ticket
       JOIN producto p ON tp.id_producto = p.id_producto
       WHERE v.fecha BETWEEN $1 AND $2
       GROUP BY p.nombre
       ORDER BY total_cantidad DESC`,
      [fecha_inicio, fecha_fin]
    );

    const tipoPagoResult = await pool.query(
      `SELECT tipo_pago, COUNT(*) AS total
       FROM venta
       WHERE fecha BETWEEN $1 AND $2
       GROUP BY tipo_pago
       ORDER BY total DESC`,
      [fecha_inicio, fecha_fin]
    );

    return res.json({
      total_vendido: totalResult.rows[0].total_vendido || 0,
      productos_mas_vendidos: productosResult.rows,
      tipo_pago_mas_usado: tipoPagoResult.rows
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al generar reporte', detalle: error.message });
  }
};

// Obtener todas las ventas con filtro opcional
export const obtenerVentas = async (req, res) => {
  const { nombre, codigo_venta } = req.query;

  try {
    let query = `
      SELECT v.id_venta, v.fecha, v.tipo_pago, t.id_ticket, t.codigo_venta
      FROM venta v
      JOIN ticket t ON v.id_venta = t.id_venta
      JOIN ticket_producto tp ON t.id_ticket = tp.id_ticket
      JOIN producto p ON tp.id_producto = p.id_producto
    `;
    const conditions = [];
    const params = [];

    if (nombre) {
      params.push(`%${nombre}%`);
      conditions.push(`p.nombre ILIKE $${params.length}`);
    }

    if (codigo_venta) {
      params.push(`%${codigo_venta}%`);
      conditions.push(`t.codigo_venta ILIKE $${params.length}`);
    }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');

    query += ' GROUP BY v.id_venta, t.id_ticket, t.codigo_venta ORDER BY v.fecha DESC';

    const result = await pool.query(query, params);

    const ventas = [];
    for (const venta of result.rows) {
      const productosResult = await pool.query(
        `SELECT p.nombre AS nombre_producto, tp.cantidad, p.precio
         FROM ticket_producto tp
         JOIN producto p ON tp.id_producto = p.id_producto
         WHERE tp.id_ticket = $1`,
        [venta.id_ticket]
      );
      ventas.push({ ...venta, productos: productosResult.rows });
    }

    return res.json(ventas);

  } catch (error) {
    console.error('obtenerVentas error:', error);
    return res.status(500).json({ error: 'Error inesperado al consultar las ventas', detalle: error.message });
  }
};
