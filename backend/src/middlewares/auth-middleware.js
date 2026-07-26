const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth-config');

/**
 * Middleware para verificar el token JWT en solicitudes protegidas.
 */
function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Acceso no autorizado. Token no proporcionado.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const usuarioDecodificado = jwt.verify(token, JWT_SECRET);
    req.usuario = usuarioDecodificado;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalido o expirado.',
    });
  }
}

/**
 * Middleware para verificar si el usuario tiene rol de administrador.
 * Debe ejecutarse DESPUES de verificarToken.
 */
function verificarRolAdmin(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de administrador.',
    });
  }
  next();
}

module.exports = { verificarToken, verificarRolAdmin, JWT_SECRET };
