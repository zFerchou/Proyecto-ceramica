import { pool } from "../config/db.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { enviarCorreo } from '../utils/mailer.js';
import dotenv from 'dotenv';
dotenv.config();

// --- Almacenamiento temporal para códigos 2FA ---
const codigos2FA = new Map(); // userId -> { codigo, expiresAt }

// ======================================================
//  LOGIN (1ra fase: correo y contraseña)
// ======================================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Correo y contraseña requeridos' });

    const result = await pool.query(
      'SELECT id, nombre, email, password, rol FROM usuarios WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = result.rows[0];

    // Verificar contraseña (hash o texto plano)
    const validPassword = user.password.startsWith('$2b$')
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (!validPassword)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    // Generar código 2FA
    const codigo2FA = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    codigos2FA.set(String(user.id), { codigo: codigo2FA, expiresAt });

    // Enviar correo con el código 2FA
    await enviarCorreo(
      user.email,
      'Tu código de autenticación 2FA',
      `Tu código temporal es: ${codigo2FA}\nVálido por 5 minutos.`
    );

    console.log(`📩 Código 2FA enviado a ${user.email}: ${codigo2FA}`);

    res.json({
      success: true,
      require2FA: true,
      userId: user.id,
      email: user.email,
      nombre: user.nombre,
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ======================================================
//  VERIFICAR 2FA (segunda fase del login)
// ======================================================
export const verify2FA = async (req, res) => {
  try {
    const { userId, codigo } = req.body;
    if (!userId || !codigo)
      return res.status(400).json({ error: 'Faltan datos' });

    const registro = codigos2FA.get(String(userId));

    if (!registro)
      return res.status(400).json({ error: 'No se solicitó código 2FA' });

    if (registro.expiresAt < Date.now()) {
      codigos2FA.delete(String(userId));
      return res.status(400).json({ error: 'Código expirado' });
    }

    if (registro.codigo !== codigo)
      return res.status(401).json({ error: 'Código incorrecto' });

    codigos2FA.delete(String(userId));

    const result = await pool.query(
      'SELECT id, nombre, email, rol FROM usuarios WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Usuario no encontrado' });

    const user = result.rows[0];

    // Crear token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, rol: user.rol },
      process.env.JWT_SECRET || 'secreto_super_seguro',
      { expiresIn: '24h' }
    );

    res.json({ success: true, token, user });
  } catch (error) {
    console.error('Error en verify2FA:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ======================================================
//  RECUPERAR NOMBRE DE USUARIO
// ======================================================
export const forgotUsername = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Correo requerido' });

    const result = await pool.query(
      'SELECT nombre FROM usuarios WHERE email = $1',
      [email.trim()]
    );
    if (result.rows.length === 0)
      return res.status(404).json({
        success: false,
        message: 'No se encontró una cuenta con ese correo',
      });

    const usuario = result.rows[0];
    await enviarCorreo(
      email,
      'Recuperación de nombre de usuario',
      `Tu nombre de usuario es: ${usuario.nombre}`
    );

    res.json({
      success: true,
      message: 'Se ha enviado tu nombre de usuario al correo',
    });
  } catch (error) {
    console.error('Error forgotUsername:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ======================================================
//  RECUPERAR CONTRASEÑA (envía link de recuperación)
// ======================================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: 'Correo requerido' });

    const usuarioRes = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email.trim()]
    );
    if (usuarioRes.rows.length === 0) {
      // No revelar si el correo existe
      return res.json({
        success: true,
        message: 'Si el correo existe, se ha enviado un enlace de recuperación',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000).toISOString();

    await pool.query(
      `UPDATE usuarios
       SET reset_password_token = $1, reset_password_expires = $2
       WHERE email = $3`,
      [resetToken, expiresAt, email.trim()]
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${encodeURIComponent(resetToken)}`;

    await enviarCorreo(
      email,
      'Recuperación de contraseña',
      `Haz clic en el siguiente enlace para restablecer tu contraseña:\n${resetUrl}\n\nExpira en 1 hora.`
    );

    res.json({
      success: true,
      message: 'Si el correo existe, se ha enviado un enlace de recuperación',
    });
  } catch (error) {
    console.error('Error forgotPassword:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ======================================================
//  RESTABLECER CONTRASEÑA
// ======================================================
export const resetPassword = async (req, res) => {
  try {
    const token = (req.body.token || req.query.token || '').trim();
    const { newPassword } = req.body;

    if (!token || !newPassword)
      return res.status(400).json({
        success: false,
        message: 'Token y nueva contraseña requeridos',
      });

    if (newPassword.length < 6)
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres',
      });

    const result = await pool.query(
      `SELECT id FROM usuarios
       WHERE reset_password_token = $1
       AND reset_password_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ success: false, message: 'Token inválido o expirado' });

    const user = result.rows[0];
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await pool.query(
      `UPDATE usuarios
       SET password = $1,
           reset_password_token = NULL,
           reset_password_expires = NULL
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    res.json({ success: true, message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    console.error('Error resetPassword:', error);
    res.status(500).json({ success: false, message: 'Error interno al restablecer la contraseña' });
  }
};

// ======================================================
//  VERIFICAR TOKEN (JWT o de recuperación)
// ======================================================
export const verifyToken = async (req, res) => {
  try {
    const token = (req.params.token || req.body.token || '').trim();
    if (!token)
      return res.status(400).json({ success: false, message: 'No hay token para verificar' });

    // Intentar JWT
    if (token.split('.').length === 3) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_super_seguro');
        return res.json({
          success: true,
          message: 'Token válido (JWT)',
          email: decoded.email,
          userId: decoded.userId,
          rol: decoded.rol,
        });
      } catch (err) {
        const msg = err.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido';
        return res.status(400).json({ success: false, message: msg });
      }
    }

    // Token de recuperación
    const result = await pool.query(
      `SELECT email FROM usuarios
       WHERE reset_password_token = $1
       AND reset_password_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ success: false, message: 'Token inválido o expirado' });

    res.json({
      success: true,
      message: 'Token de recuperación válido',
      email: result.rows[0].email,
    });
  } catch (error) {
    console.error('Error verifyToken:', error);
    res.status(500).json({ success: false, message: 'Error al verificar el token' });
  }
};
