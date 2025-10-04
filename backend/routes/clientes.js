const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Clientes
 *   description: Gestión de clientes
 */

/**
 * @swagger
 * /clientes:
 *   get:
 *     summary: Obtener todos los clientes
 *     tags: [Clientes]
 *     responses:
 *       200:
 *         description: Lista de clientes obtenida correctamente
 */
router.get('/', (req, res) => {
  res.json([{ id: 1, nombre: 'Juan Pérez' }]);
});

module.exports = router;
