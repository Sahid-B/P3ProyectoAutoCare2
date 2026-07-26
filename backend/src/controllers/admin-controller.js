const { pool } = require('../config/database');

/**
 * Obtiene las estadisticas globales del sistema.
 * GET /api/admin/stats
 */
async function getStats(req, res) {
  try {
    const usuariosRes = await pool.query("SELECT COUNT(*) FROM users WHERE rol = 'user'");
    const talleresRes = await pool.query("SELECT COUNT(*) FROM users WHERE rol = 'taller'");
    const vehiculosRes = await pool.query('SELECT COUNT(*) FROM vehicles');
    const mantenimientosRes = await pool.query('SELECT COUNT(*) FROM maintenances');

    return res.json({
      success: true,
      stats: {
        totalUsuarios: parseInt(usuariosRes.rows[0].count, 10),
        totalTalleres: parseInt(talleresRes.rows[0].count, 10),
        totalVehiculos: parseInt(vehiculosRes.rows[0].count, 10),
        totalMantenimientos: parseInt(mantenimientosRes.rows[0].count, 10),
      }
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
async function getUsers(req, res) {
  try {
    const query = `
      SELECT u.id, u.nombre, u.apellido, u.correo, u.rol, u.is_active, u.created_at, COUNT(v.id) AS vehiculos
      FROM users u
      LEFT JOIN vehicles v ON u.id = v.usuario_id
      WHERE u.rol != 'admin'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
    const resultado = await pool.query(query);

    return res.json({
      success: true,
      users: resultado.rows
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

    const userRes = await pool.query("SELECT is_active, rol FROM users WHERE id = $1", [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (userRes.rows[0].rol === 'admin') {
      return res.status(400).json({ success: false, message: 'No se puede modificar el estado de un administrador' });
    }

    const newStatus = !userRes.rows[0].is_active;

    await pool.query("UPDATE users SET is_active = $1 WHERE id = $2", [newStatus, id]);

    return res.json({
      success: true,
      message: newStatus ? 'Usuario desbloqueado exitosamente' : 'Usuario bloqueado exitosamente',
      is_active: newStatus
    });
  } catch (error) {
    console.error('[admin-controller] Error al cambiar estado de usuario:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar estado del usuario' });
  }
}

module.exports = {
  getStats,
  getUsers,
  toggleUserStatus,
};
