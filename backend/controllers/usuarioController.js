import Usuario from '../models/Usuario.js';

/**
 * Listar todos los usuarios
 */
export const listarUsuarios = async (req, res) => {
  try {
    // Verificar si el usuario actual es admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ 
        error: 'Acceso denegado. Solo administradores pueden ver la lista de usuarios.' 
      });
    }

    const usuarios = await Usuario.obtenerTodos();
    
    // Normalizar roles para consistencia en la respuesta
    const usuariosNormalizados = usuarios.map(usuario => ({
      ...usuario,
      rol: Usuario.normalizarRol(usuario.rol)
    }));
    
    res.json(usuariosNormalizados);
    
  } catch (err) {
    console.error('Error al listar usuarios:', err);
    res.status(500).json({ 
      error: 'Error interno del servidor al obtener usuarios',
      detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * Crear un nuevo usuario
 */
export const crearUsuario = async (req, res) => {
  try {
    // Verificar si el usuario actual es admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ 
        error: 'Acceso denegado. Solo administradores pueden crear usuarios.' 
      });
    }

    const { nombre, email, password, rol, telefono, direccion } = req.body;
    
    // Validaciones básicas
    if (!nombre || !email || !password) {
      return res.status(400).json({ 
        error: 'Nombre, email y contraseña son campos requeridos.' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres.' 
      });
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'El formato del email no es válido.' 
      });
    }
    
    // Normalizar rol
    const rolNormalizado = rol ? Usuario.normalizarRol(rol) : 'empleado';
    
    // Crear usuario
    const usuario = await Usuario.crear(
      nombre.trim(),
      email.trim(),
      password,
      rolNormalizado,
      telefono ? telefono.trim() : null,
      direccion ? direccion.trim() : null
    );
    
    res.status(201).json({ 
      mensaje: 'Usuario creado exitosamente.', 
      usuario,
      detalles: 'El usuario puede iniciar sesión con las credenciales proporcionadas.'
    });
    
  } catch (err) {
    console.error('Error al crear usuario:', err);
    
    if (err.code === '23505') { // Violación de unique constraint
      res.status(400).json({ 
        error: 'El email ya está registrado en el sistema.' 
      });
    } else if (err.code === '23502') { // Violación de not-null constraint
      res.status(400).json({ 
        error: 'Faltan campos requeridos.' 
      });
    } else {
      res.status(500).json({ 
        error: 'Error interno del servidor al crear usuario.',
        detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
};

/**
 * Eliminar un usuario
 */
export const eliminarUsuario = async (req, res) => {
  try {
    // Verificar si el usuario actual es admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ 
        error: 'Acceso denegado. Solo administradores pueden eliminar usuarios.' 
      });
    }

    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'ID de usuario inválido.' 
      });
    }
    
    // No permitir eliminarse a sí mismo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ 
        error: 'No puedes eliminar tu propia cuenta.' 
      });
    }
    
    const usuarioEliminado = await Usuario.eliminar(parseInt(id));
    
    if (!usuarioEliminado) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado.' 
      });
    }
    
    res.json({ 
      mensaje: 'Usuario eliminado exitosamente.', 
      usuario: usuarioEliminado,
      detalles: 'El usuario ya no tendrá acceso al sistema.'
    });
    
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    
    if (err.message.includes('último administrador')) {
      res.status(400).json({ 
        error: err.message,
        detalles: 'Debe haber al menos un administrador en el sistema.'
      });
    } else if (err.message.includes('no encontrado')) {
      res.status(404).json({ 
        error: err.message 
      });
    } else {
      res.status(500).json({ 
        error: 'No se pueden eliminar usuarios con ventas registradas',
        detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }
};

/**
 * Obtener estadísticas de usuarios
 */
export const obtenerEstadisticas = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ 
        error: 'Acceso denegado. Solo administradores pueden ver estadísticas.' 
      });
    }

    const usuarios = await Usuario.obtenerTodos();
    
    const totalUsuarios = usuarios.length;
    const totalAdmins = usuarios.filter(u => 
      Usuario.normalizarRol(u.rol) === 'admin'
    ).length;
    const totalEmpleados = totalUsuarios - totalAdmins;
    
    // Usuarios creados en los últimos 30 días
    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);
    
    const usuariosRecientes = usuarios.filter(u => 
      new Date(u.fecha_creacion) >= treintaDiasAtras
    ).length;
    
    res.json({
      total: totalUsuarios,
      administradores: totalAdmins,
      empleados: totalEmpleados,
      usuariosRecientes,
      fechaConsulta: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ 
      error: 'Error interno del servidor.',
      detalles: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};