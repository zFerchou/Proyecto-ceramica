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
  obtenerVentaPorCodigo,
  obtenerMisEstadisticas  // NUEVO
} from '../controllers/ventaController.js';
import { verifyJWT } from '../middlewares/authMiddleware.js';

const router = Router();

// Aplicar autenticación a TODAS las rutas de ventas
router.use(verifyJWT);

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
 *     security:
 *       - bearerAuth: []
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
 *                 id_usuario:
 *                   type: integer
 *                 total_venta:
 *                   type: number
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
 *                       subtotal:
 *                         type: number
 */
router.post('/', crearVenta);

/**
 * @swagger
 * /ventas/mis-estadisticas:
 *   get:
 *     summary: "Obtener estadísticas personales de ventas"
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hoy:
 *                   type: object
 *                   properties:
 *                     ventas:
 *                       type: integer
 *                     total:
 *                       type: number
 *                 mes:
 *                   type: object
 *                   properties:
 *                     ventas:
 *                       type: integer
 *                     total:
 *                       type: number
 *                 general:
 *                   type: object
 *                   properties:
 *                     ventas:
 *                       type: integer
 *                     total:
 *                       type: number
 */
router.get('/mis-estadisticas', obtenerMisEstadisticas);

/**
 * @swagger
 * /ventas/all:
 *   get:
 *     summary: "Obtener todas las ventas (filtrado por rol)"
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         description: "Filtrar por nombre de producto"
 *       - in: query
 *         name: codigo_venta
 *         schema:
 *           type: string
 *         description: "Filtrar por código de venta"
 *     responses:
 *       200:
 *         description: Lista de ventas obtenida exitosamente
 *       403:
 *         description: No autorizado
 */
router.get('/all', obtenerVentas);

/**
 * @swagger
 * /ventas/codigo/{codigo_venta}:
 *   get:
 *     summary: "Obtener información de una venta por codigo_venta"
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codigo_venta
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venta encontrada
 *       403:
 *         description: No tienes permiso para ver esta venta
 *       404:
 *         description: Venta no encontrada
 */
router.get('/codigo/:codigo_venta', obtenerVentaPorCodigo);

// Mantener consulta por query para compatibilidad
router.get('/', obtenerVenta);

/**
 * @swagger
 * /ventas/codigo/{codigo_venta}:
 *   put:
 *     summary: "Actualizar productos o tipo de pago de una venta por codigo_venta"
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
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
 *                 description: "Lista de productos a actualizar"
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
 *       403:
 *         description: No tienes permiso para actualizar esta venta
 */
router.put('/codigo/:codigo_venta', actualizarVentaPorCodigo);

/**
 * @swagger
 * /ventas/deshacer/{codigo_venta}:
 *   delete:
 *     summary: "Deshacer (anular) una venta y revertir stock usando código de venta"
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codigo_venta
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venta deshecha correctamente
 *       403:
 *         description: No tienes permiso para deshacer esta venta
 */
router.delete('/deshacer/:codigo_venta', deshacerVenta);

/**
 * @swagger
 * /ventas/codigo/{codigo_venta}/productos:
 *   patch:
 *     summary: "Anular o ajustar cantidades de productos específicos en una venta"
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
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
 *                 description: "Productos a anular o ajustar"
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
 *       403:
 *         description: No tienes permiso para anular productos de esta venta
 */
router.patch('/codigo/:codigo_venta/productos', anularProductosPorCodigo);

/**
 * @swagger
 * /ventas/reporte:
 *   get:
 *     summary: "Generar reporte de ventas (filtrado por rol)"
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
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
 *         description: Reporte generado exitosamente
 */
router.get('/reporte', generarReporte);

export default router;