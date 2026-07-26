const marketplaceService = require('../services/marketplace-service');

const TIPOS_VALIDOS = ['automovil', 'motocicleta', 'camioneta', 'suv', 'camion', 'otro'];
const ESTADOS_VALIDOS = ['excelente', 'bueno', 'regular', 'malo'];
const MANTENIMIENTOS_VALIDOS = ['completo', 'parcial', 'desconocido'];
const DANOS_VALIDOS = ['ninguno', 'leves', 'moderados', 'fuertes'];
const ANIO_MIN = 1900;
const ANIO_MAX = new Date().getFullYear() + 1;

function aEntero(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  return Number.isInteger(numero) ? numero : null;
}

function aNumero(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function textoOpcional(valor) {
  if (valor === null || valor === undefined) return null;
  const limpio = String(valor).trim();
  return limpio === '' ? null : limpio;
}

function validarPublicacion(body) {
  const errores = [];
  const marca = typeof body.marca === 'string' ? body.marca.trim() : '';
  const modelo = typeof body.modelo === 'string' ? body.modelo.trim() : '';
  const ciudad = textoOpcional(body.ciudad);
  const imagenUrl = textoOpcional(body.imagen_url);

  if (!marca) errores.push('La marca es obligatoria.');
  if (!modelo) errores.push('El modelo es obligatorio.');

  const anio = aEntero(body.anio);
  if (anio === null) errores.push('El anio debe ser un numero.');
  else if (anio < ANIO_MIN || anio > ANIO_MAX) errores.push(`El anio debe estar entre ${ANIO_MIN} y ${ANIO_MAX}.`);

  const kilometraje = aEntero(body.kilometraje);
  if (kilometraje === null || kilometraje < 0) errores.push('El kilometraje debe ser un numero igual o mayor a cero.');

  const precioVendedor = aNumero(body.precio_vendedor);
  if (precioVendedor === null || precioVendedor <= 0) errores.push('El precio del vendedor debe ser mayor a cero.');

  const tipoVehiculo = String(body.tipo_vehiculo || 'automovil').trim().toLowerCase();
  if (!TIPOS_VALIDOS.includes(tipoVehiculo)) errores.push('El tipo de vehiculo no es valido.');

  const estadoVisual = String(body.estado_visual || 'bueno').trim().toLowerCase();
  if (!ESTADOS_VALIDOS.includes(estadoVisual)) errores.push('El estado visual no es valido.');

  const historialMantenimiento = String(body.historial_mantenimiento || 'parcial').trim().toLowerCase();
  if (!MANTENIMIENTOS_VALIDOS.includes(historialMantenimiento)) errores.push('El historial de mantenimiento no es valido.');

  const danosReportados = String(body.danos_reportados || 'ninguno').trim().toLowerCase();
  if (!DANOS_VALIDOS.includes(danosReportados)) errores.push('El nivel de danos no es valido.');

  return {
    errores,
    datos: {
      marca,
      modelo,
      anio,
      kilometraje,
      ciudad,
      tipo_vehiculo: tipoVehiculo,
      precio_vendedor: precioVendedor,
      imagen_url: imagenUrl,
      estado_visual: estadoVisual,
      historial_mantenimiento: historialMantenimiento,
      danos_reportados: danosReportados,
    },
  };
}

function idValido(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

async function listar(req, res) {
  try {
    const data = await marketplaceService.listarPorUsuario(req.usuario.id);
    return res.json({ success: true, message: 'Publicaciones obtenidas correctamente.', data });
  } catch (error) {
    console.error('[marketplace-controller] listar:', error.message);
    return res.status(500).json({ success: false, message: 'No se pudieron obtener las publicaciones.' });
  }
}

async function crear(req, res) {
  const { errores, datos } = validarPublicacion(req.body);
  if (errores.length > 0) {
    return res.status(400).json({ success: false, message: errores[0], errores });
  }

  try {
    const publicacion = await marketplaceService.crear(req.usuario.id, datos);
    return res.status(201).json({
      success: true,
      message: 'Auto publicado y tasado correctamente.',
      data: publicacion,
    });
  } catch (error) {
    console.error('[marketplace-controller] crear:', error.message);
    return res.status(500).json({ success: false, message: 'No se pudo publicar el auto.' });
  }
}

async function eliminar(req, res) {
  const id = idValido(req.params.id);
  if (!id) return res.status(400).json({ success: false, message: 'Identificador de publicacion invalido.' });

  try {
    const eliminado = await marketplaceService.eliminar(id, req.usuario.id);
    if (!eliminado) return res.status(404).json({ success: false, message: 'Publicacion no encontrada.' });
    return res.json({ success: true, message: 'Publicacion eliminada correctamente.' });
  } catch (error) {
    console.error('[marketplace-controller] eliminar:', error.message);
    return res.status(500).json({ success: false, message: 'No se pudo eliminar la publicacion.' });
  }
}

function tasar(req, res) {
  const { errores, datos } = validarPublicacion(req.body);
  if (errores.length > 0) {
    return res.status(400).json({ success: false, message: errores[0], errores });
  }

  return res.json({
    success: true,
    message: 'Tasacion calculada correctamente.',
    data: marketplaceService.calcularTasacion(datos),
  });
}

async function listarTodos(req, res) {
  try {
    const data = await marketplaceService.listarTodos();
    return res.json({ success: true, message: 'Publicaciones del marketplace obtenidas.', data });
  } catch (error) {
    console.error('[marketplace-controller] listarTodos:', error.message);
    return res.status(500).json({ success: false, message: 'No se pudieron obtener las publicaciones.' });
  }
}

module.exports = {
  listar,
  listarTodos,
  crear,
  eliminar,
  tasar,
};
