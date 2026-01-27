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
 *         multipart/form-data:
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
 *               imagen:
 *                 type: string
 *                 format: binary
 *           encoding:
 *             imagen:
 *               contentType: [image/png, image/jpeg, image/webp]
 *           examples:
 *             productoEjemplo:
 *               summary: Ejemplo multipart
 *               value:
 *                 nombre: "Taza"
 *                 descripcion: "Taza de cerámica blanca"
 *                 cantidad: 10
 *                 precio: 5.5
 *                 id_categoria: 1
 *     responses:
 *       201:
 *         description: Producto creado correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 id_producto:
 *                   type: integer
 *                 codigo_barras:
 *                   type: string
 *                 codigo_qr:
 *                   type: string
 *                 qr_link:
 *                   type: string
 *                 imagen_url:
 *                   type: string
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
 *   patch:
 *     summary: Actualizar producto por ID
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: id_producto
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
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               precio:
 *                 type: number
 *               cantidad:
 *                 type: integer
 *               id_categoria:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Producto actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 producto:
 *                   type: object
 *       404:
 *         description: Producto no encontrado
 *       409:
 *         description: Ya existe otro producto con este nombre
 *       500:
 *         description: Error en el servidor
 */
router.patch('/:id_producto', actualizarDetalles);

/**
 * @swagger
 * /productos/nombre/{nombre}:
 *   delete:
 *     summary: Eliminar un producto por nombre
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: nombre
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre único del producto
 *     responses:
 *       200:
 *         description: Producto eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 id_producto:
 *                   type: integer
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.delete("/nombre/:nombre", async (req, res, next) => {
  // Proxy a eliminarProducto usando nombre → id_producto
  // Mantengo el handler centralizado en el controlador actual (por id) para minimizar cambios internos.
  try {
    const { nombre } = req.params;
    const r = await (await import("../config/db.js")).pool.query(`SELECT id_producto FROM producto WHERE nombre = $1`, [nombre]);
    if (r.rowCount === 0) return res.status(404).json({ error: "Producto no encontrado" });
    req.params.id_producto = r.rows[0].id_producto;
    return eliminarProducto(req, res);
  } catch (e) { next(e); }
});
/**
 * @swagger
 * /productos/codigo-barras/{codigo_barras}:
 *   delete:
 *     summary: Eliminar un producto por código de barras
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: codigo_barras
 *         required: true
 *         schema:
 *           type: string
 *         description: Código EAN-13 del producto
 *     responses:
 *       200:
 *         description: Producto eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 id_producto:
 *                   type: integer
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.delete("/codigo-barras/:codigo_barras", async (req, res, next) => {
  try {
    const { codigo_barras } = req.params;
    const r = await (await import("../config/db.js")).pool.query(`SELECT id_producto FROM codigo_barras WHERE codigo = $1`, [codigo_barras]);
    if (r.rowCount === 0) return res.status(404).json({ error: "Producto no encontrado" });
    req.params.id_producto = r.rows[0].id_producto;
    return eliminarProducto(req, res);
  } catch (e) { next(e); }
});

/**
 * @swagger
 * /productos/nombre/{nombre}:
 *   patch:
 *     summary: Actualizar detalles de un producto por nombre
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: nombre
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
 *         description: Producto actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 producto:
 *                   type: object
 *       404:
 *         description: Producto no encontrado
 *       409:
 *         description: Otro producto con ese nombre ya existe
 *       500:
 *         description: Error en el servidor
 */
router.patch("/nombre/:nombre", async (req, res, next) => {
  try {
    const { nombre } = req.params;
    const r = await (await import("../config/db.js")).pool.query(`SELECT id_producto FROM producto WHERE nombre = $1`, [nombre]);
    if (r.rowCount === 0) return res.status(404).json({ error: "Producto no encontrado" });
    req.params.id_producto = r.rows[0].id_producto;
    return actualizarDetalles(req, res);
  } catch (e) { next(e); }
});

/**
 * @swagger
 * /productos/codigo-barras/{codigo_barras}/stock:
 *   post:
 *     summary: Actualizar stock usando código de barras (en la ruta)
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: codigo_barras
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cantidad]
 *             properties:
 *               cantidad:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Stock actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 nuevaCantidad:
 *                   type: integer
 *       400:
 *         description: Solicitud inválida
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.post("/codigo-barras/:codigo_barras/stock", async (req, res, next) => {
  try {
    const { codigo_barras } = req.params;
    const { cantidad } = req.body;
    if (!Number.isInteger(cantidad) || cantidad <= 0) return res.status(400).json({ error: "cantidad must be positive integer" });
    const r = await (await import("../config/db.js")).pool.query(`SELECT p.id_producto FROM codigo_barras c JOIN producto p ON p.id_producto = c.id_producto WHERE c.codigo = $1`, [codigo_barras]);
    if (r.rowCount === 0) return res.status(404).json({ error: "Producto no encontrado" });
    req.params.id_producto = r.rows[0].id_producto;
    return actualizarStock(req, res);
  } catch (e) { next(e); }
});

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
 *             required: [codigo, cantidad]
 *             properties:
 *               codigo:
 *                 type: string
 *               cantidad:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Stock actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 nuevaCantidad:
 *                   type: integer
 *       400:
 *         description: Solicitud inválida
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.post("/stock-por-codigo", actualizarStockPorCodigo);

/**
 * @swagger
 * /productos/qr/{codigo_qr}:
 *   get:
 *     summary: Generar o mostrar el código QR de un producto por codigo_qr
 *     tags: [Productos]
 *     parameters:
 *       - in: path
 *         name: codigo_qr
 *         required: true
 *         schema:
 *           type: string
 *         description: Código QR (UUID) asociado al producto
 *     responses:
 *       200:
 *         description: QR generado/devuelto correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 codigoQR:
 *                   type: string
 *                 qrDataURL:
 *                   type: string
 *       404:
 *         description: Producto o QR no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.get("/qr/:codigo_qr", async (req, res, next) => {
  try {
    const { codigo_qr } = req.params;
    const r = await (await import("../config/db.js")).pool.query(`SELECT id_producto FROM codigo_qr WHERE codigo_qr = $1`, [codigo_qr]);
    if (r.rowCount === 0) return res.status(404).json({ error: "Producto o QR no encontrado" });
    req.params.id_producto = r.rows[0].id_producto;
    return generarQRProducto(req, res);
  } catch (e) { next(e); }
});
export default router;