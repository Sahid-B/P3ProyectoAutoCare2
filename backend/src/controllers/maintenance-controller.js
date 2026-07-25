const maintenanceService = require('../services/maintenance-service');

/** Valida que un valor sea un ID numerico entero positivo. */
function idValido(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

/** Valida los campos de una solicitud de mantenimiento. */
function validarMantenimiento(body) {
  const errores = [];

  const vehicleId = Number(body.vehicle_id);
  if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
    errores.push('El vehiculo (vehicle_id) es obligatorio y debe ser valido.');
  }

  const maintenanceType = typeof body.maintenance_type === 'string' ? body.maintenance_type.trim() : '';
  if (!maintenanceType) {
    errores.push('El tipo de mantenimiento (maintenance_type) es obligatorio.');
  }

  const date = typeof body.date === 'string' ? body.date.trim() : '';
  if (!date || isNaN(Date.parse(date))) {
    errores.push('La fecha (date) es obligatoria y debe ser una fecha valida (YYYY-MM-DD).');
  }

  const kilometers = Number(body.kilometers);
  if (isNaN(kilometers) || kilometers < 0) {
    errores.push('El kilometraje debe ser un numero mayor o igual a 0.');
  }

  const cost = body.cost !== undefined && body.cost !== '' ? Number(body.cost) : 0;
  if (isNaN(cost) || cost < 0) {
    errores.push('El costo debe ser un numero mayor o igual a 0.');
  }

  let nextDate = null;
  if (body.next_date) {
    const parsedNextDate = String(body.next_date).trim();
    if (parsedNextDate && !isNaN(Date.parse(parsedNextDate))) {
      nextDate = parsedNextDate;
    } else if (parsedNextDate) {
      errores.push('La fecha del proximo mantenimiento debe ser valida.');
    }
  }

  let nextKilometers = null;
  if (body.next_kilometers !== undefined && body.next_kilometers !== null && body.next_kilometers !== '') {
    const parsedNextKm = Number(body.next_kilometers);
    if (!isNaN(parsedNextKm) && parsedNextKm >= 0) {
      nextKilometers = Math.round(parsedNextKm);
    } else {
      errores.push('El kilometraje del proximo mantenimiento debe ser un numero valido mayor o igual a 0.');
    }
  }

  return {
    errores,
    datos: {
      vehicle_id: vehicleId,
      maintenance_type: maintenanceType,
      date,
      kilometers: Math.round(kilometers),
      cost: Number(cost.toFixed(2)),
      workshop: body.workshop ? String(body.workshop).trim() : null,
      description: body.description ? String(body.description).trim() : null,
      next_date: nextDate,
      next_kilometers: nextKilometers,
    },
  };
}

/** GET /api/maintenances */
async function listar(peticion, respuesta, siguiente) {
  try {
    const usuarioId = peticion.usuario.id;
    const vehicleId = peticion.query.vehicle_id ? Number(peticion.query.vehicle_id) : null;

    const lista = await maintenanceService.listarPorUsuario(usuarioId, vehicleId);
    respuesta.json({
      success: true,
      data: lista,
    });
  } catch (error) {
    siguiente(error);
  }
}

/** GET /api/maintenances/stats */
async function obtenerEstadisticas(peticion, respuesta, siguiente) {
  try {
    const usuarioId = peticion.usuario.id;
    const stats = await maintenanceService.obtenerEstadisticas(usuarioId);

    respuesta.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    siguiente(error);
  }
}

/** GET /api/maintenances/:id */
async function obtenerPorId(peticion, respuesta, siguiente) {
  try {
    const id = idValido(peticion.params.id);
    if (!id) {
      return respuesta.status(400).json({
        success: false,
        message: 'ID de mantenimiento invalido.',
      });
    }

    const usuarioId = peticion.usuario.id;
    const mantenimiento = await maintenanceService.obtenerPorId(id, usuarioId);

    if (!mantenimiento) {
      return respuesta.status(404).json({
        success: false,
        message: 'Mantenimiento no encontrado o no pertenece a tus vehiculos.',
      });
    }

    respuesta.json({
      success: true,
      data: mantenimiento,
    });
  } catch (error) {
    siguiente(error);
  }
}

/** POST /api/maintenances */
async function crear(peticion, respuesta, siguiente) {
  try {
    const { errores, datos } = validarMantenimiento(peticion.body);
    if (errores.length > 0) {
      return respuesta.status(400).json({
        success: false,
        message: 'Errores de validacion.',
        errors: errores,
      });
    }

    const usuarioId = peticion.usuario.id;
    const nuevoMantenimiento = await maintenanceService.crear(usuarioId, datos);

    respuesta.status(201).json({
      success: true,
      message: 'Mantenimiento registrado exitosamente.',
      data: nuevoMantenimiento,
    });
  } catch (error) {
    if (error.message.includes('no pertenece')) {
      return respuesta.status(403).json({
        success: false,
        message: error.message,
      });
    }
    siguiente(error);
  }
}

/** PUT /api/maintenances/:id */
async function actualizar(peticion, respuesta, siguiente) {
  try {
    const id = idValido(peticion.params.id);
    if (!id) {
      return respuesta.status(400).json({
        success: false,
        message: 'ID de mantenimiento invalido.',
      });
    }

    const { errores, datos } = validarMantenimiento(peticion.body);
    if (errores.length > 0) {
      return respuesta.status(400).json({
        success: false,
        message: 'Errores de validacion.',
        errors: errores,
      });
    }

    const usuarioId = peticion.usuario.id;
    const mantenimentoActualizado = await maintenanceService.actualizar(id, usuarioId, datos);

    if (!mantenimentoActualizado) {
      return respuesta.status(404).json({
        success: false,
        message: 'Mantenimiento no encontrado o no autorizado.',
      });
    }

    respuesta.json({
      success: true,
      message: 'Mantenimiento actualizado exitosamente.',
      data: mantenimentoActualizado,
    });
  } catch (error) {
    if (error.message.includes('no pertenece')) {
      return respuesta.status(403).json({
        success: false,
        message: error.message,
      });
    }
    siguiente(error);
  }
}

/** DELETE /api/maintenances/:id */
async function eliminar(peticion, respuesta, siguiente) {
  try {
    const id = idValido(peticion.params.id);
    if (!id) {
      return respuesta.status(400).json({
        success: false,
        message: 'ID de mantenimiento invalido.',
      });
    }

    const usuarioId = peticion.usuario.id;
    const eliminado = await maintenanceService.eliminar(id, usuarioId);

    if (!eliminado) {
      return respuesta.status(404).json({
        success: false,
        message: 'Mantenimiento no encontrado o no autorizado.',
      });
    }

    respuesta.json({
      success: true,
      message: 'Mantenimiento eliminado exitosamente.',
    });
  } catch (error) {
    siguiente(error);
  }
}

module.exports = {
  listar,
  obtenerEstadisticas,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
};
