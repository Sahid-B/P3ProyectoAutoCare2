const { pool } = require('../config/database');

const COLUMNAS = `id, usuario_id, marca, modelo, anio, kilometraje, ciudad, tipo_vehiculo,
  precio_vendedor, imagen_url, estado_visual, historial_mantenimiento, danos_reportados,
  precio_sugerido_min, precio_sugerido_max, precio_sugerido, puntaje, veredicto, analisis,
  created_at, updated_at`;

const BASE_POR_TIPO = {
  automovil: 14500,
  suv: 18500,
  camioneta: 22000,
  motocicleta: 4200,
  camion: 30000,
  otro: 12000,
};

const FACTOR_ESTADO = {
  excelente: 1.08,
  bueno: 1,
  regular: 0.86,
  malo: 0.68,
};

const FACTOR_MANTENIMIENTO = {
  completo: 1.07,
  parcial: 1,
  desconocido: 0.93,
};

const FACTOR_DANOS = {
  ninguno: 1,
  leves: 0.92,
  moderados: 0.8,
  fuertes: 0.62,
};

function redondearPrecio(valor) {
  return Math.max(500, Math.round(valor / 100) * 100);
}

function calcularTasacion(datos) {
  const anioActual = new Date().getFullYear();
  const edad = Math.max(0, anioActual - Number(datos.anio));
  const tipo = datos.tipo_vehiculo || 'automovil';
  const base = BASE_POR_TIPO[tipo] || BASE_POR_TIPO.otro;

  const depreciacion = Math.max(0.28, 1 - edad * 0.055);
  const kmEsperado = Math.max(15000, edad * 15000);
  const relacionKm = Number(datos.kilometraje) / kmEsperado;
  const factorKm = Math.min(1.12, Math.max(0.72, 1.08 - relacionKm * 0.12));

  const factorEstado = FACTOR_ESTADO[datos.estado_visual] || FACTOR_ESTADO.bueno;
  const factorMantenimiento = FACTOR_MANTENIMIENTO[datos.historial_mantenimiento] || FACTOR_MANTENIMIENTO.parcial;
  const factorDanos = FACTOR_DANOS[datos.danos_reportados] || FACTOR_DANOS.ninguno;

  const sugerido = redondearPrecio(base * depreciacion * factorKm * factorEstado * factorMantenimiento * factorDanos);
  const sugeridoMin = redondearPrecio(sugerido * 0.94);
  const sugeridoMax = redondearPrecio(sugerido * 1.06);

  const precioVendedor = Number(datos.precio_vendedor);
  const diferencia = precioVendedor - sugerido;
  let veredicto = 'precio_justo';
  if (precioVendedor > sugeridoMax) veredicto = 'sobrevalorado';
  if (precioVendedor < sugeridoMin) veredicto = 'oportunidad';

  let puntaje = 78;
  puntaje -= Math.min(32, edad * 2);
  puntaje -= Math.min(22, Math.max(0, relacionKm - 1) * 18);
  puntaje += Math.round((factorEstado - 1) * 45);
  puntaje += Math.round((factorMantenimiento - 1) * 55);
  puntaje += Math.round((factorDanos - 1) * 60);
  puntaje = Math.max(0, Math.min(100, puntaje));

  const analisis = [
    `Tasacion estimada para ${datos.marca} ${datos.modelo} ${datos.anio}.`,
    `Estado visual declarado: ${datos.estado_visual}.`,
    `Historial de mantenimiento: ${datos.historial_mantenimiento}.`,
    `Danos reportados: ${datos.danos_reportados}.`,
    diferencia > 0
      ? `El precio del vendedor esta aproximadamente $${Math.abs(Math.round(diferencia))} por encima del valor central sugerido.`
      : `El precio del vendedor esta aproximadamente $${Math.abs(Math.round(diferencia))} por debajo del valor central sugerido.`,
  ].join(' ');

  return {
    precio_sugerido_min: sugeridoMin,
    precio_sugerido_max: sugeridoMax,
    precio_sugerido: sugerido,
    puntaje,
    veredicto,
    analisis,
  };
}

async function listarPorUsuario(usuarioId) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM marketplace_listings WHERE usuario_id = $1 ORDER BY created_at DESC`,
    [usuarioId],
  );
  return rows;
}

async function crear(usuarioId, datos) {
  const tasacion = calcularTasacion(datos);
  const { rows } = await pool.query(
    `INSERT INTO marketplace_listings
      (usuario_id, marca, modelo, anio, kilometraje, ciudad, tipo_vehiculo, precio_vendedor,
       imagen_url, estado_visual, historial_mantenimiento, danos_reportados,
       precio_sugerido_min, precio_sugerido_max, precio_sugerido, puntaje, veredicto, analisis)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
     RETURNING ${COLUMNAS}`,
    [
      usuarioId,
      datos.marca,
      datos.modelo,
      datos.anio,
      datos.kilometraje,
      datos.ciudad,
      datos.tipo_vehiculo,
      datos.precio_vendedor,
      datos.imagen_url,
      datos.estado_visual,
      datos.historial_mantenimiento,
      datos.danos_reportados,
      tasacion.precio_sugerido_min,
      tasacion.precio_sugerido_max,
      tasacion.precio_sugerido,
      tasacion.puntaje,
      tasacion.veredicto,
      tasacion.analisis,
    ],
  );
  return rows[0];
}

async function eliminar(id, usuarioId) {
  const { rowCount } = await pool.query(
    'DELETE FROM marketplace_listings WHERE id = $1 AND usuario_id = $2',
    [id, usuarioId],
  );
  return rowCount > 0;
}

async function listarTodos() {
  // Obtenemos todos los listings con la informacion de contacto del vendedor
  const { rows } = await pool.query(
    `SELECT m.*, u.nombre as vendedor_nombre, u.apellido as vendedor_apellido, u.correo as vendedor_correo 
     FROM marketplace_listings m
     JOIN users u ON m.usuario_id = u.id
     ORDER BY m.created_at DESC`
  );
  return rows;
}

module.exports = {
  listarPorUsuario,
  listarTodos,
  crear,
  eliminar,
  calcularTasacion,
};
