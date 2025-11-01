import express from 'express';
import { CategoriaController } from '../controllers/categoriaController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Categorías
 *   description: Gestión de categorías de productos
 */

/**
 * @swagger
 * /categorias:
 *   get:
 *     summary: Obtener todas las categorías activas
 *     tags: [Categorías]
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_categoria:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   descripcion:
 *                     type: string
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', CategoriaController.getAllCategorias);

/**
 * @swagger
 * /categorias/{id}:
 *   get:
 *     summary: Obtener categoría por ID
 *     tags: [Categorías]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Categoría encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_categoria:
 *                   type: integer
 *                 nombre:
 *                   type: string
 *                 descripcion:
 *                   type: string
 *       404:
 *         description: Categoría no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', CategoriaController.getCategoriaById);

/**
 * @swagger
 * /categorias:
 *   post:
 *     summary: Crear nueva categoría
 *     tags: [Categorías]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre de la categoría
 *                 example: "Electrónicos"
 *               descripcion:
 *                 type: string
 *                 description: Descripción de la categoría
 *                 example: "Productos electrónicos y dispositivos"
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 categoria:
 *                   type: object
 *                   properties:
 *                     id_categoria:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     descripcion:
 *                       type: string
 *       400:
 *         description: Datos de entrada inválidos
 *       409:
 *         description: Ya existe una categoría con este nombre
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', CategoriaController.createCategoria);

/**
 * @swagger
 * /categorias/{id}:
 *   put:
 *     summary: Actualizar categoría
 *     tags: [Categorías]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre de la categoría
 *                 example: "Electrodomésticos"
 *               descripcion:
 *                 type: string
 *                 description: Descripción de la categoría
 *                 example: "Electrodomésticos y línea blanca"
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 categoria:
 *                   type: object
 *                   properties:
 *                     id_categoria:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     descripcion:
 *                       type: string
 *       400:
 *         description: Datos de entrada inválidos
 *       404:
 *         description: Categoría no encontrada
 *       409:
 *         description: Ya existe otra categoría con este nombre
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', CategoriaController.updateCategoria);

/**
 * @swagger
 * /categorias/{id}:
 *   delete:
 *     summary: Eliminar categoría (borrado lógico)
 *     tags: [Categorías]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Categoría eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 categoria:
 *                   type: object
 *                   properties:
 *                     id_categoria:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *       404:
 *         description: Categoría no encontrada
 *       409:
 *         description: No se puede eliminar porque está siendo utilizada por productos
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', CategoriaController.deleteCategoria);

/**
 * @swagger
 * /categorias/{id}/restore:
 *   patch:
 *     summary: Restaurar categoría eliminada
 *     tags: [Categorías]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Categoría restaurada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 categoria:
 *                   type: object
 *                   properties:
 *                     id_categoria:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     descripcion:
 *                       type: string
 *       404:
 *         description: Categoría no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/:id/restore', CategoriaController.restoreCategoria);

export default router;