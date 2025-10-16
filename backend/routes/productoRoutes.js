import express from "express";
import { 
  crearProducto, 
  actualizarStock, 
  eliminarProducto, 
  actualizarDetalles, 
  actualizarStockPorCodigo,
  listarProductos
} from "../controllers/productoController.js";

const router = express.Router();

/**
 * @swagger
 * /productos:
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
 *               summary: Ejemplo correcto
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
 *         description: Bad Request.
 */
router.post("/", crearProducto);

/**
 * @swagger
 * /productos:
 *   get:
 *     summary: Obtener lista de todos los productos
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nombre:
 *                     type: string
 *                   descripcion:
 *                     type: string
 *                   cantidad:
 *                     type: integer
 *                   precio:
 *                     type: number
 *       500:
 *         description: Error en el servidor al listar productos
 */
router.get("/", listarProductos);

/**
 * @swagger
 * /productos/{id_producto}:
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
 * /productos/{id_producto}:
 *   patch:
 *     summary: Actualizar detalles de un producto
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
 *     responses:
 *       200:
 *         description: Producto actualizado correctamente.
 *       400:
 *         description: Bad Request.
 *       404:
 *         description: Producto no encontrado.
 *       409:
 *         description: Conflict - otro producto con el mismo nombre ya existe.
 */
router.patch("/:id_producto", actualizarDetalles);

/**
 * @swagger
 * /productos/{id_producto}/stock:
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
 *       400:
 *         description: Bad Request.
 */
router.put("/:id_producto/stock", actualizarStock);

/**
 * @swagger
 * /productos/stock-por-codigo:
 *   post:
 *     summary: Actualizar stock usando código de barras
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
 *     responses:
 *       200:
 *         description: Stock actualizado correctamente.
 *       400:
 *         description: Bad Request.
 *       404:
 *         description: Producto no encontrado para el código proporcionado.
 */
router.post('/stock-por-codigo', actualizarStockPorCodigo);

export default router;
