const talleresService = require('../services/talleres-service');
const vendedoresService = require('../services/vendedores-service');

/**
 * Ubicaciones para el mapa del cliente: talleres mecanicos y tiendas de repuestos.
 * Cada elemento incluye su "tipo" para que el frontend pinte el marcador azul
 * (taller) o rojo (tienda).
 * GET /api/mapa/ubicaciones
 */
async function listarUbicaciones(_req, res) {
  try {
    const [talleres, tiendas] = await Promise.all([
      talleresService.listarParaMapa(),
      vendedoresService.listarPublicas(),
    ]);

    return res.json({
      success: true,
      talleres: talleres.map((taller) => ({
        tipo: 'taller',
        id: taller.id,
        nombre: taller.nombre_taller,
        direccion: taller.direccion,
        telefono: taller.telefono,
        horario: taller.horario,
        latitud: Number(taller.latitud),
        longitud: Number(taller.longitud),
        calificacion: taller.calificacion,
        correo: taller.correo,
      })),
      tiendas: tiendas.map((tienda) => ({
        tipo: 'tienda',
        id: tienda.id,
        nombre: tienda.nombre_local,
        descripcion: tienda.descripcion,
        direccion: tienda.direccion,
        telefono: tienda.telefono,
        horario: tienda.horario,
        latitud: Number(tienda.latitud),
        longitud: Number(tienda.longitud),
        totalProductos: Number(tienda.total_productos),
        correo: tienda.correo,
      })),
    });
  } catch (error) {
    console.error('[mapa-controller] Error al obtener ubicaciones:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener las ubicaciones.' });
  }
}

module.exports = { listarUbicaciones };
