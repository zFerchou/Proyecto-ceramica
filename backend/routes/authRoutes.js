import { Router } from 'express';
import {
  login,
  verify2FA,
  forgotUsername,
  forgotPassword,
  resetPassword,
  verifyToken,
} from '../controllers/authController.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: "Endpoints de autenticación y recuperación de usuario/contraseña"
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: "Inicia sesión con correo y contraseña, solicita 2FA"
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: "Éxito, requiere 2FA"
 *       400:
 *         description: "Faltan datos"
 *       401:
 *         description: "Credenciales inválidas"
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/verify2FA:
 *   post:
 *     summary: "Verifica el código 2FA enviado por correo"
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - codigo
 *             properties:
 *               userId:
 *                 type: string
 *               codigo:
 *                 type: string
 *     responses:
 *       200:
 *         description: "Login exitoso con token JWT"
 *       400:
 *         description: "Código inválido o expirado"
 */
router.post('/verify2FA', verify2FA);

/**
 * @swagger
 * /auth/forgot-username:
 *   post:
 *     summary: "Recupera el nombre de usuario enviándolo al correo"
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: "Correo enviado con el nombre de usuario"
 */
router.post('/forgot-username', forgotUsername);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: "Envía un enlace de recuperación de contraseña al correo"
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: "Si el correo existe, se envió el enlace de recuperación"
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: "Restablece la contraseña usando token"
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: "Contraseña restablecida correctamente"
 *       400:
 *         description: "Token inválido o expirado / contraseña inválida"
 */
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /auth/verify-token:
 *   post:
 *     summary: "Verifica si un token (JWT o de recuperación) es válido"
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: "Token válido"
 *       400:
 *         description: "Token inválido o expirado"
 */
router.post('/verify-token', verifyToken);

/**
 * Ruta opcional para obtener el token desde la URL
 * Esto no reemplaza reset-password POST, solo devuelve el token recibido
 * útil para debug o frontend React Router
 */
router.get('/reset-password/:token', (req, res) => {
  res.json({
    token: req.params.token,
    message: 'Token recibido, use POST /auth/reset-password para cambiar la contraseña'
  });
});

export default router;
