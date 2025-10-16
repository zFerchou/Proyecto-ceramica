import Usuario from '../models/Usuario.js';

/**
 * Listar todos los usuarios
 */
export const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.obtenerTodos();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Crear un nuevo usuario
 */
export const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol, telefono, direccion } = req.body;
    const usuario = await Usuario.crear(nombre, email, password, rol, telefono, direccion);
    res.json({ mensaje: 'Usuario creado', usuario });
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'El email ya existe.' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
};
