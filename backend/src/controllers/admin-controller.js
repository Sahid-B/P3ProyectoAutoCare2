const { pool } = require('../config/database');
const vendedoresService = require('../services/vendedores-service');
const productosService = require('../services/productos-service');
const { ESTADOS_TIENDA } = require('../constants/repuestos');

/**
 * Obtiene las estadisticas globales del sistema.
 * GET /api/admin/stats
 *
 * Nota: la tabla de vehiculos se llama "vehiculos" (no "vehicles") y el rol de
 * cliente es 'usuario'. Ambos nombres estaban equivocados en la version previa,
 * por lo que la consulta fallaba y el panel mostraba todo en cero.
 */
async function getStats(_req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE rol <> 'admin') AS total_usuarios,
        (SELECT COUNT(*) FROM users WHERE rol = 'usuario') AS total_clientes,
        (SELECT COUNT(*) FROM users WHERE rol = 'taller') AS total_talleres,
        (SELECT COUNT(*) FROM users WHERE rol = 'vendedor_repuestos') AS total_vendedores,
        (SELECT COUNT(*) FROM vehiculos) AS total_vehiculos,
        (SELECT COUNT(*) FROM productos) AS total_productos,
        (SELECT COUNT(*) FROM maintenances) AS total_mantenimientos,
        (SELECT COUNT(*) FROM compras) AS total_compras,
        (SELECT COALESCE(SUM(total), 0) FROM compras WHERE estado_pago = 'pagado') AS ingresos_repuestos
    `);

    const fila = rows[0];

    return res.json({
      success: true,
      stats: {
        totalUsuarios: Number(fila.total_usuarios),
        totalClientes: Number(fila.total_clientes),
        totalTalleres: Number(fila.total_talleres),
        totalVendedores: Number(fila.total_vendedores),
        totalVehiculos: Number(fila.total_vehiculos),
        totalProductos: Number(fila.total_productos),
        totalMantenimientos: Number(fila.total_mantenimientos),
        totalCompras: Number(fila.total_compras),
        ingresosRepuestos: Number(fila.ingresos_repuestos),
      },
    });
  } catch (error) {
    console.error('[admin-controller] Error al obtener estadisticas:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener estadisticas' });
  }
}

/**
 * Obtiene la lista de todos los usuarios registrados (excluyendo admins).
 * GET /api/admin/users
 */
async function getUsers(_req, res) {
  try {
    const query = `
      SELECT u.id, u.nombre, u.apellido, u.correo, u.rol, u.is_active, u.created_at,
             COUNT(v.id) AS vehiculos
      FROM users u
      LEFT JOIN vehiculos v ON u.id = v.usuario_id
      WHERE u.rol <> 'admin'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
    const resultado = await pool.query(query);

    return res.json({
      success: true,
      users: resultado.rows,
    });
  } catch (error) {
    console.error('[admin-controller] Error al obtener usuarios:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
}

/**
 * Bloquea o desbloquea a un usuario.
 * POST /api/admin/users/:id/toggle-status
 */
async function toggleUserStatus(req, res) {
  try {
    const { id } = req.params;

    const userRes = await pool.query('SELECT is_active, rol FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (userRes.rows[0].rol === 'admin') {
      return res.status(400).json({ success: false, message: 'No se puede modificar el estado de un administrador' });
    }

    const newStatus = !userRes.rows[0].is_active;

    await pool.query('UPDATE users SET is_active = $1 WHERE id = $2', [newStatus, id]);

    return res.json({
      success: true,
      message: newStatus ? 'Usuario desbloqueado exitosamente' : 'Usuario bloqueado exitosamente',
      is_active: newStatus,
    });
  } catch (error) {
    console.error('[admin-controller] Error al cambiar estado de usuario:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar estado del usuario' });
  }
}

/**
 * Lista las tiendas de repuestos registradas.
 * GET /api/admin/vendedores
 */
async function getVendedores(_req, res) {
  try {
    const vendedores = await vendedoresService.listarParaAdmin();
    return res.json({ success: true, vendedores });
  } catch (error) {
    console.error('[admin-controller] Error al obtener vendedores:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener los vendedores' });
  }
}

/**
 * Activa o desactiva una tienda de repuestos.
 * POST /api/admin/vendedores/:id/estado
 */
async function cambiarEstadoVendedor(req, res) {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Identificador de tienda invalido' });
    }
    if (!estado || !ESTADOS_TIENDA.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `El estado debe ser uno de: ${ESTADOS_TIENDA.join(', ')}.`,
      });
    }

    const tienda = await vendedoresService.cambiarEstado(id, estado);

    if (!tienda) {
      return res.status(404).json({ success: false, message: 'Tienda no encontrada' });
    }

    return res.json({
      success: true,
      message: estado === 'activo' ? 'Tienda activada exitosamente' : 'Tienda desactivada exitosamente',
      tienda,
    });
  } catch (error) {
    console.error('[admin-controller] Error al cambiar estado de la tienda:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar la tienda' });
  }
}

/**
 * Productos de una tienda concreta.
 * GET /api/admin/vendedores/:id/productos
 */
async function getProductosDeVendedor(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Identificador de tienda invalido' });
    }

    const productos = await productosService.listarPorVendedorParaAdmin(id);
    return res.json({ success: true, productos });
  } catch (error) {
    console.error('[admin-controller] Error al obtener productos de la tienda:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener los productos' });
  }
}

/**
 * Todas las compras de repuestos realizadas en la plataforma.
 * GET /api/admin/compras
 */
async function getCompras(_req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.total, c.metodo_pago, c.estado_pago, c.transaccion_id, c.fecha_pago,
             c.estado_pedido, c.created_at,
             u.nombre AS cliente_nombre, u.apellido AS cliente_apellido, u.correo AS cliente_correo,
             v.nombre_local,
             COUNT(d.id) AS total_items
      FROM compras c
      JOIN users u ON c.cliente_id = u.id
      JOIN vendedores_repuestos v ON c.vendedor_id = v.id
      LEFT JOIN compra_detalles d ON d.compra_id = c.id
      GROUP BY c.id, u.id, v.id
      ORDER BY c.created_at DESC
    `);

    return res.json({ success: true, compras: rows });
  } catch (error) {
    console.error('[admin-controller] Error al obtener compras:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener las compras' });
  }
}

module.exports = {
  getStats,
  getUsers,
  toggleUserStatus,
  getVendedores,
  cambiarEstadoVendedor,
  getProductosDeVendedor,
  getCompras,
};
