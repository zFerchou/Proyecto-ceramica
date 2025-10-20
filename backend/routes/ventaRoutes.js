// src/routes/ventaRoutes.js
import { Router } from 'express';
import { 
  crearVenta, 
  obtenerVenta, 
  deshacerVenta, 
  actualizarVentaPorCodigo, 
  anularProductosPorCodigo, 
  generarReporte,
  obtenerVentas,
  obtenerVentaPorCodigo
} from '../controllers/ventaController.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Ventas
 *   description: "Endpoints para gestionar ventas y tickets"
 */

/**
 * @swagger
 * /ventas:
 *   post:
 *     summary: "Crear una venta con productos y generar un ticket"
 *     tags: [Ventas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productos
 *               - tipo_pago
 *             properties:
 *               tipo_pago:
 *                 type: string
 *                 enum: [Efectivo, Transacción]
 *                 description: "Tipo de pago permitido: Efectivo o Transacción"
 *               productos:
 *                 type: array
 *                 description: "Lista de productos a vender"
 *                 items:
 *                   type: object
 *                   required:
 *                     - codigo_barras
 *                     - cantidad
 *                   properties:
 *                     codigo_barras:
 *                       type: string
 *                     cantidad:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Venta registrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 id_venta:
 *                   type: integer
 *                 id_ticket:
 *                   type: integer
 *                 codigo_venta:
 *                   type: string
 *                 fecha:
 *                   type: string
 *                 productos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       nombre_producto:
 *                         type: string
 *                       cantidad:
 *                         type: integer
 *                       precio:
 *                         type: number
 *       400:
 *         description: Solicitud inválida (tipo_pago o productos)
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error inesperado al registrar la venta
 */
router.post('/', crearVenta);

/**
 * @swagger
 * /ventas:
 *   get:
 *     summary: "Obtener información de una venta"
 *     tags: [Ventas]
 *     parameters:
 *       - in: query
 *         name: codigo_venta
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venta encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_venta:
 *                   type: integer
 *                 fecha:
 *                   type: string
 *                 tipo_pago:
 *                   type: string
 *                 id_ticket:
 *                   type: integer
 *                 codigo_venta:
 *                   type: string
 *                 productos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       nombre_producto:
 *                         type: string
 *                       cantidad:
 *                         type: integer
 *                       precio:
 *                         type: number
 *       400:
 *         description: Debe enviar codigo_venta
 *       404:
 *         description: Venta no encontrada
 *       500:
 *         description: Error inesperado al consultar la venta
 */
// Nuevo: obtener por codigo_venta vía path
/**
 * @swagger
 * /ventas/codigo/{codigo_venta}:
 *   get:
 *     summary: "Obtener información de una venta por codigo_venta"
 *     tags: [Ventas]
 *     parameters:
 *       - in: path
 *         name: codigo_venta
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venta encontrada
 *       404:
 *         description: Venta no encontrada
 */
router.get('/codigo/:codigo_venta', obtenerVentaPorCodigo);

// Mantener consulta por query temporalmente (compatibilidad)
router.get('/', obtenerVenta);

/**
 * @swagger
 * /ventas/codigo/{codigo_venta}:
 *   put:
 *     summary: "Actualizar productos o tipo de pago de una venta por codigo_venta"
 *     tags: [Ventas]
 *     parameters:
 *       - in: path
 *         name: codigo_venta
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo_pago:
 *                 type: string
 *                 enum: [Efectivo, Transacción]
 *                 description: "Nuevo tipo de pago para la venta"
 *               productos:
 *                 type: array
 *                 description: "Lista de productos a actualizar (por nombre) con sus cantidades finales"
 *                 items:
 *                   type: object
 *                   required:
 *                     - nombre_producto
 *                     - cantidad
 *                   properties:
 *                     nombre_producto:
 *                       type: string
 *                     cantidad:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Venta actualizada correctamente
 *       400:
 *         description: Solicitud inválida (tipo_pago o productos)
 *       404:
 *         description: Venta o producto no encontrado
 *       500:
 *         description: Error al actualizar venta
 */
router.put('/codigo/:codigo_venta', actualizarVentaPorCodigo);

// Anulación completa por codigo_venta
router.delete('/deshacer/:codigo_venta', deshacerVenta);

/**
 * @swagger
 * /ventas/deshacer/{codigo_venta}:
 *   delete:
 *     summary: "Deshacer (anular) una venta y revertir stock usando código de venta"
 *     tags: [Ventas]
 *     parameters:
 *       - in: path
 *         name: codigo_venta
 *         required: true
 *         schema:
 *           type: string
 *           description: "Código único de la venta generado al crear la venta"
 *     responses:
 *       200:
 *         description: Venta eliminada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 codigo_venta:
 *                   type: string
 *       404:
 *         description: Venta no encontrada
 *       500:
 *         description: Error al procesar la solicitud
 */
// (ruta ya definida arriba)

/**
 * @swagger
 * /ventas/codigo/{codigo_venta}/productos:
 *   patch:
 *     summary: "Anular o ajustar cantidades de productos específicos en una venta por codigo_venta"
 *     tags: [Ventas]
 *     parameters:
 *       - in: path
 *         name: codigo_venta
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productos
 *             properties:
 *               productos:
 *                 type: array
 *                 description: "Productos a anular o ajustar (por nombre) con la cantidad a restar"
 *                 items:
 *                   type: object
 *                   required:
 *                     - nombre_producto
 *                     - cantidad
 *                   properties:
 *                     nombre_producto:
 *                       type: string
 *                     cantidad:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Productos anulados correctamente
 *       400:
 *         description: Solicitud inválida
 *       404:
 *         description: Venta o producto no encontrado
 *       500:
 *         description: Error al anular productos
 */
router.patch('/codigo/:codigo_venta/productos', anularProductosPorCodigo);

/**
 * @swagger
 * /ventas/reporte:
 *   get:
 *     summary: "Generar reporte de ventas"
 *     tags: [Ventas]
 *     parameters:
 *       - in: query
 *         name: fecha_inicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fecha_fin
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Reporte generado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_vendido:
 *                   type: number
 *                 productos_mas_vendidos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       nombre:
 *                         type: string
 *                       total_cantidad:
 *                         type: integer
 *                 tipo_pago_mas_usado:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tipo_pago:
 *                         type: string
 *                       total:
 *                         type: integer
 *       400:
 *         description: Faltan fechas
 *       500:
 *         description: Error al generar reporte
 */
router.get('/reporte', generarReporte);

/**
 * @swagger
 * /ventas/all:
 *   get:
 *     summary: "Obtener todas las ventas con opción de filtrar por nombre de producto o código de venta"
 *     tags: [Ventas]
 *     parameters:
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *       - in: query
 *         name: codigo_venta
 *         schema:
 *           type: string
 */
router.get('/all', obtenerVentas);

export default router;
