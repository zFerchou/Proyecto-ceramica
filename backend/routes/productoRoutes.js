// src/routes/productoRoutes.js
import express from "express";
import { crearProducto, actualizarStock, eliminarProducto, actualizarDetalles } from "../controllers/productoController.js";
import { actualizarStockPorCodigo } from "../controllers/productoController.js";

const router = express.Router();

/**
 * @swagger
 * /api/productos:
 *   post:
 *     summary: Registrar un nuevo producto
 *     tags: [Productos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               cantidad:
 *                 type: integer
 *               precio:
 *                 type: number
 *               id_categoria:
 *                 type: integer
 *           examples:
 *             productoEjemplo:
 *               summary: Ejemplo correcto (asegúrate de copiar como JSON)
 *               value:
 *                 nombre: "Taza"
 *                 descripcion: "Taza de cerámica blanca"
 *                 cantidad: 10
 *                 precio: 5.5
 *                 id_categoria: 1
 *     responses:
 *       201:
 *         description: Producto creado correctamente.
 *       400:
 *         description: Bad Request - Si se envía JSON inválido (por ejemplo valores string sin comillas) el servidor registrará un error en la consola indicando un JSON parse error y devolverá 400.
 */
router.post("/", crearProducto);

/**
 * @swagger
 * /api/productos/{id_producto}:
 *   delete:
 *     summary: Eliminar un producto por ID
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id_producto
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto a eliminar
 *     responses:
 *       200:
 *         description: Producto eliminado correctamente.
 *       404:
 *         description: Producto no encontrado.
 */
router.delete("/:id_producto", eliminarProducto);

/**
 * @swagger
 * /api/productos/{id_producto}:
 *   patch:
 *     summary: Actualizar detalles de un producto (nombre, descripcion, precio, id_categoria)
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id_producto
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               precio:
 *                 type: number
 *               id_categoria:
 *                 type: integer
 *           examples:
 *             actualizarEjemplo:
 *               summary: Cambiar nombre y precio
 *               value:
 *                 nombre: "Taza nueva"
 *                 precio: 6.5
 *     responses:
 *       200:
 *         description: Producto actualizado correctamente.
 *       400:
 *         description: Bad Request - validación de campos.
 *       404:
 *         description: Producto no encontrado.
 *       409:
 *         description: Conflict - otro producto con el mismo nombre ya existe.
 */
router.patch("/:id_producto", actualizarDetalles);

/**
 * @swagger
 * /api/productos/{id_producto}/stock:
 *   put:
 *     summary: Actualizar stock de un producto existente
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id_producto
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cantidad:
 *                 type: integer
 *           examples:
 *             cantidadEjemplo:
 *               summary: Incrementar stock (cantidad debe ser entero positivo > 0)
 *               value:
 *                 cantidad: 5
 *     responses:
 *       200:
 *         description: Stock actualizado correctamente.
 *       400:
 *         description: Bad Request - cantidad debe ser un entero mayor que 0. No se permiten 0 ni negativos.
 */
router.put("/:id_producto/stock", actualizarStock);

/**
 * @swagger
 * /api/productos/stock-por-codigo:
 *   post:
 *     summary: Actualizar stock usando codigo de barras
 *     tags: [Productos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               codigo:
 *                 type: string
 *               cantidad:
 *                 type: integer
 *           examples:
 *             ejemplo:
 *               summary: Incrementar stock por codigo
 *               value:
 *                 codigo: "abc-123"
 *                 cantidad: 5
 *     responses:
 *       200:
 *         description: Stock actualizado correctamente.
 *       400:
 *         description: Bad Request - codigo o cantidad inválidos.
 *       404:
 *         description: Producto no encontrado para el codigo proporcionado.
 */
router.post('/stock-por-codigo', actualizarStockPorCodigo);

export default router;
