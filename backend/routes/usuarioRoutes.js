import { Router } from "express";
import { 
  listarUsuarios, 
  crearUsuario, 
  eliminarUsuario,
  obtenerEstadisticas 
} from "../controllers/usuarioController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";

const router = Router();

// Todas las rutas requieren autenticación JWT
router.use(verifyJWT);

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: "Gestión de usuarios del sistema (solo administradores)"
 */

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: "Obtener lista de todos los usuarios"
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Lista de usuarios obtenida exitosamente"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   nombre:
 *                     type: string
 *                     example: "Juan Pérez"
 *                   email:
 *                     type: string
 *                     example: "juan@ejemplo.com"
 *                   rol:
 *                     type: string
 *                     enum: [admin, empleado]
 *                     example: "empleado"
 *                   telefono:
 *                     type: string
 *                     example: "5551234567"
 *                   direccion:
 *                     type: string
 *                     example: "Calle Falsa 123"
 *                   fecha_creacion:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00Z"
 *       401:
 *         description: "Token JWT inválido o expirado"
 *       403:
 *         description: "Acceso denegado - requiere rol de administrador"
 *       500:
 *         description: "Error interno del servidor"
 */
router.get("/", listarUsuarios);

/**
 * @swagger
 * /api/usuarios/estadisticas:
 *   get:
 *     summary: "Obtener estadísticas de usuarios"
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Estadísticas obtenidas exitosamente"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 10
 *                 administradores:
 *                   type: integer
 *                   example: 2
 *                 empleados:
 *                   type: integer
 *                   example: 8
 *                 usuariosRecientes:
 *                   type: integer
 *                   example: 3
 *                 fechaConsulta:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: "Acceso denegado - requiere rol de administrador"
 *       500:
 *         description: "Error interno del servidor"
 */
router.get("/estadisticas", obtenerEstadisticas);

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: "Crear un nuevo usuario"
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
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
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: "Nombre completo del usuario"
 *                 example: "María González"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: "Correo electrónico único"
 *                 example: "maria@ejemplo.com"
 *               password:
 *                 type: string
 *                 description: "Contraseña (mínimo 6 caracteres)"
 *                 example: "password123"
 *               rol:
 *                 type: string
 *                 enum: [admin, empleado]
 *                 default: "empleado"
 *                 description: "Rol del usuario en el sistema"
 *               telefono:
 *                 type: string
 *                 description: "Número de teléfono"
 *                 example: "5559876543"
 *               direccion:
 *                 type: string
 *                 description: "Dirección física"
 *                 example: "Av. Principal 456"
 *     responses:
 *       201:
 *         description: "Usuario creado exitosamente"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Usuario creado exitosamente."
 *                 usuario:
 *                   type: object
 *                 detalles:
 *                   type: string
 *                   example: "El usuario puede iniciar sesión con las credenciales proporcionadas."
 *       400:
 *         description: "Datos inválidos o email ya registrado"
 *       403:
 *         description: "Acceso denegado - requiere rol de administrador"
 *       500:
 *         description: "Error interno del servidor"
 */
router.post("/", crearUsuario);

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: "Eliminar un usuario por ID"
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "ID del usuario a eliminar"
 *     responses:
 *       200:
 *         description: "Usuario eliminado exitosamente"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   example: "Usuario eliminado exitosamente."
 *                 usuario:
 *                   type: object
 *                 detalles:
 *                   type: string
 *                   example: "El usuario ya no tendrá acceso al sistema."
 *       400:
 *         description: "No se puede eliminar el último administrador o ID inválido"
 *       403:
 *         description: "Acceso denegado - requiere rol de administrador"
 *       404:
 *         description: "Usuario no encontrado"
 *       500:
 *         description: "Error interno del servidor"
 */
router.delete("/:id", eliminarUsuario);

export default router;