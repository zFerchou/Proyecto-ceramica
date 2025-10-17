import express from "express";
import { 
  crearProducto, 
  actualizarStock, 
  eliminarProducto, 
  actualizarDetalles, 
  actualizarStockPorCodigo,
  listarProductos
} from "../controllers/productoController.js";
import { generarQRProducto } from "../controllers/qrController.js"; // Controlador para QR
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar multer para usar memoria; guardaremos como PNG en el controlador con nombre basado en el producto
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten imágenes (png, jpg, jpeg, webp)"));
  },
});

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
// Acepta multipart/form-data con campo 'imagen'
router.post("/", upload.single("imagen"), crearProducto);

/**
 * @swagger
 * /productos:
 *   get:
 *     summary: Obtener lista de todos los productos
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos exitosa
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
 */
router.delete("/:id_producto", eliminarProducto);

/**
 * @swagger
 * /productos/{id_producto}:
 *   patch:
 *     summary: Actualizar detalles de un producto
 *     tags: [Productos]
 */
router.patch("/:id_producto", actualizarDetalles);

/**
 * @swagger
 * /productos/{id_producto}/stock:
 *   put:
 *     summary: Actualizar stock de un producto existente
 *     tags: [Productos]
 */
router.put("/:id_producto/stock", actualizarStock);

/**
 * @swagger
 * /productos/stock-por-codigo:
 *   post:
 *     summary: Actualizar stock usando código de barras
 *     tags: [Productos]
 */
router.post("/stock-por-codigo", actualizarStockPorCodigo);

/**
 * @swagger
 * /productos/{id_producto}/qr:
 *   get:
 *     summary: Generar o mostrar el código QR de un producto
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id_producto
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Devuelve el QR generado para el producto
 *       404:
 *         description: Producto no encontrado
 */
router.get("/:id_producto/qr", generarQRProducto);
export default router;
