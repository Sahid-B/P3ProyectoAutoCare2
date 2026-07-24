const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { JWT_SECRET } = require('../middlewares/auth-middleware');

// Regex para validar formato de correo electronico
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Registro de un nuevo usuario.
 * POST /api/auth/register
 */
async function registrar(req, res) {
  try {
    const { nombre, apellido, correo, contrasena, password } = req.body;
    const claveAcceso = contrasena || password;

    if (!nombre || !apellido || !correo || !claveAcceso) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos (nombre, apellido, correo, contrasena) son obligatorios.',
      });
    }

    const correoLimpio = correo.trim().toLowerCase();

    if (!EMAIL_REGEX.test(correoLimpio)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del correo electronico no es valido.',
      });
    }

    if (claveAcceso.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contrasena debe tener al menos 6 caracteres.',
      });
    }

    // Verificar si el correo ya esta registrado
    const usuarioExistente = await pool.query(
      'SELECT id FROM users WHERE LOWER(correo) = $1',
      [correoLimpio],
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El correo electronico ya se encuentra registrado.',
      });
    }

    // Encriptar la contrasena con bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(claveAcceso, saltRounds);

    // Insertar nuevo usuario
    const nuevoUsuario = await pool.query(
      `INSERT INTO users (nombre, apellido, correo, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, apellido, correo, created_at`,
      [nombre.trim(), apellido.trim(), correoLimpio, passwordHash],
    );

    const usuario = nuevoUsuario.rows[0];

    // Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        correo: usuario.correo,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
      },
      JWT_SECRET,
      { expiresIn: '24h' },
    );

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente.',
      token,
      usuario,
    });
  } catch (error) {
    console.error('[auth-controller] Error en registro:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar el usuario.',
    });
  }
}

/**
 * Inicio de sesion de usuario.
 * POST /api/auth/login
 */
async function iniciarSesion(req, res) {
  try {
    const { correo, contrasena, password } = req.body;
    const claveAcceso = contrasena || password;

    if (!correo || !claveAcceso) {
      return res.status(400).json({
        success: false,
        message: 'El correo electronico y la contrasena son obligatorios.',
      });
    }

    const correoLimpio = correo.trim().toLowerCase();

    // Buscar usuario por correo
    const resultado = await pool.query(
      'SELECT id, nombre, apellido, correo, password_hash, created_at FROM users WHERE LOWER(correo) = $1',
      [correoLimpio],
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales invalidas.',
      });
    }

    const usuario = resultado.rows[0];

    // Comparar la contrasena ingresada con el hash almacenado
    const esPasswordValido = await bcrypt.compare(claveAcceso, usuario.password_hash);

    if (!esPasswordValido) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales invalidas.',
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        correo: usuario.correo,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
      },
      JWT_SECRET,
      { expiresIn: '24h' },
    );

    delete usuario.password_hash;

    return res.json({
      success: true,
      message: 'Inicio de sesion exitoso.',
      token,
      usuario,
    });
  } catch (error) {
    console.error('[auth-controller] Error en login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al iniciar sesion.',
    });
  }
}

/**
 * Obtener datos del usuario autenticado actual.
 * GET /api/auth/me
 */
async function obtenerPerfil(req, res) {
  try {
    const usuarioId = req.usuario?.id;

    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no identificado.',
      });
    }

    const resultado = await pool.query(
      'SELECT id, nombre, apellido, correo, created_at FROM users WHERE id = $1',
      [usuarioId],
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.',
      });
    }

    return res.json({
      success: true,
      usuario: resultado.rows[0],
    });
  } catch (error) {
    console.error('[auth-controller] Error al obtener perfil:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar perfil de usuario.',
    });
  }
}

/**
 * Cierre de sesion (informativo para el cliente).
 * POST /api/auth/logout
 */
function cerrarSesion(_req, res) {
  return res.json({
    success: true,
    message: 'Sesion cerrada correctamente.',
  });
}

module.exports = {
  registrar,
  iniciarSesion,
  obtenerPerfil,
  cerrarSesion,
};
