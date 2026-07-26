const { pool } = require('../config/database');

// Servicio de productos/repuestos. Todos los filtros del catalogo se arman con
// consultas parametrizadas ($1, $2, ...) para evitar inyeccion de SQL.

const COLUMNAS = `id, vendedor_id, nombre, descripcion, categoria, marca, compatibilidad,
  precio, stock, imagen_url, estado, created_at, updated_at`;

async function listarPorVendedor(vendedorId) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM productos WHERE vendedor_id = $1 ORDER BY created_at DESC`,
    [vendedorId],
  );
  return rows;
}

async function obtenerPorId(id) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM productos WHERE id = $1`, [id]);
  return rows[0] || null;
}

/**
 * Detalle publico del producto: incluye los datos de contacto de la tienda.
 */
async function obtenerDetallePublico(id) {
  const { rows } = await pool.query(
    `SELECT p.id, p.vendedor_id, p.nombre, p.descripcion, p.categoria, p.marca,
            p.compatibilidad, p.precio, p.stock, p.imagen_url, p.created_at,
            v.nombre_local, v.direccion, v.telefono, v.horario, v.latitud, v.longitud
     FROM productos p
     JOIN vendedores_repuestos v ON p.vendedor_id = v.id
     JOIN users u ON v.usuario_id = u.id
     WHERE p.id = $1 AND p.estado = 'activo' AND v.estado = 'activo' AND u.is_active = TRUE`,
    [id],
  );
  return rows[0] || null;
}

/**
 * Catalogo publico con filtros opcionales de busqueda, categoria, marca, precio
 * y disponibilidad de stock.
 */
async function listarCatalogo(filtros = {}) {
  const condiciones = [
    "p.estado = 'activo'",
    "v.estado = 'activo'",
    'u.is_active = TRUE',
  ];
  const valores = [];

  if (filtros.busqueda) {
    valores.push(`%${filtros.busqueda}%`);
    condiciones.push(`(p.nombre ILIKE $${valores.length} OR p.descripcion ILIKE $${valores.length})`);
  }

  if (filtros.categoria) {
    valores.push(filtros.categoria);
    condiciones.push(`p.categoria = $${valores.length}`);
  }

  if (filtros.marca) {
    valores.push(filtros.marca);
    condiciones.push(`p.marca = $${valores.length}`);
  }

  if (filtros.precioMin !== undefined && filtros.precioMin !== null) {
    valores.push(filtros.precioMin);
    condiciones.push(`p.precio >= $${valores.length}`);
  }

  if (filtros.precioMax !== undefined && filtros.precioMax !== null) {
    valores.push(filtros.precioMax);
    condiciones.push(`p.precio <= $${valores.length}`);
  }

  if (filtros.soloDisponibles) {
    condiciones.push('p.stock > 0');
  }

  if (filtros.vendedorId) {
    valores.push(filtros.vendedorId);
    condiciones.push(`p.vendedor_id = $${valores.length}`);
  }

  const { rows } = await pool.query(
    `SELECT p.id, p.vendedor_id, p.nombre, p.descripcion, p.categoria, p.marca,
            p.compatibilidad, p.precio, p.stock, p.imagen_url, p.created_at,
            v.nombre_local, v.direccion, v.telefono
     FROM productos p
     JOIN vendedores_repuestos v ON p.vendedor_id = v.id
     JOIN users u ON v.usuario_id = u.id
     WHERE ${condiciones.join(' AND ')}
     ORDER BY p.created_at DESC`,
    valores,
  );
  return rows;
}

/**
 * Marcas distintas presentes en el catalogo activo. Alimenta el filtro por marca.
 */
async function listarMarcas() {
  const { rows } = await pool.query(
    `SELECT DISTINCT p.marca
     FROM productos p
     JOIN vendedores_repuestos v ON p.vendedor_id = v.id
     WHERE p.estado = 'activo' AND v.estado = 'activo' AND p.marca IS NOT NULL AND p.marca <> ''
     ORDER BY p.marca ASC`,
  );
  return rows.map((fila) => fila.marca);
}

async function crear(vendedorId, datos) {
  const { rows } = await pool.query(
    `INSERT INTO productos
       (vendedor_id, nombre, descripcion, categoria, marca, compatibilidad, precio, stock, imagen_url, estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING ${COLUMNAS}`,
    [
      vendedorId,
      datos.nombre.trim(),
      datos.descripcion?.trim() || null,
      datos.categoria,
      datos.marca?.trim() || null,
      datos.compatibilidad?.trim() || null,
      datos.precio,
      datos.stock,
      datos.imagen_url?.trim() || null,
      datos.estado || 'activo',
    ],
  );
  return rows[0];
}

/**
 * Actualiza un producto verificando en la propia consulta que pertenezca al
 * vendedor indicado. Devuelve null si el producto no existe o no es suyo.
 */
async function actualizar(id, vendedorId, datos) {
  const { rows } = await pool.query(
    `UPDATE productos
     SET nombre = $1,
         descripcion = $2,
         categoria = $3,
         marca = $4,
         compatibilidad = $5,
         precio = $6,
         stock = $7,
         imagen_url = $8,
         estado = $9,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $10 AND vendedor_id = $11
     RETURNING ${COLUMNAS}`,
    [
      datos.nombre.trim(),
      datos.descripcion?.trim() || null,
      datos.categoria,
      datos.marca?.trim() || null,
      datos.compatibilidad?.trim() || null,
      datos.precio,
      datos.stock,
      datos.imagen_url?.trim() || null,
      datos.estado || 'activo',
      id,
      vendedorId,
    ],
  );
  return rows[0] || null;
}

async function eliminar(id, vendedorId) {
  const { rowCount } = await pool.query(
    'DELETE FROM productos WHERE id = $1 AND vendedor_id = $2',
    [id, vendedorId],
  );
  return rowCount > 0;
}

/**
 * Productos de un vendedor para la vista del administrador.
 */
async function listarPorVendedorParaAdmin(vendedorId) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM productos WHERE vendedor_id = $1 ORDER BY created_at DESC`,
    [vendedorId],
  );
  return rows;
}

module.exports = {
  listarPorVendedor,
  listarPorVendedorParaAdmin,
  obtenerPorId,
  obtenerDetallePublico,
  listarCatalogo,
  listarMarcas,
  crear,
  actualizar,
  eliminar,
};
