const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const { pool } = require('../config/database');
const { enviarCodigoOTP } = require('../services/email-service');


const JWT_SECRET = process.env.JWT_SECRET || 'autocare_secret_key_change_in_production';
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
        message: 'Todos los campos son obligatorios (nombre, apellido, correo y contrasena).',
      });
    }

    const correoLimpio = correo.trim().toLowerCase();

    if (!EMAIL_REGEX.test(correoLimpio)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de correo electronico invalido.',
      });
    }

    if (claveAcceso.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contrasena debe tener al menos 6 caracteres.',
      });
    }

    const usuarioExistente = await pool.query(
      'SELECT id FROM users WHERE LOWER(correo) = $1',
      [correoLimpio],
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El correo electronico ya esta registrado.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(claveAcceso, salt);

    const nuevoUsuario = await pool.query(
      `INSERT INTO users (nombre, apellido, correo, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, apellido, correo, is_2fa_enabled, google_id, created_at`,
      [nombre.trim(), apellido.trim(), correoLimpio, passwordHash],
    );

    const usuario = nuevoUsuario.rows[0];

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

    const resultado = await pool.query(
      'SELECT id, nombre, apellido, correo, password_hash, is_2fa_enabled, totp_secret, created_at FROM users WHERE LOWER(correo) = $1',
      [correoLimpio],
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales invalidas.',
      });
    }

    const usuario = resultado.rows[0];

    if (!usuario.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Esta cuenta utiliza inicio de sesion con Google. Por favor usa el boton "Continuar con Google".',
      });
    }

    const esPasswordValido = await bcrypt.compare(claveAcceso, usuario.password_hash);

    if (!esPasswordValido) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales invalidas.',
      });
    }

    // Verificar si el usuario tiene 2FA activado
    if (usuario.is_2fa_enabled) {
      // Generar codigo OTP por correo por defecto si no utiliza TOTP exclusivamente
      const codigoOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await pool.query(
        "UPDATE users SET otp_code = $1, otp_expires_at = CURRENT_TIMESTAMP + INTERVAL '10 minutes' WHERE id = $2",
        [codigoOtp, usuario.id],
      );

      // Enviar correo via SMTP
      enviarCodigoOTP(usuario.correo, codigoOtp).catch((err) =>
        console.error('[auth-controller] Error enviando OTP por correo:', err),
      );

      return res.json({
        success: true,
        requiere2FA: true,
        userId: usuario.id,
        correo: usuario.correo,
        message: 'Se requiere verificacion en 2 pasos (2FA). Se ha enviado un codigo OTP a tu correo.',
      });
    }

    // Generar token JWT si no requiere 2FA
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
    delete usuario.totp_secret;

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
 * Verificacion del codigo 2FA durante el login.
 * POST /api/auth/2fa/verify-login
 */
async function verificarLogin2FA(req, res) {
  try {
    const { userId, token2FA } = req.body;

    if (!userId || !token2FA) {
      return res.status(400).json({
        success: false,
        message: 'El ID de usuario y el codigo 2FA son obligatorios.',
      });
    }

    const resultado = await pool.query(
      'SELECT id, nombre, apellido, correo, is_2fa_enabled, totp_secret, otp_code, otp_expires_at FROM users WHERE id = $1',
      [userId],
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.',
      });
    }

    const usuario = resultado.rows[0];
    let esCodigoValido = false;

    // 1. Probar codigo TOTP (Google Authenticator) si tiene secreto configurado
    if (usuario.totp_secret) {
      esCodigoValido = authenticator.verify({
        token: token2FA.trim(),
        secret: usuario.totp_secret,
      });
    }

    // 2. Probar codigo OTP enviado por correo
    if (!esCodigoValido && usuario.otp_code) {
      const horaActual = new Date();
      const horaExpiracion = new Date(usuario.otp_expires_at);
      if (usuario.otp_code === token2FA.trim() && horaActual <= horaExpiracion) {
        esCodigoValido = true;
      }
    }

    if (!esCodigoValido) {
      return res.status(401).json({
        success: false,
        message: 'Codigo de verificacion 2FA invalido o expirado.',
      });
    }

    // Limpiar codigo OTP despues de uso
    await pool.query('UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = $1', [usuario.id]);

    // Generar token JWT final
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

    delete usuario.totp_secret;
    delete usuario.otp_code;

    return res.json({
      success: true,
      message: 'Verificacion 2FA exitosa.',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        is_2fa_enabled: usuario.is_2fa_enabled,
      },
    });
  } catch (error) {
    console.error('[auth-controller] Error en verificacion 2FA de login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar el codigo 2FA.',
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
      'SELECT id, nombre, apellido, correo, is_2fa_enabled, google_id, created_at FROM users WHERE id = $1',
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
 * Actualizar datos del perfil de usuario.
 * PUT /api/auth/profile
 */
async function actualizarPerfil(req, res) {
  try {
    const usuarioId = req.usuario?.id;
    const { nombre, apellido, contrasenaActual, nuevaContrasena } = req.body;

    if (!usuarioId) {
      return res.status(401).json({ success: false, message: 'Usuario no identificado.' });
    }

    if (!nombre || !apellido) {
      return res.status(400).json({ success: false, message: 'Nombre y apellido son obligatorios.' });
    }

    // Si intenta cambiar contrasena
    if (nuevaContrasena) {
      const resUser = await pool.query('SELECT password_hash FROM users WHERE id = $1', [usuarioId]);
      const user = resUser.rows[0];

      if (user.password_hash) {
        if (!contrasenaActual) {
          return res.status(400).json({ success: false, message: 'Debes ingresar tu contrasena actual.' });
        }
        const esValida = await bcrypt.compare(contrasenaActual, user.password_hash);
        if (!esValida) {
          return res.status(401).json({ success: false, message: 'La contrasena actual es incorrecta.' });
        }
      }

      if (nuevaContrasena.length < 6) {
        return res.status(400).json({ success: false, message: 'La nueva contrasena debe tener al menos 6 caracteres.' });
      }

      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(nuevaContrasena, salt);

      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, usuarioId]);
    }

    const resultado = await pool.query(
      `UPDATE users
       SET nombre = $1, apellido = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, nombre, apellido, correo, is_2fa_enabled, google_id, created_at`,
      [nombre.trim(), apellido.trim(), usuarioId],
    );

    return res.json({
      success: true,
      message: 'Perfil actualizado exitosamente.',
      usuario: resultado.rows[0],
    });
  } catch (error) {
    console.error('[auth-controller] Error al actualizar perfil:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar perfil.' });
  }
}

/**
 * Generar secreto TOTP y codigo QR para Google Authenticator.
 * POST /api/auth/2fa/totp/setup
 */
async function generarSecretoTOTP(req, res) {
  try {
    const usuarioId = req.usuario?.id;
    const resUser = await pool.query('SELECT correo FROM users WHERE id = $1', [usuarioId]);

    if (resUser.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const correo = resUser.rows[0].correo;
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(correo, 'AutoCare', secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Guardar secreto en la DB
    await pool.query('UPDATE users SET totp_secret = $1 WHERE id = $2', [secret, usuarioId]);

    return res.json({
      success: true,
      secret,
      qrCodeUrl,
      message: 'Escanea el codigo QR con tu aplicacion Google Authenticator o Authy.',
    });
  } catch (error) {
    console.error('[auth-controller] Error generando TOTP:', error);
    return res.status(500).json({ success: false, message: 'Error al configurar TOTP.' });
  }
}

/**
 * Verificar y activar/desactivar 2FA (TOTP / OTP).
 * POST /api/auth/2fa/toggle
 */
async function alternar2FA(req, res) {
  try {
    const usuarioId = req.usuario?.id;
    const { activar, token2FA } = req.body;

    const resUser = await pool.query('SELECT totp_secret, correo, is_2fa_enabled FROM users WHERE id = $1', [usuarioId]);
    if (resUser.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const usuario = resUser.rows[0];

    if (activar) {
      if (!token2FA) {
        return res.status(400).json({ success: false, message: 'Ingresa el codigo de 6 digitos para activar 2FA.' });
      }

      // Validar con TOTP si tiene secreto
      let esValido = false;
      if (usuario.totp_secret) {
        esValido = authenticator.verify({ token: token2FA.trim(), secret: usuario.totp_secret });
      }

      if (!esValido) {
        return res.status(400).json({ success: false, message: 'Codigo de verificacion TOTP invalido.' });
      }

      await pool.query('UPDATE users SET is_2fa_enabled = TRUE WHERE id = $1', [usuarioId]);
      return res.json({ success: true, is_2fa_enabled: true, message: 'Autenticacion en 2 Pasos (2FA) activada correctamente.' });
    } else {
      await pool.query('UPDATE users SET is_2fa_enabled = FALSE, totp_secret = NULL WHERE id = $1', [usuarioId]);
      return res.json({ success: true, is_2fa_enabled: false, message: 'Autenticacion en 2 Pasos (2FA) desactivada.' });
    }
  } catch (error) {
    console.error('[auth-controller] Error alternando 2FA:', error);
    return res.status(500).json({ success: false, message: 'Error al cambiar configuracion de 2FA.' });
  }
}

/**
 * Enviar un codigo OTP de prueba al correo SMTP del usuario.
 * POST /api/auth/2fa/send-email-otp
 */
async function enviarOtpPrueba(req, res) {
  try {
    const usuarioId = req.usuario?.id;
    const resUser = await pool.query('SELECT correo FROM users WHERE id = $1', [usuarioId]);

    if (resUser.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const correo = resUser.rows[0].correo;
    const codigoOtp = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      "UPDATE users SET otp_code = $1, otp_expires_at = CURRENT_TIMESTAMP + INTERVAL '10 minutes' WHERE id = $2",
      [codigoOtp, usuarioId],
    );

    const resultadoCorreo = await enviarCodigoOTP(correo, codigoOtp);

    if (!resultadoCorreo.success) {
      return res.status(500).json({
        success: false,
        message: `Error al enviar correo SMTP: ${resultadoCorreo.error}`,
      });
    }

    return res.json({
      success: true,
      message: `Codigo OTP de prueba enviado con exito a ${correo}.`,
    });
  } catch (error) {
    console.error('[auth-controller] Error en envio de OTP prueba:', error);
    return res.status(500).json({ success: false, message: 'Error enviando OTP por correo.' });
  }
}

/**
 * Cierre de sesion.
 * POST /api/auth/logout
 */
function cerrarSesion(_req, res) {
  return res.json({
    success: true,
    message: 'Sesion cerrada correctamente.',
  });
}

/**
 * Autenticacion mediante Google OAuth 2.0.
 * POST /api/auth/google
 */
async function autenticarConGoogle(req, res) {
  try {
    const { credential, id_token } = req.body;
    const tokenGoogle = credential || id_token;

    if (!tokenGoogle) {
      return res.status(400).json({
        success: false,
        message: 'El token de credenciales de Google es obligatorio.',
      });
    }

    const respuestaGoogle = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${tokenGoogle}`);
    if (!respuestaGoogle.ok) {
      return res.status(401).json({
        success: false,
        message: 'El token de Google no es valido o ha expirado.',
      });
    }

    const payload = await respuestaGoogle.json();
    const { sub: googleId, email, given_name, family_name, name } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo obtener el correo electronico de la cuenta de Google.',
      });
    }

    const correoLimpio = email.trim().toLowerCase();
    const nombre = given_name || name || 'Usuario';
    const apellido = family_name || 'Google';

    let resultado = await pool.query(
      'SELECT id, nombre, apellido, correo, is_2fa_enabled, google_id, created_at FROM users WHERE google_id = $1 OR LOWER(correo) = $2',
      [googleId, correoLimpio],
    );

    let usuario = null;

    if (resultado.rows.length > 0) {
      usuario = resultado.rows[0];
      if (!usuario.google_id) {
        await pool.query(
          'UPDATE users SET google_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [googleId, usuario.id],
        );
        usuario.google_id = googleId;
      }
    } else {
      const nuevo = await pool.query(
        `INSERT INTO users (nombre, apellido, correo, google_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, nombre, apellido, correo, is_2fa_enabled, google_id, created_at`,
        [nombre, apellido, correoLimpio, googleId],
      );
      usuario = nuevo.rows[0];
    }

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

    return res.json({
      success: true,
      message: 'Inicio de sesion con Google exitoso.',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        is_2fa_enabled: usuario.is_2fa_enabled,
        created_at: usuario.created_at,
      },
    });
  } catch (error) {
    console.error('[auth-controller] Error en autenticacion con Google:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar el inicio de sesion con Google.',
    });
  }
}

module.exports = {
  registrar,
  iniciarSesion,
  verificarLogin2FA,
  obtenerPerfil,
  actualizarPerfil,
  generarSecretoTOTP,
  alternar2FA,
  enviarOtpPrueba,
  cerrarSesion,
  autenticarConGoogle,
};
