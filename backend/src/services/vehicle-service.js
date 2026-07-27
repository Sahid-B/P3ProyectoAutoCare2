const { pool } = require('../config/database');

// Capa de acceso a datos de vehiculos.
// Todas las consultas usan parametros ($1, $2, ...) para evitar inyeccion SQL,
// y siempre filtran por usuario_id para garantizar la propiedad del recurso.

const COLUMNAS = `id, usuario_id, marca, modelo, anio, placa, color, tipo_vehiculo,
  kilometraje_actual, imagen_url, observaciones, created_at, updated_at`;

/** Lista los vehiculos de un usuario (mas recientes primero). */
async function listarPorUsuario(usuarioId, esAdmin = false) {
  if (esAdmin) {
    const { rows } = await pool.query(
      `SELECT ${COLUMNAS} FROM vehiculos ORDER BY created_at DESC`
    );
    return rows;
  }
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM vehiculos WHERE usuario_id = $1 ORDER BY created_at DESC`,
    [usuarioId],
  );
  return rows;
}

/** Obtiene un vehiculo por id, solo si pertenece al usuario. */
async function obtenerPorId(id, usuarioId, esAdmin = false) {
  if (esAdmin) {
    const { rows } = await pool.query(
      `SELECT ${COLUMNAS} FROM vehiculos WHERE id = $1`,
      [id],
    );
    return rows[0] || null;
  }
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM vehiculos WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId],
  );
  return rows[0] || null;
}

/** Cuenta cuantos vehiculos tiene un usuario. */
async function contarPorUsuario(usuarioId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS total FROM vehiculos WHERE usuario_id = $1',
    [usuarioId],
  );
  return rows[0].total;
}

/** Crea un vehiculo asociado al usuario. */
async function crear(usuarioId, datos) {
  const { rows } = await pool.query(
    `INSERT INTO vehiculos
       (usuario_id, marca, modelo, anio, placa, color, tipo_vehiculo,
        kilometraje_actual, imagen_url, observaciones)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING ${COLUMNAS}`,
    [
      usuarioId,
      datos.marca,
      datos.modelo,
      datos.anio,
      datos.placa,
      datos.color,
      datos.tipo_vehiculo,
      datos.kilometraje_actual,
      datos.imagen_url,
      datos.observaciones,
    ],
  );
  return rows[0];
}

/** Actualiza un vehiculo, solo si pertenece al usuario. */
async function actualizar(id, usuarioId, datos) {
  const { rows } = await pool.query(
    `UPDATE vehiculos SET
       marca = $1, modelo = $2, anio = $3, placa = $4, color = $5,
       tipo_vehiculo = $6, kilometraje_actual = $7, imagen_url = $8,
       observaciones = $9, updated_at = CURRENT_TIMESTAMP
     WHERE id = $10 AND usuario_id = $11
     RETURNING ${COLUMNAS}`,
    [
      datos.marca,
      datos.modelo,
      datos.anio,
      datos.placa,
      datos.color,
      datos.tipo_vehiculo,
      datos.kilometraje_actual,
      datos.imagen_url,
      datos.observaciones,
      id,
      usuarioId,
    ],
  );
  return rows[0] || null;
}

/** Actualiza solamente el kilometraje, solo si pertenece al usuario. */
async function actualizarKilometraje(id, usuarioId, kilometraje) {
  const { rows } = await pool.query(
    `UPDATE vehiculos SET kilometraje_actual = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND usuario_id = $3
     RETURNING ${COLUMNAS}`,
    [kilometraje, id, usuarioId],
  );
  return rows[0] || null;
}

/** Elimina un vehiculo, solo si pertenece al usuario. */
async function eliminar(id, usuarioId) {
  const { rowCount } = await pool.query(
    'DELETE FROM vehiculos WHERE id = $1 AND usuario_id = $2',
    [id, usuarioId],
  );
  return rowCount > 0;
}

module.exports = {
  listarPorUsuario,
  obtenerPorId,
  contarPorUsuario,
  crear,
  actualizar,
  actualizarKilometraje,
  eliminar,
};
