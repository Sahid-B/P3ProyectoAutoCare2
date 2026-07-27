const { pool } = require('../config/database');

async function listarParaUsuario(usuarioId, rol) {
  if (rol === 'taller') {
    // 1. Obtener el taller_id correspondiente al usuario_id del taller
    const tallerRes = await pool.query('SELECT id FROM talleres WHERE usuario_id = $1', [usuarioId]);
    if (tallerRes.rows.length === 0) return [];
    const tallerId = tallerRes.rows[0].id;

    // 2. Listar citas de ese taller
    const { rows } = await pool.query(
      `SELECT c.id, c.fecha, c.hora, c.descripcion, c.estado, c.created_at,
              u.nombre AS cliente_nombre, u.apellido AS cliente_apellido, u.correo AS cliente_correo,
              v.marca AS vehiculo_marca, v.modelo AS vehiculo_modelo, v.placa AS vehiculo_placa
       FROM citas c
       JOIN users u ON c.usuario_id = u.id
       JOIN vehiculos v ON c.vehiculo_id = v.id
       WHERE c.taller_id = $1
       ORDER BY c.fecha ASC, c.hora ASC`,
      [tallerId]
    );
    return rows;
  } else {
    // Listar citas del cliente (usuario)
    const { rows } = await pool.query(
      `SELECT c.id, c.fecha, c.hora, c.descripcion, c.estado, c.created_at,
              t.nombre_taller, t.direccion AS taller_direccion, t.telefono AS taller_telefono,
              v.marca AS vehiculo_marca, v.modelo AS vehiculo_modelo, v.placa AS vehiculo_placa
       FROM citas c
       JOIN talleres t ON c.taller_id = t.id
       JOIN vehiculos v ON c.vehiculo_id = v.id
       WHERE c.usuario_id = $1
       ORDER BY c.fecha DESC, c.hora DESC`,
      [usuarioId]
    );
    return rows;
  }
}

async function crear(usuarioId, datos) {
  const { taller_id, vehiculo_id, fecha, hora, descripcion } = datos;
  
  // Validar que el vehiculo sea propiedad de este usuario
  const vehRes = await pool.query('SELECT id FROM vehiculos WHERE id = $1 AND usuario_id = $2', [vehiculo_id, usuarioId]);
  if (vehRes.rows.length === 0) {
    throw new Error('El vehículo seleccionado no te pertenece.');
  }

  const { rows } = await pool.query(
    `INSERT INTO citas (usuario_id, taller_id, vehiculo_id, fecha, hora, descripcion, estado)
     VALUES ($1, $2, $3, $4, $5, $6, 'pendiente')
     RETURNING *`,
    [usuarioId, taller_id, vehiculo_id, fecha, hora, descripcion || null]
  );
  return rows[0];
}

async function actualizarEstado(id, usuarioId, rol, nuevoEstado) {
  if (rol === 'taller') {
    // El taller puede aceptar, rechazar o completar citas
    const tallerRes = await pool.query('SELECT id FROM talleres WHERE usuario_id = $1', [usuarioId]);
    if (tallerRes.rows.length === 0) {
      throw new Error('No tienes un taller registrado.');
    }
    const tallerId = tallerRes.rows[0].id;

    const { rows } = await pool.query(
      `UPDATE citas
       SET estado = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND taller_id = $3
       RETURNING *`,
      [nuevoEstado, id, tallerId]
    );
    return rows[0] || null;
  } else {
    // El cliente solo puede cancelar citas
    if (nuevoEstado !== 'cancelado') {
      throw new Error('Acción no permitida.');
    }
    const { rows } = await pool.query(
      `UPDATE citas
       SET estado = 'cancelado', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND usuario_id = $2
       RETURNING *`,
      [id, usuarioId]
    );
    return rows[0] || null;
  }
}

module.exports = {
  listarParaUsuario,
  crear,
  actualizarEstado,
};
