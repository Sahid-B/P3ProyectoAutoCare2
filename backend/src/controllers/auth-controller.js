const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const { OAuth2Client } = require('google-auth-library');
const { pool } = require('../config/database');
const { enviarCodigoOTP, smtpConfigurado } = require('../services/email-service');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/auth-config');
const { crearTienda, validarDatosTienda } = require('../services/vendedores-service');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Roles que un visitante puede elegir en el formulario de registro.
// El rol 'admin' nunca se puede solicitar desde el registro publico.
const ROLES_REGISTRABLES = ['taller', 'vendedor_repuestos'];

// Cliente de Google OAuth 2.0. El frontend (Google Identity Services) entrega un
// ID token que aqui se verifica (firma, aud, iss, exp) con la libreria oficial.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

function generarCodigoOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function guardarYEnviarCodigoVerificacion(usuario) {
  if (!smtpConfigurado()) {
    return {
      success: false,
      status: 503,
      message: 'El envio de correo (SMTP) no esta configurado en el servidor.',
    };
  }

  const codigoOtp = generarCodigoOtp();
  await pool.query(
    "UPDATE users SET otp_code = $1, otp_expires_at = CURRENT_TIMESTAMP + INTERVAL '10 minutes' WHERE id = $2",
    [codigoOtp, usuario.id],
  );

  const resultadoCorreo = await enviarCodigoOTP(usuario.correo, codigoOtp);
  if (!resultadoCorreo.success) {
    console.error('[auth-controller] No se pudo enviar el correo de verificacion:', resultadoCorreo.error);
    return {
      success: false,
      status: 502,
      message: 'No se pudo enviar el correo de verificacion. Revisa la configuracion SMTP.',
    };
  }

  return { success: true };
}

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

    if (!smtpConfigurado()) {
      console.error('[auth-controller] SMTP no configurado, no se puede enviar el codigo de verificacion.');
      return res.status(503).json({
        success: false,
        message: 'SMTP no configurado. No se puede enviar el codigo de verificacion por correo.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(claveAcceso, salt);
    
    const client = await pool.connect();
    let usuario;

    try {
      await client.query('BEGIN');
      const rolSeleccionado = ROLES_REGISTRABLES.includes(req.body.rol) ? req.body.rol : 'usuario';
      const nuevoUsuario = await client.query(
        `INSERT INTO users (nombre, apellido, correo, password_hash, email_verified, rol)
         VALUES ($1, $2, $3, $4, FALSE, $5)
         RETURNING id, nombre, apellido, correo, email_verified, is_2fa_enabled, google_id, created_at, rol, is_active`,
        [nombre.trim(), apellido.trim(), correoLimpio, passwordHash, rolSeleccionado],
      );

      usuario = nuevoUsuario.rows[0];

      if (rolSeleccionado === 'taller' && req.body.taller_datos) {
        const { nombre_taller, direccion, telefono, horario, latitud, longitud } = req.body.taller_datos;
        if (!nombre_taller || !direccion || latitud === undefined || longitud === undefined) {
          throw new Error('Faltan datos del taller.');
        }
        await client.query(
          `INSERT INTO talleres (usuario_id, nombre_taller, direccion, telefono, horario, latitud, longitud)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            usuario.id,
            nombre_taller.trim(),
            direccion.trim(),
            telefono?.trim() || null,
            horario?.trim() || null,
            latitud,
            longitud,
          ]
        );
      }

      // Tienda de repuestos: los datos del local son obligatorios en este rol.
      if (rolSeleccionado === 'vendedor_repuestos') {
        const datosTienda = req.body.tienda_datos;
        if (!datosTienda) {
          throw new Error('Faltan datos de la tienda.');
        }

        const mensajeTienda = validarDatosTienda(datosTienda);
        if (mensajeTienda) {
          throw new Error(mensajeTienda);
        }

        await crearTienda(client, usuario.id, datosTienda);
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('[auth-controller] Error en la transaccion de registro:', e);
      const esErrorDeDatos = /taller|tienda|ubicacion|local|direccion|latitud|longitud/i.test(e.message || '');
      return res.status(400).json({
        success: false,
        message: esErrorDeDatos ? e.message : 'Error al registrar el usuario.',
      });
    } finally {
      client.release();
    }

    const resultadoVerificacion = await guardarYEnviarCodigoVerificacion(usuario);
    if (!resultadoVerificacion.success) {
      return res.status(resultadoVerificacion.status).json({
        success: false,
        message: resultadoVerificacion.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente. Se envio un codigo de verificacion a tu correo.',
      requiereVerificacion: true,
      userId: usuario.id,
      correo: usuario.correo,
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
      'SELECT id, nombre, apellido, correo, password_hash, email_verified, is_2fa_enabled, totp_secret, created_at, rol, is_active FROM users WHERE LOWER(correo) = $1',
      [correoLimpio],
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales invalidas.',
      });
    }

    const usuario = resultado.rows[0];
    
    if (usuario.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta ha sido suspendida. Contacta a un administrador.',
      });
    }

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

    if (!usuario.email_verified) {
      const resultadoVerificacion = await guardarYEnviarCodigoVerificacion(usuario);
      if (!resultadoVerificacion.success) {
        return res.status(resultadoVerificacion.status).json({
          success: false,
          message: resultadoVerificacion.message,
        });
      }

      return res.json({
        success: true,
        requiereVerificacion: true,
        userId: usuario.id,
        correo: usuario.correo,
        message: 'Debes verificar tu correo antes de ingresar. Enviamos un nuevo codigo de verificacion.',
      });
    }

    // Verificar si el usuario tiene 2FA activado
    if (usuario.is_2fa_enabled) {
      // Generar codigo OTP por correo por defecto si no utiliza TOTP exclusivamente
      const codigoOtp = generarCodigoOtp();
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
        rol: usuario.rol,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
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
      'SELECT id, nombre, apellido, correo, email_verified, is_2fa_enabled, totp_secret, otp_code, otp_expires_at, rol, is_active FROM users WHERE id = $1',
      [userId],
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.',
      });
    }

    const usuario = resultado.rows[0];
    
    if (usuario.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta ha sido suspendida. Contacta a un administrador.',
      });
    }
    
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

    // Marcar el correo como verificado y limpiar el OTP despues de usarlo.
    await pool.query(
      'UPDATE users SET email_verified = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE id = $1',
      [usuario.id],
    );

    // Generar token JWT final
    const token = jwt.sign(
      {
        id: usuario.id,
        correo: usuario.correo,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
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
        email_verified: true,
        is_2fa_enabled: usuario.is_2fa_enabled,
        rol: usuario.rol,
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
      'SELECT id, nombre, apellido, correo, email_verified, is_2fa_enabled, google_id, created_at, rol, is_active FROM users WHERE id = $1',
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
       RETURNING id, nombre, apellido, correo, email_verified, is_2fa_enabled, google_id, created_at, rol, is_active`,
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
    // Si SMTP no esta configurado, se responde de forma controlada (no 500).
    if (!smtpConfigurado()) {
      return res.status(503).json({
        success: false,
        message: 'El envio de correo (SMTP) no esta configurado en el servidor.',
      });
    }

    const usuarioId = req.usuario?.id;
    const resUser = await pool.query('SELECT correo FROM users WHERE id = $1', [usuarioId]);

    if (resUser.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const correo = resUser.rows[0].correo;
    const codigoOtp = generarCodigoOtp();

    await pool.query(
      "UPDATE users SET otp_code = $1, otp_expires_at = CURRENT_TIMESTAMP + INTERVAL '10 minutes' WHERE id = $2",
      [codigoOtp, usuarioId],
    );

    const resultadoCorreo = await enviarCodigoOTP(correo, codigoOtp);

    if (!resultadoCorreo.success) {
      return res.status(502).json({
        success: false,
        message: 'No se pudo enviar el correo de verificacion. Revisa la configuracion SMTP.',
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

    if (!googleClient) {
      return res.status(503).json({
        success: false,
        message: 'El inicio de sesion con Google no esta configurado en el servidor.',
      });
    }

    // Verificacion oficial del ID token: valida firma, aud (GOOGLE_CLIENT_ID),
    // iss y exp. Lanza excepcion si el token no es valido o Google no responde.
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: tokenGoogle,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (errorVerificacion) {
      const detalle = String(errorVerificacion?.message || '');
      // Si el problema es de red (no se pudo contactar a Google), 503; si no, 401.
      const esRed = /network|fetch failed|ENOTFOUND|EAI_AGAIN|getaddrinfo|timeout|certificate|self-signed/i.test(detalle);
      return res.status(esRed ? 503 : 401).json({
        success: false,
        message: esRed
          ? 'No se pudo contactar con Google para verificar el token. Intenta mas tarde.'
          : 'El token de Google no es valido o ha expirado.',
      });
    }

    const { sub: googleId, email, email_verified: googleEmailVerified, given_name, family_name, name } = payload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo obtener el correo electronico de la cuenta de Google.',
      });
    }

    if (googleEmailVerified === false) {
      return res.status(401).json({
        success: false,
        message: 'El correo de la cuenta de Google no esta verificado.',
      });
    }

    const correoLimpio = email.trim().toLowerCase();
    const nombre = given_name || name || 'Usuario';
    const apellido = family_name || 'Google';

    let resultado = await pool.query(
      'SELECT id, nombre, apellido, correo, email_verified, is_2fa_enabled, google_id, created_at, rol, is_active FROM users WHERE google_id = $1 OR LOWER(correo) = $2',
      [googleId, correoLimpio],
    );

    let usuario = null;

    if (resultado.rows.length > 0) {
      usuario = resultado.rows[0];
      
      if (usuario.is_active === false) {
        return res.status(403).json({
          success: false,
          message: 'Tu cuenta ha sido suspendida. Contacta a un administrador.',
        });
      }

      if (!usuario.google_id) {
        await pool.query(
          'UPDATE users SET google_id = $1, email_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [googleId, usuario.id],
        );
        usuario.google_id = googleId;
        usuario.email_verified = true;
      } else if (!usuario.email_verified) {
        await pool.query(
          'UPDATE users SET email_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [usuario.id],
        );
        usuario.email_verified = true;
      }
    } else {
      const nuevo = await pool.query(
        `INSERT INTO users (nombre, apellido, correo, google_id, email_verified)
         VALUES ($1, $2, $3, $4, TRUE)
         RETURNING id, nombre, apellido, correo, email_verified, is_2fa_enabled, google_id, created_at, rol, is_active`,
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
        rol: usuario.rol,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
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
        email_verified: usuario.email_verified,
        is_2fa_enabled: usuario.is_2fa_enabled,
        created_at: usuario.created_at,
        rol: usuario.rol,
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
