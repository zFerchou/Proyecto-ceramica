import { Router } from "express";
import { listarUsuarios, crearUsuario } from "../controllers/usuarioController.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: "Endpoints para gestionar usuarios"
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: "Listar todos los usuarios"
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                   email:
 *                     type: string
 *                   rol:
 *                     type: string
 *                   telefono:
 *                     type: string
 *                   direccion:
 *                     type: string
 *       500:
 *         description: Error del servidor
 */
router.get("/", listarUsuarios);

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: "Crear un nuevo usuario"
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - password
 *               - rol
 *               - telefono
 *               - direccion
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               rol:
 *                 type: string
 *               telefono:
 *                 type: string
 *               direccion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 usuario:
 *                   type: object
 *       400:
 *         description: Email ya existe
 *       500:
 *         description: Error del servidor
 */
router.post("/", crearUsuario);

export default router;
