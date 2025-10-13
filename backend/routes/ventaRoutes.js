// src/routes/ventaRoutes.js
import { Router } from 'express';
import { 
  crearVenta, 
  obtenerVenta, 
  deshacerVenta, 
  actualizarVenta, 
  anularProductos, 
  generarReporte,
  obtenerVentas
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
 *                     - nombre_producto
 *                     - cantidad
 *                   properties:
 *                     nombre_producto:
 *                       type: string
 *                     cantidad:
 *                       type: integer
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
 *         name: id_venta
 *         schema:
 *           type: integer
 *       - in: query
 *         name: codigo_venta
 *         schema:
 *           type: string
 */
router.get('/', obtenerVenta);

/**
 * @swagger
 * /ventas/{id_venta}:
 *   put:
 *     summary: "Actualizar productos o tipo de pago de una venta"
 *     tags: [Ventas]
 *     parameters:
 *       - in: path
 *         name: id_venta
 *         required: true
 *         schema:
 *           type: integer
 */
router.put('/:id_venta', actualizarVenta);

/**
 * @swagger
 * /ventas/{id_venta}:
 *   delete:
 *     summary: "Deshacer (anular) una venta y revertir el stock por ID de venta"
 *     tags: [Ventas]
 *     parameters:
 *       - in: path
 *         name: id_venta
 *         required: true
 *         schema:
 *           type: integer
 */
router.delete('/:id_venta', deshacerVenta);

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
router.delete('/deshacer/:codigo_venta', deshacerVenta);

/**
 * @swagger
 * /ventas/{id_venta}/productos:
 *   patch:
 *     summary: "Anular o ajustar cantidades de productos específicos en una venta"
 *     tags: [Ventas]
 *     parameters:
 *       - in: path
 *         name: id_venta
 *         required: true
 *         schema:
 *           type: integer
 */
router.patch('/:id_venta/productos', anularProductos);

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
