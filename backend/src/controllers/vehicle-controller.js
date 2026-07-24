const vehicleService = require('../services/vehicle-service');

// Tipos de vehiculo aceptados (valores canonicos, sin acentos).
const TIPOS_VALIDOS = ['automovil', 'motocicleta', 'camioneta', 'suv', 'camion', 'otro'];

const ANIO_MIN = 1900;
const ANIO_MAX = new Date().getFullYear() + 1;

/** Normaliza la placa: sin espacios y en mayusculas. */
function normalizarPlaca(placa) {
  return String(placa).trim().toUpperCase().replace(/\s+/g, '');
}

/** Convierte un valor a entero; devuelve null si no es valido. */
function aEntero(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  return Number.isInteger(numero) ? numero : null;
}

/** Limpia un texto opcional; devuelve null si queda vacio. */
function textoOpcional(valor) {
  if (valor === null || valor === undefined) return null;
  const limpio = String(valor).trim();
  return limpio === '' ? null : limpio;
}

/** Valida el id recibido por parametro de ruta. */
function idValido(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

/**
 * Valida y normaliza los datos completos de un vehiculo (crear / editar).
 * Devuelve { errores: [], datos: {} }.
 */
function validarVehiculo(body) {
  const errores = [];

  const marca = typeof body.marca === 'string' ? body.marca.trim() : '';
  const modelo = typeof body.modelo === 'string' ? body.modelo.trim() : '';
  const placaCruda = typeof body.placa === 'string' ? body.placa : '';

  if (!marca) errores.push('La marca es obligatoria.');
  if (!modelo) errores.push('El modelo es obligatorio.');
  if (!placaCruda.trim()) errores.push('La placa es obligatoria.');

  const anio = aEntero(body.anio);
  if (anio === null) {
    errores.push('El anio debe ser un numero.');
  } else if (anio < ANIO_MIN || anio > ANIO_MAX) {
    errores.push(`El anio debe estar entre ${ANIO_MIN} y ${ANIO_MAX}.`);
  }

  // El kilometraje es opcional al crear (por defecto 0), pero si viene debe ser valido.
  let kilometraje = 0;
  if (body.kilometraje_actual !== undefined && body.kilometraje_actual !== '') {
    kilometraje = aEntero(body.kilometraje_actual);
    if (kilometraje === null) {
      errores.push('El kilometraje debe ser un numero.');
    } else if (kilometraje < 0) {
      errores.push('El kilometraje no puede ser negativo.');
    }
  }

  // El tipo por defecto es "otro"; si viene, debe ser uno de los permitidos.
  let tipo = 'otro';
  if (body.tipo_vehiculo !== undefined && String(body.tipo_vehiculo).trim() !== '') {
    tipo = String(body.tipo_vehiculo).trim().toLowerCase();
    if (!TIPOS_VALIDOS.includes(tipo)) {
      errores.push('El tipo de vehiculo no es valido.');
    }
  }

  const datos = {
    marca,
    modelo,
    anio,
    placa: normalizarPlaca(placaCruda),
    color: textoOpcional(body.color),
    tipo_vehiculo: tipo,
    kilometraje_actual: kilometraje ?? 0,
    imagen_url: textoOpcional(body.imagen_url),
    observaciones: textoOpcional(body.observaciones),
  };

  return { errores, datos };
}

/** Respuesta uniforme de error de validacion. */
function responderValidacion(res, errores) {
  return res.status(400).json({
    success: false,
    message: errores[0],
    errores,
  });
}

/**
 * GET /api/vehicles
 * Lista unicamente los vehiculos del usuario autenticado.
 */
async function listar(req, res) {
  try {
    const data = await vehicleService.listarPorUsuario(req.usuario.id);
    return res.json({
      success: true,
      message: 'Vehiculos obtenidos correctamente.',
      data,
    });
  } catch (error) {
    console.error('[vehicle-controller] listar:', error.message);
    return res.status(500).json({ success: false, message: 'No se pudieron obtener los vehiculos.' });
  }
}

/**
 * GET /api/vehicles/:id
 * Obtiene un vehiculo solo si pertenece al usuario autenticado.
 */
async function obtener(req, res) {
  const id = idValido(req.params.id);
  if (!id) {
    return res.status(400).json({ success: false, message: 'Identificador de vehiculo invalido.' });
  }

  try {
    const vehiculo = await vehicleService.obtenerPorId(id, req.usuario.id);
    if (!vehiculo) {
      return res.status(404).json({ success: false, message: 'Vehiculo no encontrado.' });
    }
    return res.json({ success: true, message: 'Vehiculo obtenido correctamente.', data: vehiculo });
  } catch (error) {
    console.error('[vehicle-controller] obtener:', error.message);
    return res.status(500).json({ success: false, message: 'No se pudo obtener el vehiculo.' });
  }
}

/**
 * POST /api/vehicles
 * Registra un vehiculo asociado al usuario autenticado.
 */
async function crear(req, res) {
  const { errores, datos } = validarVehiculo(req.body);
  if (errores.length > 0) {
    return responderValidacion(res, errores);
  }

  try {
    const vehiculo = await vehicleService.crear(req.usuario.id, datos);
    return res.status(201).json({
      success: true,
      message: 'Vehiculo registrado correctamente.',
      data: vehiculo,
    });
  } catch (error) {
    // 23505 = violacion de restriccion unica (placa duplicada para el usuario)
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya tienes un vehiculo registrado con esa placa.',
      });
    }
    console.error('[vehicle-controller] crear:', error.message);
    return res.status(500).json({ success: false, message: 'No se pudo registrar el vehiculo.' });
  }
}

/**
 * PUT /api/vehicles/:id
 * Actualiza un vehiculo solo si pertenece al usuario autenticado.
 */
async function actualizar(req, res) {
  const id = idValido(req.params.id);
  if (!id) {
    return res.status(400).json({ success: false, message: 'Identificador de vehiculo invalido.' });
  }

  const { errores, datos } = validarVehiculo(req.body);
  if (errores.length > 0) {
    return responderValidacion(res, errores);
  }

  try {
    // Confirmar propiedad antes de actualizar
    const existente = await vehicleService.obtenerPorId(id, req.usuario.id);
    if (!existente) {
      return res.status(404).json({ success: false, message: 'Vehiculo no encontrado.' });
    }

    const vehiculo = await vehicleService.actualizar(id, req.usuario.id, datos);
    return res.json({
      success: true,
      message: 'Vehiculo actualizado correctamente.',
      data: vehiculo,
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya tienes un vehiculo registrado con esa placa.',
      });
    }
    console.error('[vehicle-controller] actualizar:', error.message);
    return res.status(500).json({ success: false, message: 'No se pudo actualizar el vehiculo.' });
  }
}

/**
 * PATCH /api/vehicles/:id/mileage
 * Actualiza solamente el kilometraje actual.
 */
async function actualizarKilometraje(req, res) {
  const id = idValido(req.params.id);
  if (!id) {
    return res.status(400).json({ success: false, message: 'Identificador de vehiculo invalido.' });
  }

  const kilometraje = aEntero(req.body.kilometraje_actual ?? req.body.kilometraje);
  if (kilometraje === null || kilometraje < 0) {
    return res.status(400).json({
      success: false,
      message: 'El kilometraje debe ser un numero igual o mayor que cero.',
    });
  }

  try {
    const existente = await vehicleService.obtenerPorId(id, req.usuario.id);
    if (!existente) {
      return res.status(404).json({ success: false, message: 'Vehiculo no encontrado.' });
    }

    // No se permite retroceder el kilometraje.
    if (kilometraje < existente.kilometraje_actual) {
      return res.status(400).json({
        success: false,
        message: `El nuevo kilometraje no puede ser menor que el actual (${existente.kilometraje_actual} km).`,
      });
    }

    const vehiculo = await vehicleService.actualizarKilometraje(id, req.usuario.id, kilometraje);
    return res.json({
      success: true,
      message: 'Kilometraje actualizado correctamente.',
      data: vehiculo,
    });
  } catch (error) {
    console.error('[vehicle-controller] actualizarKilometraje:', error.message);
    return res.status(500).json({ success: false, message: 'No se pudo actualizar el kilometraje.' });
  }
}

/**
 * DELETE /api/vehicles/:id
 * Elimina un vehiculo solo si pertenece al usuario autenticado.
 */
async function eliminar(req, res) {
  const id = idValido(req.params.id);
  if (!id) {
    return res.status(400).json({ success: false, message: 'Identificador de vehiculo invalido.' });
  }

  try {
    const eliminado = await vehicleService.eliminar(id, req.usuario.id);
    if (!eliminado) {
      return res.status(404).json({ success: false, message: 'Vehiculo no encontrado.' });
    }
    return res.json({ success: true, message: 'Vehiculo eliminado correctamente.' });
  } catch (error) {
    console.error('[vehicle-controller] eliminar:', error.message);
    return res.status(500).json({ success: false, message: 'No se pudo eliminar el vehiculo.' });
  }
}

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  actualizarKilometraje,
  eliminar,
  TIPOS_VALIDOS,
};
