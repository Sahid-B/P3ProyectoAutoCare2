// Servicio de acceso al backend de AutoCare.
// En esta parte solo se consulta el estado de la API.
const URL_API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Realiza una peticion al backend y devuelve la respuesta en formato JSON.
 */
export async function peticion(ruta, opciones = {}) {
  const respuesta = await fetch(`${URL_API}${ruta}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
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

export default { peticion, obtenerEstadoApi, URL_API };
