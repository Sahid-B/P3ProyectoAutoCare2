const { pool } = require('../config/database');

async function listarTodos() {
  const result = await pool.query(`
    SELECT t.id, t.nombre_taller, t.direccion, t.telefono, t.horario, t.descripcion,
           t.latitud, t.longitud, t.calificacion,
           u.nombre as propietario_nombre, u.apellido as propietario_apellido, u.correo
    FROM talleres t
    JOIN users u ON t.usuario_id = u.id
    WHERE u.is_active = TRUE AND t.estado = 'activo'
    ORDER BY t.calificacion DESC, t.created_at DESC
  `);
  return result.rows;
}

async function obtenerMiTaller(usuarioId) {
  const result = await pool.query(
    `SELECT id, nombre_taller, direccion, telefono, horario, descripcion,
            latitud, longitud, calificacion, estado
     FROM talleres WHERE usuario_id = $1`,
    [usuarioId]
  );
  return result.rows[0] || null;
}

async function actualizarMiTaller(usuarioId, datos) {
  const { nombre_taller, direccion, telefono, horario, descripcion, latitud, longitud } = datos;
  const result = await pool.query(
    `UPDATE talleres
     SET nombre_taller = $1, direccion = $2, telefono = $3, horario = $4, descripcion = $5,
         latitud = $6, longitud = $7, updated_at = CURRENT_TIMESTAMP
     WHERE usuario_id = $8
     RETURNING *`,
    [
      nombre_taller.trim(),
      direccion.trim(),
      telefono?.trim() || null,
      horario?.trim() || null,
      descripcion?.trim() || null,
      latitud,
      longitud,
      usuarioId,
    ]
  );
  return result.rows[0];
}

/**
 * Talleres activos con los datos que necesita el marcador del mapa.
 */
async function listarParaMapa() {
  const result = await pool.query(`
    SELECT t.id, t.nombre_taller, t.direccion, t.telefono, t.horario, t.latitud, t.longitud,
           t.calificacion, u.correo
    FROM talleres t
    JOIN users u ON t.usuario_id = u.id
    WHERE u.is_active = TRUE AND t.estado = 'activo'
    ORDER BY t.nombre_taller ASC
  `);
  return result.rows;
}

module.exports = {
  listarTodos,
  obtenerMiTaller,
  actualizarMiTaller,
  listarParaMapa,
};
