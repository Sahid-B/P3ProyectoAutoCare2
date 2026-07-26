const { pool } = require('../config/database');

async function listarTodos() {
  const result = await pool.query(`
    SELECT t.id, t.nombre_taller, t.direccion, t.telefono, t.latitud, t.longitud, t.calificacion,
           u.nombre as propietario_nombre, u.apellido as propietario_apellido, u.correo
    FROM talleres t
    JOIN users u ON t.usuario_id = u.id
    WHERE u.is_active = TRUE
    ORDER BY t.calificacion DESC, t.created_at DESC
  `);
  return result.rows;
}

async function obtenerMiTaller(usuarioId) {
  const result = await pool.query(
    'SELECT id, nombre_taller, direccion, telefono, latitud, longitud, calificacion FROM talleres WHERE usuario_id = $1',
    [usuarioId]
  );
  return result.rows[0] || null;
}

async function actualizarMiTaller(usuarioId, datos) {
  const { nombre_taller, direccion, telefono, latitud, longitud } = datos;
  const result = await pool.query(
    `UPDATE talleres 
     SET nombre_taller = $1, direccion = $2, telefono = $3, latitud = $4, longitud = $5, updated_at = CURRENT_TIMESTAMP
     WHERE usuario_id = $6
     RETURNING *`,
    [nombre_taller.trim(), direccion.trim(), telefono?.trim() || null, latitud, longitud, usuarioId]
  );
  return result.rows[0];
}

module.exports = {
  listarTodos,
  obtenerMiTaller,
  actualizarMiTaller,
};
