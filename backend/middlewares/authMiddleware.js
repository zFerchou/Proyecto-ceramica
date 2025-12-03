import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token de autenticación no proporcionado. Use formato: Bearer <token>' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
    
    // Validar que el token tenga la estructura esperada
    if (!decoded.userId && !decoded.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido: falta información del usuario' 
      });
    }
    
    // Normalizar la información del usuario
    req.user = {
      // Asegurar que tenemos userId (compatibilidad con ambos nombres)
      userId: decoded.userId || decoded.id,
      // Asegurar que tenemos id (compatibilidad inversa)
      id: decoded.id || decoded.userId,
      // Información básica del usuario
      email: decoded.email,
      rol: decoded.rol,
      nombre: decoded.nombre,
      // Cualquier otra información del token
      ...decoded
    };
    
    // Agregar un flag para fácil verificación de admin
    req.user.isAdmin = decoded.rol === 'admin';
    req.user.isEmployee = decoded.rol === 'empleado' || decoded.rol === 'usuario';
    
    console.log(`🔐 Usuario autenticado: ${req.user.email} (${req.user.rol}) ID: ${req.user.userId}`);
    next();
  } catch (err) {
    console.error('Error verificando token:', err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado, por favor inicie sesión nuevamente' 
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido o malformado' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Error al verificar la autenticación' 
    });
  }
};

// Middleware opcional para verificar roles específicos
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      });
    }
    
    if (!roles.includes(req.user.rol)) {
      console.log(`⛔ Acceso denegado: ${req.user.email} (${req.user.rol}) intentó acceder a ruta para roles: ${roles.join(', ')}`);
      return res.status(403).json({ 
        success: false, 
        message: `Acceso denegado. Se requiere uno de los roles: ${roles.join(', ')}` 
      });
    }
    
    next();
  };
};

// Middleware para verificar que sea admin
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Usuario no autenticado' 
    });
  }
  
  if (req.user.rol !== 'admin') {
    console.log(`⛔ Acceso denegado: ${req.user.email} (${req.user.rol}) intentó acceder a ruta de admin`);
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso restringido a administradores' 
    });
  }
  
  next();
};

// Middleware para verificar que sea empleado (o admin)
export const requireEmployee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Usuario no autenticado' 
    });
  }
  
  const allowedRoles = ['admin', 'empleado', 'usuario', 'vendedor'];
  if (!allowedRoles.includes(req.user.rol)) {
    console.log(`⛔ Acceso denegado: ${req.user.email} (${req.user.rol}) intentó acceder a ruta de empleados`);
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso restringido a empleados' 
    });
  }
  
  next();
};