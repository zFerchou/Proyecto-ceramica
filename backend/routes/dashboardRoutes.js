import express from "express";
import { getProductosResumen } from "../controllers/dashboardProductosController.js";

const router = express.Router();

/**
 * @swagger
 * /dashboard/productos-resumen:
 *   get:
 *     summary: Resumen para dashboard (top vendidos, recientes, agotando)
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Resumen de productos
 *       500:
 *         description: Error del servidor
 */
router.get("/productos-resumen", getProductosResumen);

export default router;
