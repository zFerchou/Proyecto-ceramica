// src/routes/ventaRoutes.js
import { Router } from 'express';
import { 
  crearVenta, 
  obtenerVenta, 
  deshacerVenta, 
  actualizarVenta, 
  anularProductos, 
  generarReporte 
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
 *     responses:
 *       201:
 *         description: "Venta registrada exitosamente"
 *       400:
 *         description: "Error de validación en los datos de entrada"
 *       404:
 *         description: "Producto no encontrado"
 *       500:
 *         description: "Error inesperado"
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
 *     responses:
 *       200:
 *         description: "Venta encontrada"
 *       400:
 *         description: "No se proporcionó id_venta ni codigo_venta"
 *       404:
 *         description: "Venta no encontrada"
 *       500:
 *         description: "Error inesperado"
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
 *               productos:
 *                 type: array
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
 *         description: "Venta actualizada correctamente"
 *       400:
 *         description: "Error de validación"
 *       404:
 *         description: "Producto no encontrado"
 *       500:
 *         description: "Error inesperado"
 */
router.put('/:id_venta', actualizarVenta);

/**
 * @swagger
 * /ventas/{id_venta}:
 *   delete:
 *     summary: "Deshacer (anular) una venta y revertir el stock"
 *     tags: [Ventas]
 *     parameters:
 *       - in: path
 *         name: id_venta
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: "Venta deshecha correctamente"
 *       400:
 *         description: "ID de venta inválido"
 *       404:
 *         description: "Venta no encontrada"
 *       500:
 *         description: "Error inesperado"
 */
router.delete('/:id_venta', deshacerVenta);

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productos:
 *                 type: array
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
 *         description: "Productos anulados correctamente"
 *       400:
 *         description: "Error de validación"
 *       404:
 *         description: "Producto no encontrado"
 *       500:
 *         description: "Error inesperado"
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
 *     responses:
 *       200:
 *         description: "Reporte generado exitosamente"
 *       400:
 *         description: "Fechas no proporcionadas"
 *       500:
 *         description: "Error inesperado"
 */
router.get('/reporte', generarReporte);

export default router;
