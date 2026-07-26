const { pool } = require('../config/database');

// Servicio de tiendas de repuestos. Todas las consultas usan parametros ($1, $2, ...)
// para evitar inyeccion de SQL.

const COLUMNAS = `id, usuario_id, nombre_local, descripcion, direccion, latitud, longitud,
  telefono, horario, estado, created_at, updated_at`;

/**
 * Valida los datos de la tienda. Devuelve un mensaje de error o null.
 * Se usa tanto en el registro del vendedor como al editar la tienda.
 */
function validarDatosTienda(datos) {
  if (!datos.nombre_local || !datos.nombre_local.trim()) {
    return 'El nombre del local es obligatorio.';
  }
  if (!datos.direccion || !datos.direccion.trim()) {
    return 'La direccion de la tienda es obligatoria.';
  }

  const latitud = Number(datos.latitud);
  const longitud = Number(datos.longitud);

  if (datos.latitud === undefined || datos.latitud === null || Number.isNaN(latitud)) {
    return 'Debes seleccionar la ubicacion de la tienda en el mapa.';
  }
  if (datos.longitud === undefined || datos.longitud === null || Number.isNaN(longitud)) {
    return 'Debes seleccionar la ubicacion de la tienda en el mapa.';
  }
  if (latitud < -90 || latitud > 90) {
    return 'La latitud seleccionada no es valida.';
  }
  if (longitud < -180 || longitud > 180) {
    return 'La longitud seleccionada no es valida.';
  }

  return null;
}

/**
 * Crea la tienda de un vendedor. Recibe un cliente de conexion para poder
 * participar en la transaccion de registro del usuario.
 */
async function crearTienda(cliente, usuarioId, datos) {
  const { rows } = await cliente.query(
    `INSERT INTO vendedores_repuestos
       (usuario_id, nombre_local, descripcion, direccion, latitud, longitud, telefono, horario)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${COLUMNAS}`,
    [
      usuarioId,
      datos.nombre_local.trim(),
      datos.descripcion?.trim() || null,
      datos.direccion.trim(),
      datos.latitud,
      datos.longitud,
      datos.telefono?.trim() || null,
      datos.horario?.trim() || null,
    ],
  );
  return rows[0];
}

async function obtenerPorUsuario(usuarioId) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM vendedores_repuestos WHERE usuario_id = $1`,
    [usuarioId],
  );
  return rows[0] || null;
}

async function obtenerPorId(id) {
  const { rows } = await pool.query(
    `SELECT v.id, v.usuario_id, v.nombre_local, v.descripcion, v.direccion, v.latitud,
            v.longitud, v.telefono, v.horario, v.estado, v.created_at, v.updated_at,
            u.nombre AS propietario_nombre, u.apellido AS propietario_apellido, u.correo
     FROM vendedores_repuestos v
     JOIN users u ON v.usuario_id = u.id
     WHERE v.id = $1`,
    [id],
  );
  return rows[0] || null;
}

async function actualizarPorUsuario(usuarioId, datos) {
  const { rows } = await pool.query(
    `UPDATE vendedores_repuestos
     SET nombre_local = $1,
         descripcion = $2,
         direccion = $3,
         latitud = $4,
         longitud = $5,
         telefono = $6,
         horario = $7,
         updated_at = CURRENT_TIMESTAMP
     WHERE usuario_id = $8
     RETURNING ${COLUMNAS}`,
    [
      datos.nombre_local.trim(),
      datos.descripcion?.trim() || null,
      datos.direccion.trim(),
      datos.latitud,
      datos.longitud,
      datos.telefono?.trim() || null,
      datos.horario?.trim() || null,
      usuarioId,
    ],
  );
  return rows[0] || null;
}

/**
 * Tiendas visibles para los clientes: solo las activas y de usuarios no bloqueados.
 */
async function listarPublicas() {
  const { rows } = await pool.query(
    `SELECT v.id, v.nombre_local, v.descripcion, v.direccion, v.latitud, v.longitud,
            v.telefono, v.horario, u.correo,
            COUNT(p.id) FILTER (WHERE p.estado = 'activo') AS total_productos
     FROM vendedores_repuestos v
     JOIN users u ON v.usuario_id = u.id
     LEFT JOIN productos p ON p.vendedor_id = v.id
     WHERE v.estado = 'activo' AND u.is_active = TRUE
     GROUP BY v.id, u.correo
     ORDER BY v.nombre_local ASC`,
  );
  return rows;
}

/**
 * Listado completo para el administrador (incluye tiendas inactivas).
 */
async function listarParaAdmin() {
  const { rows } = await pool.query(
    `SELECT v.id, v.usuario_id, v.nombre_local, v.direccion, v.telefono, v.horario,
            v.estado, v.created_at,
            u.nombre, u.apellido, u.correo, u.is_active,
            COUNT(DISTINCT p.id) AS total_productos,
            COUNT(DISTINCT c.id) AS total_compras
     FROM vendedores_repuestos v
     JOIN users u ON v.usuario_id = u.id
     LEFT JOIN productos p ON p.vendedor_id = v.id
     LEFT JOIN compras c ON c.vendedor_id = v.id
     GROUP BY v.id, u.id
     ORDER BY v.created_at DESC`,
  );
  return rows;
}

async function cambiarEstado(id, estado) {
  const { rows } = await pool.query(
    `UPDATE vendedores_repuestos
     SET estado = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING ${COLUMNAS}`,
    [estado, id],
  );
  return rows[0] || null;
}

/**
 * Estadisticas del panel del vendedor.
 * Los ingresos solo contabilizan compras efectivamente pagadas.
 */
async function obtenerEstadisticas(vendedorId) {
  const { rows } = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM productos WHERE vendedor_id = $1) AS total_productos,
       (SELECT COUNT(*) FROM productos WHERE vendedor_id = $1 AND stock <= 5 AND estado = 'activo') AS productos_bajo_stock,
       (SELECT COUNT(*) FROM compras WHERE vendedor_id = $1 AND estado_pedido = 'pendiente') AS pedidos_pendientes,
       (SELECT COUNT(*) FROM compras WHERE vendedor_id = $1 AND estado_pago = 'pagado') AS ventas_realizadas,
       (SELECT COALESCE(SUM(total), 0) FROM compras WHERE vendedor_id = $1 AND estado_pago = 'pagado') AS ingresos_totales`,
    [vendedorId],
  );

  const fila = rows[0];
  return {
    totalProductos: Number(fila.total_productos),
    productosBajoStock: Number(fila.productos_bajo_stock),
    pedidosPendientes: Number(fila.pedidos_pendientes),
    ventasRealizadas: Number(fila.ventas_realizadas),
    ingresosTotales: Number(fila.ingresos_totales),
  };
}

module.exports = {
  validarDatosTienda,
  crearTienda,
  obtenerPorUsuario,
  obtenerPorId,
  actualizarPorUsuario,
  listarPublicas,
  listarParaAdmin,
  cambiarEstado,
  obtenerEstadisticas,
};
