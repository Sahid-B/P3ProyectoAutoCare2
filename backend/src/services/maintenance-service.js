const { pool } = require('../config/database');

// Capa de acceso a datos para mantenimientos.
// Todas las consultas garantizan propiedad del recurso mediante JOIN con vehiculos (usuario_id).

const COLUMNAS_SELECT = `
  m.id, m.vehicle_id, m.maintenance_type, m.date, m.kilometers, m.cost,
  m.workshop, m.description, m.next_date, m.next_kilometers, m.created_at, m.updated_at,
  v.marca AS vehicle_marca, v.modelo AS vehicle_modelo, v.placa AS vehicle_placa,
  v.kilometraje_actual AS vehicle_kilometraje_actual
`;

/** Lista todos los mantenimientos de los vehiculos del usuario (ordenados por fecha descendente). */
async function listarPorUsuario(usuarioId, vehicleId = null, esAdmin = false) {
  let query = `
    SELECT ${COLUMNAS_SELECT}
    FROM maintenances m
    JOIN vehiculos v ON m.vehicle_id = v.id
  `;
  const params = [];

  if (esAdmin) {
    if (vehicleId) {
      query += ` WHERE m.vehicle_id = $1`;
      params.push(vehicleId);
    }
  } else {
    query += ` WHERE v.usuario_id = $1`;
    params.push(usuarioId);
    if (vehicleId) {
      query += ` AND m.vehicle_id = $2`;
      params.push(vehicleId);
    }
  }

  query += ` ORDER BY m.date DESC, m.created_at DESC`;

  const { rows } = await pool.query(query, params);
  return rows;
}

/** Obtiene un mantenimiento especifico por ID garantizando que pertenezca a un vehiculo del usuario. */
async function obtenerPorId(id, usuarioId, esAdmin = false) {
  let query = `SELECT ${COLUMNAS_SELECT}
     FROM maintenances m
     JOIN vehiculos v ON m.vehicle_id = v.id
     WHERE m.id = $1`;
  const params = [id];

  if (!esAdmin) {
    query += ` AND v.usuario_id = $2`;
    params.push(usuarioId);
  }

  const { rows } = await pool.query(query, params);
  return rows[0] || null;
}

/** Verifica si un vehiculo pertenece al usuario autenticado. */
async function verificarVehiculoPerteneceAUsuario(vehicleId, usuarioId) {
  const { rows } = await pool.query(
    `SELECT id FROM vehiculos WHERE id = $1 AND usuario_id = $2`,
    [vehicleId, usuarioId],
  );
  return rows.length > 0;
}

/** Crea un nuevo mantenimiento. */
async function crear(usuarioId, datos) {
  // 1. Verificar propiedad del vehiculo
  const vehiculoValido = await verificarVehiculoPerteneceAUsuario(datos.vehicle_id, usuarioId);
  if (!vehiculoValido) {
    throw new Error('El vehiculo no pertenece al usuario autenticado.');
  }

  // 2. Insertar mantenimiento
  const { rows } = await pool.query(
    `INSERT INTO maintenances
       (vehicle_id, maintenance_type, date, kilometers, cost, workshop, description, next_date, next_kilometers)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      datos.vehicle_id,
      datos.maintenance_type,
      datos.date,
      datos.kilometers,
      datos.cost,
      datos.workshop || null,
      datos.description || null,
      datos.next_date || null,
      datos.next_kilometers || null,
    ],
  );

  // 3. Si el kilometraje del mantenimiento es superior al kilometraje actual del vehiculo, actualizar el vehiculo
  if (datos.kilometers) {
    await pool.query(
      `UPDATE vehiculos
       SET kilometraje_actual = GREATEST(kilometraje_actual, $1), updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND usuario_id = $3`,
      [datos.kilometers, datos.vehicle_id, usuarioId],
    );
  }

  return obtenerPorId(rows[0].id, usuarioId);
}

/** Actualiza un mantenimiento existente. */
async function actualizar(id, usuarioId, datos) {
  // 1. Verificar que el mantenimiento exista y pertenezca al usuario
  const existente = await obtenerPorId(id, usuarioId);
  if (!existente) return null;

  // 2. Si se cambia el vehicle_id, verificar que el nuevo vehiculo tambien pertenezca al usuario
  if (datos.vehicle_id && datos.vehicle_id !== existente.vehicle_id) {
    const vehiculoValido = await verificarVehiculoPerteneceAUsuario(datos.vehicle_id, usuarioId);
    if (!vehiculoValido) {
      throw new Error('El vehiculo destino no pertenece al usuario autenticado.');
    }
  }

  const targetVehicleId = datos.vehicle_id || existente.vehicle_id;

  const { rows } = await pool.query(
    `UPDATE maintenances SET
       vehicle_id = $1, maintenance_type = $2, date = $3, kilometers = $4,
       cost = $5, workshop = $6, description = $7, next_date = $8, next_kilometers = $9,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $10
     RETURNING id`,
    [
      targetVehicleId,
      datos.maintenance_type,
      datos.date,
      datos.kilometers,
      datos.cost,
      datos.workshop || null,
      datos.description || null,
      datos.next_date || null,
      datos.next_kilometers || null,
      id,
    ],
  );

  if (rows.length === 0) return null;

  // Actualizar kilometraje del vehiculo si corresponde
  if (datos.kilometers) {
    await pool.query(
      `UPDATE vehiculos
       SET kilometraje_actual = GREATEST(kilometraje_actual, $1), updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND usuario_id = $3`,
      [datos.kilometers, targetVehicleId, usuarioId],
    );
  }

  return obtenerPorId(id, usuarioId);
}

/** Elimina un mantenimiento. */
async function eliminar(id, usuarioId) {
  // Verificar propiedad antes de eliminar
  const existente = await obtenerPorId(id, usuarioId);
  if (!existente) return false;

  const { rowCount } = await pool.query(
    `DELETE FROM maintenances WHERE id = $1`,
    [id],
  );

  return rowCount > 0;
}

/** Obtiene estadisticas de mantenimientos para el Dashboard. */
async function obtenerEstadisticas(usuarioId, esAdmin = false) {
  let query = `
    SELECT
       COALESCE(SUM(cost), 0)::numeric AS gasto_total,
       COALESCE(SUM(CASE WHEN date >= date_trunc('month', CURRENT_DATE) THEN cost ELSE 0 END), 0)::numeric AS gasto_mes,
       COUNT(*)::int AS total_mantenimientos
     FROM maintenances m
     JOIN vehiculos v ON m.vehicle_id = v.id
  `;
  const params = [];

  if (!esAdmin) {
    query += ` WHERE v.usuario_id = $1`;
    params.push(usuarioId);
  }

  const { rows } = await pool.query(query, params);
}

module.exports = {
  listarPorUsuario,
  obtenerPorId,
  verificarVehiculoPerteneceAUsuario,
  crear,
  actualizar,
  eliminar,
  obtenerEstadisticas,
};
