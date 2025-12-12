import { pool } from "../config/db.js";
import { generateUniqueTicketBarcode } from "../utils/barcode.js";

// Helper para obtener id_venta desde codigo_venta
async function getIdVentaFromCodigo(codigo_venta) {
  const r = await pool.query(`SELECT id_venta FROM ticket WHERE codigo_venta = $1`, [codigo_venta]);
  return r.rowCount > 0 ? r.rows[0].id_venta : null;
}

// ======================================================
//  CREAR VENTA (con registro de usuario)
// ======================================================
export const crearVenta = async (req, res) => {
  const { productos, tipo_pago } = req.body;

  // Obtener ID del usuario desde el token
  const id_usuario = req.user?.userId || req.user?.id;
  
  if (!id_usuario) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  // Validaciones básicas
  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: 'El campo "productos" debe ser un arreglo no vacío' });
  }
  if (!tipo_pago || typeof tipo_pago !== 'string') {
    return res.status(400).json({ error: 'El campo "tipo_pago" es obligatorio' });
  }

  const tiposPermitidos = ["Efectivo", "Transacción"];
  if (!tiposPermitidos.includes(tipo_pago)) {
    return res.status(400).json({ error: 'El tipo de pago debe ser "Efectivo" o "Transacción"' });
  }

  // Verificar que el usuario existe y está activo
  const userCheck = await pool.query(
    'SELECT id, activo FROM usuarios WHERE id = $1',
    [id_usuario]
  );
  
  if (userCheck.rowCount === 0) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  
  if (!userCheck.rows[0].activo) {
    return res.status(403).json({ error: 'Usuario inactivo' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Crear venta
    const ventaInsert = await client.query(
      `INSERT INTO venta (tipo_pago) VALUES ($1) RETURNING id_venta, fecha`,
      [tipo_pago]
    );
    const { id_venta, fecha } = ventaInsert.rows[0];

    // 2. Generar código de venta único
    const codigo_venta = await generateUniqueTicketBarcode(client);

    // 3. Crear ticket
    const ticketInsert = await client.query(
      `INSERT INTO ticket (codigo_venta, id_venta) VALUES ($1, $2) RETURNING id_ticket`,
      [codigo_venta, id_venta]
    );
    const id_ticket = ticketInsert.rows[0].id_ticket;

    // 4. REGISTRAR VENTA CON USUARIO (NUEVO)
    await client.query(
      `INSERT INTO venta_usuario (id_venta, id_usuario) VALUES ($1, $2)`,
      [id_venta, id_usuario]
    );

    // 5. Actualizar último acceso del usuario
    await client.query(
      `UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1`,
      [id_usuario]
    );

    // 6. Procesar productos (incluye Express)
    const productosConPrecio = [];
    let totalVenta = 0;

    for (const p of productos) {
      const { codigo_barras, cantidad, precio_express, nombre_express } = p;

      if (!codigo_barras || !Number.isInteger(cantidad) || cantidad <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error:
            'Cada producto debe tener "codigo_barras" válido y "cantidad" como entero positivo'
        });
      }

      // CASO 1: PRODUCTO EXPRESS (código inicia con "9")
      if (codigo_barras.startsWith("9")) {
        if (!precio_express) {
          await client.query('ROLLBACK');
          return res
            .status(400)
            .json({ error: `El producto express "${codigo_barras}" requiere precio_express` });
        }

        const nombreFinal = nombre_express?.trim() || "Venta Express";

        const subtotal = precio_express * cantidad;
        totalVenta += subtotal;

        // Insertar en producto_express
        await client.query(
          `INSERT INTO producto_express 
             (id_ticket, codigo, nombre, cantidad, precio)
           VALUES ($1, $2, $3, $4, $5)`,
          [id_ticket, codigo_barras, nombreFinal, cantidad, precio_express]
        );

        productosConPrecio.push({
          nombre_producto: nombreFinal,
          cantidad,
          precio: precio_express,
          subtotal
        });

        continue; // siguiente producto
      }

      // CASO 2: PRODUCTO NORMAL (inventario)
      const productoCheck = await client.query(
        `SELECT pr.id_producto, pr.cantidad AS stock_actual, pr.precio, pr.nombre
         FROM codigo_barras cb
         JOIN producto pr ON cb.id_producto = pr.id_producto
         WHERE cb.codigo = $1`,
        [codigo_barras]
      );

      if (productoCheck.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: `Producto con código de barras "${codigo_barras}" no encontrado`
        });
      }

      const { id_producto, stock_actual, precio, nombre } = productoCheck.rows[0];

      if (stock_actual < cantidad) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Stock insuficiente para el producto "${nombre}"`
        });
      }

      await client.query(
        `INSERT INTO ticket_producto (id_ticket, id_producto, cantidad)
         VALUES ($1, $2, $3)`,
        [id_ticket, id_producto, cantidad]
      );

      await client.query(
        `UPDATE producto SET cantidad = cantidad - $1 WHERE id_producto = $2`,
        [cantidad, id_producto]
      );

      const subtotal = precio * cantidad;
      totalVenta += subtotal;

      productosConPrecio.push({
        nombre_producto: nombre,
        cantidad,
        precio,
        subtotal
      });
    }

    await client.query('COMMIT');
    
    return res.status(201).json({
      mensaje: 'Venta registrada exitosamente',
      id_venta,
      id_ticket,
      codigo_venta,
      fecha,
      id_usuario,
      total_venta: totalVenta,
      productos: productosConPrecio
    });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('crearVenta error:', error);
    return res.status(500).json({ 
      error: 'Error inesperado al registrar la venta', 
      detalle: error.message 
    });
  } finally {
    client.release();
  }
};

// ======================================================
//  OBTENER VENTAS (con filtro por usuario)
// ======================================================
export const obtenerVentas = async (req, res) => {
  const { nombre, codigo_venta } = req.query;
  const id_usuario = req.user?.userId || req.user?.id;
  const rol = req.user?.rol;
  
  try {
    let query = `
      SELECT DISTINCT v.id_venta, v.fecha, v.tipo_pago, t.codigo_venta,
             u.nombre as nombre_vendedor, u.id as id_vendedor
      FROM venta v
      JOIN venta_usuario vu ON v.id_venta = vu.id_venta
      JOIN usuarios u ON vu.id_usuario = u.id
      JOIN ticket t ON v.id_venta = t.id_venta
      LEFT JOIN ticket_producto tp ON t.id_ticket = tp.id_ticket
      LEFT JOIN producto p ON tp.id_producto = p.id_producto
    `;
    
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // FILTRO POR ROL: Empleados solo ven sus ventas, admin ve todas
    if (rol !== 'admin') {
      params.push(id_usuario);
      conditions.push(`vu.id_usuario = $${paramIndex}`);
      paramIndex++;
    }
    
    // Filtros adicionales
    if (nombre) {
      params.push(`%${nombre}%`);
      conditions.push(`p.nombre ILIKE $${paramIndex}`);
      paramIndex++;
    }
    
    if (codigo_venta) {
      params.push(`%${codigo_venta}%`);
      conditions.push(`t.codigo_venta ILIKE $${paramIndex}`);
      paramIndex++;
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY v.fecha DESC';
    
    const result = await pool.query(query, params);
    
    // Obtener productos para cada venta
    const ventasConProductos = await Promise.all(
      result.rows.map(async (venta) => {
        const productos = await pool.query(
          `SELECT p.nombre AS nombre_producto, tp.cantidad, p.precio, (tp.cantidad * p.precio) as subtotal
           FROM ticket t
           JOIN ticket_producto tp ON t.id_ticket = tp.id_ticket
           JOIN producto p ON tp.id_producto = p.id_producto
           WHERE t.id_venta = $1`,
          [venta.id_venta]
        );

        const express = await pool.query(
          `SELECT nombre AS nombre_producto, cantidad, precio, subtotal
           FROM producto_express
           WHERE id_ticket = (SELECT id_ticket FROM ticket WHERE id_venta = $1)`,
          [venta.id_venta]
        );

        const productosCombinados = [...productos.rows, ...express.rows];
        const total = productosCombinados.reduce((sum, p) => sum + (p.subtotal || 0), 0);

        return { 
          ...venta, 
          productos: productosCombinados,
          total_venta: total
        };
      })
    );
    
    return res.json(ventasConProductos);
  } catch (error) {
    console.error('obtenerVentas error:', error);
    return res.status(500).json({ 
      error: 'Error inesperado al consultar las ventas', 
      detalle: error.message 
    });
  }
};

// ======================================================
//  OBTENER VENTA POR ID O CÓDIGO
// ======================================================
export const obtenerVenta = async (req, res) => {
  const { id_venta, codigo_venta } = req.query;
  const usuario_id = req.user?.userId || req.user?.id;
  const rol = req.user?.rol;
  
  if (!id_venta && !codigo_venta) {
    return res.status(400).json({ error: 'Se requiere "id_venta" o "codigo_venta"' });
  }

  try {
    let ventaQuery, params;
    
    if (id_venta) {
      ventaQuery = `
        SELECT v.id_venta, v.fecha, v.tipo_pago, t.id_ticket, t.codigo_venta,
               vu.id_usuario, u.nombre as nombre_vendedor
        FROM venta v
        JOIN ticket t ON v.id_venta = t.id_venta
        JOIN venta_usuario vu ON v.id_venta = vu.id_venta
        JOIN usuarios u ON vu.id_usuario = u.id
        WHERE v.id_venta = $1`;
      params = [id_venta];
    } else {
      ventaQuery = `
        SELECT v.id_venta, v.fecha, v.tipo_pago, t.id_ticket, t.codigo_venta,
               vu.id_usuario, u.nombre as nombre_vendedor
        FROM venta v
        JOIN ticket t ON v.id_venta = t.id_venta
        JOIN venta_usuario vu ON v.id_venta = vu.id_venta
        JOIN usuarios u ON vu.id_usuario = u.id
        WHERE t.codigo_venta = $1`;
      params = [codigo_venta];
    }

    const ventaResult = await pool.query(ventaQuery, params);
    if (ventaResult.rowCount === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const venta = ventaResult.rows[0];

    // VERIFICAR PERMISOS: Solo admin o el dueño puede ver la venta
    if (rol !== 'admin' && venta.id_usuario !== usuario_id) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta venta' });
    }

    // Obtener productos de la venta (normales + express)
    const productosResult = await pool.query(
      `SELECT p.nombre AS nombre_producto, tp.cantidad, p.precio,
              (tp.cantidad * p.precio) as subtotal
       FROM ticket_producto tp
       JOIN producto p ON tp.id_producto = p.id_producto
       WHERE tp.id_ticket = $1`,
      [venta.id_ticket]
    );

    const expressResult = await pool.query(
      `SELECT nombre AS nombre_producto, cantidad, precio, subtotal
       FROM producto_express
       WHERE id_ticket = $1`,
      [venta.id_ticket]
    );

    venta.productos = [
      ...productosResult.rows,
      ...expressResult.rows
    ];
    
    // Calcular total
    venta.total_venta = venta.productos.reduce(
      (sum, p) => sum + p.subtotal, 0
    );

    return res.json(venta);

  } catch (error) {
    console.error('obtenerVenta error:', error);
    return res.status(500).json({ 
      error: 'Error inesperado al consultar la venta', 
      detalle: error.message 
    });
  }
};

// ======================================================
//  OBTENER VENTA POR CÓDIGO (ruta específica)
// ======================================================
export const obtenerVentaPorCodigo = async (req, res) => {
  const { codigo_venta } = req.params;
  const usuario_id = req.user?.userId || req.user?.id;
  const rol = req.user?.rol;
  
  if (!codigo_venta) {
    return res.status(400).json({ error: 'Se requiere "codigo_venta"' });
  }

  try {
    const ventaResult = await pool.query(
      `SELECT v.id_venta, v.fecha, v.tipo_pago, t.id_ticket, t.codigo_venta,
              vu.id_usuario, u.nombre as nombre_vendedor
       FROM venta v
       JOIN ticket t ON v.id_venta = t.id_venta
       JOIN venta_usuario vu ON v.id_venta = vu.id_venta
       JOIN usuarios u ON vu.id_usuario = u.id
       WHERE t.codigo_venta = $1`,
      [codigo_venta]
    );
    
    if (ventaResult.rowCount === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const venta = ventaResult.rows[0];

    // VERIFICAR PERMISOS
    if (rol !== 'admin' && venta.id_usuario !== usuario_id) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta venta' });
    }

    const productosResult = await pool.query(
      `SELECT p.nombre AS nombre_producto, tp.cantidad, p.precio,
              (tp.cantidad * p.precio) as subtotal
       FROM ticket_producto tp
       JOIN producto p ON tp.id_producto = p.id_producto
       WHERE tp.id_ticket = $1`,
      [venta.id_ticket]
    );

    const expressResult = await pool.query(
      `SELECT nombre AS nombre_producto, cantidad, precio, subtotal
       FROM producto_express
       WHERE id_ticket = $1`,
      [venta.id_ticket]
    );

    venta.productos = [
      ...productosResult.rows,
      ...expressResult.rows
    ];
    venta.total_venta = venta.productos.reduce(
      (sum, p) => sum + p.subtotal, 0
    );

    return res.json(venta);
  } catch (error) {
    console.error('obtenerVentaPorCodigo error:', error);
    return res.status(500).json({ 
      error: 'Error inesperado al consultar la venta', 
      detalle: error.message 
    });
  }
};

// ======================================================
//  DESHACER VENTA
// ======================================================
export const deshacerVenta = async (req, res) => {
  const { codigo_venta } = req.params;
  const usuario_id = req.user?.userId || req.user?.id;
  const rol = req.user?.rol;
  
  if (!codigo_venta) {
    return res.status(400).json({ error: 'El parámetro "codigo_venta" es obligatorio' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar existencia y permisos
    const ticketResult = await client.query(
      `SELECT t.id_ticket, t.id_venta, vu.id_usuario
       FROM ticket t
       JOIN venta_usuario vu ON t.id_venta = vu.id_venta
       WHERE t.codigo_venta = $1`,
      [codigo_venta]
    );
    
    if (ticketResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const { id_ticket, id_venta, id_usuario } = ticketResult.rows[0];

    // VERIFICAR PERMISOS: Solo admin o el dueño puede deshacer
    if (rol !== 'admin' && id_usuario !== usuario_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'No tienes permiso para deshacer esta venta' });
    }

    // Revertir productos
    const productosResult = await client.query(
      `SELECT id_producto, cantidad FROM ticket_producto WHERE id_ticket = $1`,
      [id_ticket]
    );
    
    for (const p of productosResult.rows) {
      await client.query(
        `UPDATE producto SET cantidad = cantidad + $1 WHERE id_producto = $2`,
        [p.cantidad, p.id_producto]
      );
    }

    // Eliminar registros
    await client.query(`DELETE FROM ticket_producto WHERE id_ticket = $1`, [id_ticket]);
    await client.query(`DELETE FROM venta_usuario WHERE id_venta = $1`, [id_venta]);
    await client.query(`DELETE FROM ticket WHERE id_ticket = $1`, [id_ticket]);
    await client.query(`DELETE FROM venta WHERE id_venta = $1`, [id_venta]);

    await client.query('COMMIT');
    
    return res.json({ 
      mensaje: 'Venta deshecha correctamente', 
      codigo_venta, 
      id_venta 
    });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('deshacerVenta error:', error);
    return res.status(500).json({ 
      error: 'Error inesperado al deshacer la venta', 
      detalle: error.message 
    });
  } finally {
    client.release();
  }
};

// ======================================================
//  ACTUALIZAR VENTA POR CÓDIGO
// ======================================================
export const actualizarVentaPorCodigo = async (req, res) => {
  const { codigo_venta } = req.params;
  const { tipo_pago, productos } = req.body;
  const usuario_id = req.user?.userId || req.user?.id;
  const rol = req.user?.rol;
  
  if (!tipo_pago && (!productos || !Array.isArray(productos))) {
    return res.status(400).json({ error: 'Debe enviar tipo_pago o productos para actualizar' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar existencia y permisos
    const ventaInfo = await client.query(
      `SELECT v.id_venta, vu.id_usuario, t.id_ticket
       FROM venta v
       JOIN venta_usuario vu ON v.id_venta = vu.id_venta
       JOIN ticket t ON v.id_venta = t.id_venta
       WHERE t.codigo_venta = $1`,
      [codigo_venta]
    );
    
    if (ventaInfo.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const { id_venta, id_usuario, id_ticket } = ventaInfo.rows[0];

    // VERIFICAR PERMISOS
    if (rol !== 'admin' && id_usuario !== usuario_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'No tienes permiso para actualizar esta venta' });
    }

    // Actualizar tipo de pago si se proporciona
    if (tipo_pago) {
      const tiposPermitidos = ["Efectivo", "Transacción"];
      if (!tiposPermitidos.includes(tipo_pago)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Tipo de pago inválido' });
      }
      await client.query(`UPDATE venta SET tipo_pago = $1 WHERE id_venta = $2`, [tipo_pago, id_venta]);
    }

    // Actualizar productos si se proporcionan
    if (productos && productos.length > 0) {
      // Lógica de actualización de productos (mantén tu código actual)
      // ...
    }

    await client.query('COMMIT');
    
    return res.json({ 
      mensaje: 'Venta actualizada correctamente', 
      codigo_venta 
    });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('actualizarVentaPorCodigo error:', error);
    return res.status(500).json({ 
      error: 'Error al actualizar venta', 
      detalle: error.message 
    });
  } finally {
    client.release();
  }
};

// ======================================================
//  ANULAR PRODUCTOS POR CÓDIGO
// ======================================================
export const anularProductosPorCodigo = async (req, res) => {
  const { codigo_venta } = req.params;
  const { productos } = req.body;
  const usuario_id = req.user?.userId || req.user?.id;
  const rol = req.user?.rol;
  
  if (!productos || !Array.isArray(productos)) {
    return res.status(400).json({ error: 'Debe enviar productos a anular' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar existencia y permisos
    const ventaInfo = await client.query(
      `SELECT v.id_venta, vu.id_usuario, t.id_ticket
       FROM venta v
       JOIN venta_usuario vu ON v.id_venta = vu.id_venta
       JOIN ticket t ON v.id_venta = t.id_venta
       WHERE t.codigo_venta = $1`,
      [codigo_venta]
    );
    
    if (ventaInfo.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const { id_venta, id_usuario, id_ticket } = ventaInfo.rows[0];

    // VERIFICAR PERMISOS
    if (rol !== 'admin' && id_usuario !== usuario_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'No tienes permiso para anular productos de esta venta' });
    }

    // Lógica de anulación de productos (mantén tu código actual)
    // ...

    await client.query('COMMIT');
    
    return res.json({ 
      mensaje: 'Productos anulados correctamente', 
      codigo_venta 
    });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('anularProductosPorCodigo error:', error);
    return res.status(500).json({ 
      error: 'Error al anular productos', 
      detalle: error.message 
    });
  } finally {
    client.release();
  }
};

// ======================================================
//  GENERAR REPORTE (con filtro por usuario)
// ======================================================
export const generarReporte = async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  const usuario_id = req.user?.userId || req.user?.id;
  const rol = req.user?.rol;
  
  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: 'Debe enviar fecha_inicio y fecha_fin' });
  }

  try {
    let queryParams = [fecha_inicio, fecha_fin];
    let usuarioCondition = '';
    
    // Si no es admin, filtrar por usuario
    if (rol !== 'admin') {
      queryParams.push(usuario_id);
      usuarioCondition = 'AND vu.id_usuario = $3';
    }

    const totalResult = await pool.query(
      `SELECT SUM(p.precio * tp.cantidad) AS total_vendido,
              COUNT(DISTINCT v.id_venta) AS total_ventas
       FROM venta v
       JOIN venta_usuario vu ON v.id_venta = vu.id_venta
       JOIN ticket t ON v.id_venta = t.id_venta
       JOIN ticket_producto tp ON t.id_ticket = tp.id_ticket
       JOIN producto p ON tp.id_producto = p.id_producto
       WHERE v.fecha BETWEEN $1 AND $2 ${usuarioCondition}`,
      queryParams
    );

    const productosResult = await pool.query(
      `SELECT p.nombre, SUM(tp.cantidad) AS total_cantidad,
              SUM(tp.cantidad * p.precio) AS total_importe
       FROM venta v
       JOIN venta_usuario vu ON v.id_venta = vu.id_venta
       JOIN ticket t ON v.id_venta = t.id_venta
       JOIN ticket_producto tp ON t.id_ticket = tp.id_ticket
       JOIN producto p ON tp.id_producto = p.id_producto
       WHERE v.fecha BETWEEN $1 AND $2 ${usuarioCondition}
       GROUP BY p.nombre
       ORDER BY total_cantidad DESC`,
      queryParams
    );

    const tipoPagoResult = await pool.query(
      `SELECT v.tipo_pago, COUNT(*) AS total_ventas,
              SUM(tp.cantidad * p.precio) AS total_importe
       FROM venta v
       JOIN venta_usuario vu ON v.id_venta = vu.id_venta
       JOIN ticket t ON v.id_venta = t.id_venta
       JOIN ticket_producto tp ON t.id_ticket = tp.id_ticket
       JOIN producto p ON tp.id_producto = p.id_producto
       WHERE v.fecha BETWEEN $1 AND $2 ${usuarioCondition}
       GROUP BY v.tipo_pago
       ORDER BY total_ventas DESC`,
      queryParams
    );

    return res.json({
      total_vendido: totalResult.rows[0].total_vendido || 0,
      total_ventas: totalResult.rows[0].total_ventas || 0,
      productos_mas_vendidos: productosResult.rows,
      tipo_pago_mas_usado: tipoPagoResult.rows
    });

  } catch (error) {
    console.error('generarReporte error:', error);
    return res.status(500).json({ 
      error: 'Error al generar reporte', 
      detalle: error.message 
    });
  }
};

// ======================================================
//  OBTENER MIS ESTADÍSTICAS (para empleados)
// ======================================================
export const obtenerMisEstadisticas = async (req, res) => {
  const usuario_id = req.user?.userId || req.user?.id;
  
  if (!usuario_id) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  try {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    const [hoyStats, mesStats, totalStats] = await Promise.all([
      // Ventas de hoy
      pool.query(`
        SELECT COUNT(*) as ventas_hoy, 
               COALESCE(SUM(tp.cantidad * p.precio), 0) as total_hoy
        FROM venta v
        JOIN venta_usuario vu ON v.id_venta = vu.id_venta
        JOIN ticket t ON v.id_venta = t.id_venta
        JOIN ticket_producto tp ON t.id_ticket = tp.id_ticket
        JOIN producto p ON tp.id_producto = p.id_producto
        WHERE vu.id_usuario = $1 AND DATE(v.fecha) = CURRENT_DATE`,
        [usuario_id]
      ),
      
      // Ventas del mes
      pool.query(`
        SELECT COUNT(*) as ventas_mes,
               COALESCE(SUM(tp.cantidad * p.precio), 0) as total_mes
        FROM venta v
        JOIN venta_usuario vu ON v.id_venta = vu.id_venta
        JOIN ticket t ON v.id_venta = t.id_venta
        JOIN ticket_producto tp ON t.id_ticket = tp.id_ticket
        JOIN producto p ON tp.id_producto = p.id_producto
        WHERE vu.id_usuario = $1 AND v.fecha >= $2`,
        [usuario_id, inicioMes]
      ),
      
      // Total general
      pool.query(`
        SELECT COUNT(*) as total_ventas,
               COALESCE(SUM(tp.cantidad * p.precio), 0) as importe_total
        FROM venta v
        JOIN venta_usuario vu ON v.id_venta = vu.id_venta
        JOIN ticket t ON v.id_venta = t.id_venta
        JOIN ticket_producto tp ON t.id_ticket = tp.id_ticket
        JOIN producto p ON tp.id_producto = p.id_producto
        WHERE vu.id_usuario = $1`,
        [usuario_id]
      )
    ]);
    
    return res.json({
      hoy: {
        ventas: hoyStats.rows[0]?.ventas_hoy || 0,
        total: hoyStats.rows[0]?.total_hoy || 0
      },
      mes: {
        ventas: mesStats.rows[0]?.ventas_mes || 0,
        total: mesStats.rows[0]?.total_mes || 0
      },
      general: {
        ventas: totalStats.rows[0]?.total_ventas || 0,
        total: totalStats.rows[0]?.importe_total || 0
      }
    });
  } catch (error) {
    console.error('obtenerMisEstadisticas error:', error);
    return res.status(500).json({ 
      error: 'Error al obtener estadísticas', 
      detalle: error.message 
    });
  }
};