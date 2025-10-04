// src/routes/productoRoutes.js
import express from "express";
import { crearProducto, actualizarStock } from "../controllers/productoController.js";

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
 *     responses:
 *       201:
 *         description: Producto creado correctamente.
 */
router.post("/", crearProducto);

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
 *     responses:
 *       200:
 *         description: Stock actualizado correctamente.
 */
router.put("/:id_producto/stock", actualizarStock);

export default router;
