// Servicio de acceso al backend de AutoCare.
const URL_API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Realiza una peticion al backend y devuelve la respuesta en formato JSON.
 * Incluye automaticamente el token JWT si existe en localStorage.
 */
export async function peticion(ruta, opciones = {}) {
  const token = localStorage.getItem('autocare_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opciones.headers || {}),
  };

  const respuesta = await fetch(`${URL_API}${ruta}`, {
    ...opciones,
    headers,
  });

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const mensaje = datos?.message || `Error ${respuesta.status} al consultar ${ruta}`;
    throw new Error(mensaje);
  }

  return datos;
}

/**
 * Consulta GET /api/health para conocer el estado de la API y de PostgreSQL.
 */
export function obtenerEstadoApi() {
  return peticion('/health');
}

/**
 * Registro de nuevo usuario.
 */
export function registrarUsuario(datos) {
  return peticion('/auth/register', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

/**
 * Inicio de sesion.
 */
export function iniciarSesion(datos) {
  return peticion('/auth/login', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

/**
 * Verificacion de codigo 2FA (TOTP o OTP) durante el login.
 */
export function verificarLogin2FA(datos2FA) {
  return peticion('/auth/2fa/verify-login', {
    method: 'POST',
    body: JSON.stringify(datos2FA),
  });
}

/**
 * Obtener perfil del usuario autenticado.
 */
export function obtenerPerfil() {
  return peticion('/auth/me');
}

/**
 * Actualizar datos del perfil (nombre, apellido, contrasena).
 */
export function actualizarPerfil(datos) {
  return peticion('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
}

/**
 * Generar secreto y QR Code para Google Authenticator / TOTP.
 */
export function configurarTOTP() {
  return peticion('/auth/2fa/totp/setup', {
    method: 'POST',
  });
}

/**
 * Activar o desactivar 2FA.
 */
export function alternar2FA(datos) {
  return peticion('/auth/2fa/toggle', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

/**
 * Enviar codigo OTP de prueba por correo SMTP.
 */
export function enviarOtpPrueba() {
  return peticion('/auth/2fa/send-email-otp', {
    method: 'POST',
  });
}

/**
 * Cerrar sesion.
 */
export function cerrarSesion() {
  return peticion('/auth/logout', {
    method: 'POST',
  });
}

/**
 * Inicio de sesion / Registro con Google OAuth 2.0.
 */
export function autenticarConGoogle(datosGoogle) {
  return peticion('/auth/google', {
    method: 'POST',
    body: JSON.stringify(datosGoogle),
  });
}

export default {
  peticion,
  obtenerEstadoApi,
  registrarUsuario,
  iniciarSesion,
  verificarLogin2FA,
  obtenerPerfil,
  actualizarPerfil,
  configurarTOTP,
  alternar2FA,
  enviarOtpPrueba,
  cerrarSesion,
  autenticarConGoogle,
  URL_API,
};
