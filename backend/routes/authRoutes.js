import { Router } from 'express';
import {
  login,
  verify2FA,
  forgotUsername,
  forgotPassword,
  resetPassword,
  verifyToken,
} from '../controllers/authController.js';
import { verifyJWT } from '../middlewares/authMiddleware.js';
import jwt from 'jsonwebtoken';
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
 *                 example: "admin@tienda.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: "Éxito, requiere 2FA"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 require2FA:
 *                   type: boolean
 *                 userId:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 nombre:
 *                   type: string
 *       400:
 *         description: "Faltan datos"
 *       401:
 *         description: "Credenciales inválidas"
 *       500:
 *         description: "Error interno del servidor"
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/verify2FA:
 *   post:
 *     summary: "Verifica el código 2FA enviado por correo y genera token JWT"
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
 *                 type: integer
 *                 example: 1
 *               codigo:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: "Login exitoso con token JWT"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                   description: "Token JWT para autenticar solicitudes"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     email:
 *                       type: string
 *                     rol:
 *                       type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: "Código inválido o expirado"
 *       404:
 *         description: "Usuario no encontrado"
 *       500:
 *         description: "Error interno del servidor"
 */
router.post('/verify2FA', verify2FA);

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: "Verifica el token JWT actual y devuelve información del usuario"
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Token válido, información del usuario"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     rol:
 *                       type: string
 *                     nombre:
 *                       type: string
 *                     isAdmin:
 *                       type: boolean
 *                     isEmployee:
 *                       type: boolean
 *       401:
 *         description: "Token no proporcionado o inválido"
 *       403:
 *         description: "Token expirado"
 */
router.get('/verify', verifyJWT, (req, res) => {
  // Esta ruta simplemente devuelve la información del usuario desde el token
  res.json({
    success: true,
    user: req.user,
    message: 'Token válido'
  });
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: "Renueva el token JWT expirado o próximo a expirar"
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Token renovado exitosamente"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                   description: "Nuevo token JWT"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nombre:
 *                       type: string
 *                     email:
 *                       type: string
 *                     rol:
 *                       type: string
 *                 message:
 *                   type: string
 *       401:
 *         description: "Token no válido para refresh"
 *       500:
 *         description: "Error interno del servidor"
 */
router.post('/refresh', verifyJWT, (req, res) => {
  try {
    // Crear un nuevo token con los mismos datos del usuario
    const token = jwt.sign(
      {
        userId: req.user.userId,
        id: req.user.id,
        email: req.user.email,
        rol: req.user.rol,
        nombre: req.user.nombre
      },
      process.env.JWT_SECRET || 'secreto_super_seguro',
      { expiresIn: '24h' } // Renovar por 24 horas más
    );
    
    console.log(`🔄 Token renovado para: ${req.user.email}`);
    
    res.json({
      success: true,
      token,
      user: req.user,
      message: 'Token renovado exitosamente'
    });
  } catch (error) {
    console.error('Error renovando token:', error);
    res.status(500).json({
      success: false,
      message: 'Error renovando token'
    });
  }
});

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
 *                 example: "usuario@ejemplo.com"
 *     responses:
 *       200:
 *         description: "Correo enviado con el nombre de usuario"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: "Correo requerido"
 *       404:
 *         description: "No se encontró una cuenta con ese correo"
 *       500:
 *         description: "Error interno del servidor"
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
 *                 example: "usuario@ejemplo.com"
 *     responses:
 *       200:
 *         description: "Si el correo existe, se envió el enlace de recuperación"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: "Correo requerido"
 *       500:
 *         description: "Error interno del servidor"
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
 *                 description: "Token recibido por correo"
 *               newPassword:
 *                 type: string
 *                 description: "Nueva contraseña (mínimo 6 caracteres)"
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: "Contraseña restablecida correctamente"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: "Token inválido o expirado / contraseña inválida"
 *       500:
 *         description: "Error interno al restablecer la contraseña"
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
 *                 description: "Token JWT o token de recuperación"
 *     responses:
 *       200:
 *         description: "Token válido"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 email:
 *                   type: string
 *                 userId:
 *                   type: integer
 *                 rol:
 *                   type: string
 *                 nombre:
 *                   type: string
 *       400:
 *         description: "Token inválido o expirado"
 *       500:
 *         description: "Error al verificar el token"
 */
router.post('/verify-token', verifyToken);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   get:
 *     summary: "Obtiene token de recuperación desde URL (para frontend)"
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: "Token recibido correctamente"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 message:
 *                   type: string
 */
router.get('/reset-password/:token', (req, res) => {
  res.json({
    token: req.params.token,
    message: 'Token recibido, use POST /auth/reset-password para cambiar la contraseña'
  });
});

export default router;