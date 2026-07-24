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
 * Obtener perfil del usuario autenticado.
 */
export function obtenerPerfil() {
  return peticion('/auth/me');
}

/**
 * Cerrar sesion.
 */
export function cerrarSesion() {
  return peticion('/auth/logout', {
    method: 'POST',
  });
}

export default {
  peticion,
  obtenerEstadoApi,
  registrarUsuario,
  iniciarSesion,
  obtenerPerfil,
  cerrarSesion,
  URL_API,
};

