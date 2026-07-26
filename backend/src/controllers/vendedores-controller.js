const { pool } = require('../config/database');
const vendedoresService = require('../services/vendedores-service');
const productosService = require('../services/productos-service');

const { validarDatosTienda } = vendedoresService;

/**
 * Tienda del vendedor autenticado.
 * GET /api/vendedores/mi-tienda
 */
async function obtenerMiTienda(req, res) {
  try {
    const tienda = await vendedoresService.obtenerPorUsuario(req.usuario.id);

    if (!tienda) {
      return res.status(404).json({
        success: false,
        message: 'Aun no has registrado tu tienda de repuestos.',
      });
    }

    return res.json({ success: true, tienda });
  } catch (error) {
    console.error('[vendedores-controller] Error al obtener la tienda:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener la tienda.' });
  }
}

/**
 * Crea la tienda si no existe o actualiza la existente.
 * PUT /api/vendedores/mi-tienda
 */
async function guardarMiTienda(req, res) {
  try {
    const mensajeError = validarDatosTienda(req.body);
    if (mensajeError) {
      return res.status(400).json({ success: false, message: mensajeError });
    }

    const existente = await vendedoresService.obtenerPorUsuario(req.usuario.id);

    if (!existente) {
      const cliente = await pool.connect();
      try {
        const tienda = await vendedoresService.crearTienda(cliente, req.usuario.id, req.body);
        return res.status(201).json({
          success: true,
          message: 'Tienda registrada exitosamente.',
          tienda,
        });
      } finally {
        cliente.release();
      }
    }

    const tienda = await vendedoresService.actualizarPorUsuario(req.usuario.id, req.body);
    return res.json({
      success: true,
      message: 'Tienda actualizada exitosamente.',
      tienda,
    });
  } catch (error) {
    console.error('[vendedores-controller] Error al guardar la tienda:', error);
    return res.status(500).json({ success: false, message: 'Error al guardar la tienda.' });
  }
}

/**
 * Estadisticas del panel del vendedor.
 * GET /api/vendedores/estadisticas
 */
async function obtenerEstadisticas(req, res) {
  try {
    const tienda = await vendedoresService.obtenerPorUsuario(req.usuario.id);

    if (!tienda) {
      return res.status(404).json({
        success: false,
        message: 'Aun no has registrado tu tienda de repuestos.',
      });
    }

    const estadisticas = await vendedoresService.obtenerEstadisticas(tienda.id);
    return res.json({ success: true, estadisticas, tienda });
  } catch (error) {
    console.error('[vendedores-controller] Error al obtener estadisticas:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener las estadisticas.' });
  }
}

/**
 * Tiendas activas visibles para los clientes.
 * GET /api/vendedores/publicos
 */
async function listarPublicas(_req, res) {
  try {
    const tiendas = await vendedoresService.listarPublicas();
    return res.json({ success: true, data: tiendas });
  } catch (error) {
    console.error('[vendedores-controller] Error al listar tiendas:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener las tiendas.' });
  }
}

/**
 * Detalle publico de una tienda junto a su catalogo.
 * GET /api/vendedores/:id/publico
 */
async function obtenerTiendaPublica(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Identificador de tienda invalido.' });
    }

    const tienda = await vendedoresService.obtenerPorId(id);

    if (!tienda || tienda.estado !== 'activo') {
      return res.status(404).json({ success: false, message: 'Tienda no encontrada.' });
    }

    const productos = await productosService.listarCatalogo({ vendedorId: id });

    return res.json({ success: true, tienda, productos });
  } catch (error) {
    console.error('[vendedores-controller] Error al obtener la tienda publica:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener la tienda.' });
  }
}

module.exports = {
  obtenerMiTienda,
  guardarMiTienda,
  obtenerEstadisticas,
  listarPublicas,
  obtenerTiendaPublica,
};
