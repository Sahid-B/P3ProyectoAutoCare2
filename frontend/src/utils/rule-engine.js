/**
 * Motor de reglas para calculo de mantenimientos en AutoCare.
 * Evalua kilometraje y fechas para determinar si un servicio esta al dia, proximo, urgente o vencido.
 */

export const REGLAS_TIPO_MANTENIMIENTO = {
  'Cambio de aceite': { kmIntervalo: 5000, diasIntervalo: 180 },
  'Frenos': { kmIntervalo: 15000, diasIntervalo: 365 },
  'Llantas': { kmIntervalo: 40000, diasIntervalo: 730 },
  'Filtro de aire': { kmIntervalo: 10000, diasIntervalo: 365 },
  'Filtro de combustible': { kmIntervalo: 20000, diasIntervalo: 365 },
  'Bateria': { kmIntervalo: 30000, diasIntervalo: 1095 },
  'Bujias': { kmIntervalo: 30000, diasIntervalo: 540 },
  'Revisión general': { kmIntervalo: 10000, diasIntervalo: 365 },
  'Matricula': { kmIntervalo: 0, diasIntervalo: 365 },
  'Otro': { kmIntervalo: 10000, diasIntervalo: 365 },
};

/**
 * Calcula la fecha y kilometraje del proximo mantenimiento si no fueron provistos.
 */
export function sugerirProximoMantenimiento(tipo, fechaActual, kmActual) {
  const regla = REGLAS_TIPO_MANTENIMIENTO[tipo] || REGLAS_TIPO_MANTENIMIENTO['Otro'];

  let sugeridoKm = null;
  if (kmActual !== null && kmActual !== undefined && regla.kmIntervalo > 0) {
    sugeridoKm = Number(kmActual) + regla.kmIntervalo;
  }

  let sugeridoFecha = null;
  if (fechaActual) {
    const d = new Date(fechaActual);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + regla.diasIntervalo);
      sugeridoFecha = d.toISOString().split('T')[0];
    }
  }

  return { next_kilometers: sugeridoKm, next_date: sugeridoFecha };
}

/**
 * Evalua el estado de un mantenimiento en base a kilometraje del vehiculo y/o fecha limite.
 */
export function calcularEstadoMantenimiento(mantenimiento, kilometrajeVehiculo) {
  const kmActual = kilometrajeVehiculo ?? mantenimiento.vehicle_kilometraje_actual ?? mantenimiento.kilometers;
  const kmProximo = mantenimiento.next_kilometers;
  const fechaProximaStr = mantenimiento.next_date;

  let kmRestantes = null;
  if (kmProximo !== null && kmProximo !== undefined && kmActual !== null && kmActual !== undefined) {
    kmRestantes = Number(kmProximo) - Number(kmActual);
  }

  let diasRestantes = null;
  if (fechaProximaStr) {
    const fechaProxima = new Date(fechaProximaStr);
    const hoy = new Date();
    // Resetear hora para comparar solo fechas
    fechaProxima.setHours(0, 0, 0, 0);
    hoy.setHours(0, 0, 0, 0);

    const diferenciaMs = fechaProxima.getTime() - hoy.getTime();
    diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
  }

  // Evaluar estado de urgencia / vencimiento
  // Prioridad 1: Vencido (kmRestantes <= 0 O diasRestantes < 0)
  const esKmVencido = kmRestantes !== null && kmRestantes <= 0;
  const esFechaVencida = diasRestantes !== null && diasRestantes < 0;

  if (esKmVencido || esFechaVencida) {
    let detalle;
    if (esKmVencido && esFechaVencida) {
      detalle = `Vencido hace ${Math.abs(diasRestantes)} dias y sobrepasado por ${Math.abs(kmRestantes)} km`;
    } else if (esKmVencido) {
      detalle = `Excedido por ${Math.abs(kmRestantes)} km`;
    } else {
      detalle = `Vencido hace ${Math.abs(diasRestantes)} dias`;
    }

    return {
      estado: 'vencido',
      label: 'Vencido',
      colorScheme: 'error',
      badgeColor: 'red',
      kmRestantes,
      diasRestantes,
      detalle,
    };
  }

  // Prioridad 2: Urgente (kmRestantes <= 500 O diasRestantes <= 7)
  const esKmUrgente = kmRestantes !== null && kmRestantes <= 500;
  const esFechaUrgente = diasRestantes !== null && diasRestantes <= 7;

  if (esKmUrgente || esFechaUrgente) {
    let detalle;
    if (kmRestantes !== null && diasRestantes !== null) {
      detalle = `Faltan ${kmRestantes} km o ${diasRestantes} dias`;
    } else if (kmRestantes !== null) {
      detalle = `Faltan ${kmRestantes} km`;
    } else {
      detalle = `Faltan ${diasRestantes} dias`;
    }

    return {
      estado: 'urgente',
      label: 'Urgente',
      colorScheme: 'warning',
      badgeColor: 'orange',
      kmRestantes,
      diasRestantes,
      detalle,
    };
  }

  // Prioridad 3: Proximo (kmRestantes <= 1500 O diasRestantes <= 30)
  const esKmProximo = kmRestantes !== null && kmRestantes <= 1500;
  const esFechaProxima = diasRestantes !== null && diasRestantes <= 30;

  if (esKmProximo || esFechaProxima) {
    let detalle;
    if (kmRestantes !== null && diasRestantes !== null) {
      detalle = `En ${kmRestantes} km o ${diasRestantes} dias`;
    } else if (kmRestantes !== null) {
      detalle = `En ${kmRestantes} km`;
    } else {
      detalle = `En ${diasRestantes} dias`;
    }

    return {
      estado: 'proximo',
      label: 'Proximo',
      colorScheme: 'info',
      badgeColor: 'blue',
      kmRestantes,
      diasRestantes,
      detalle,
    };
  }

  // Prioridad 4: Al dia
  let detalle = 'Al dia';
  if (kmRestantes !== null) {
    detalle = `Faltan ${kmRestantes} km`;
  } else if (diasRestantes !== null) {
    detalle = `En ${diasRestantes} dias`;
  }

  return {
    estado: 'al_dia',
    label: 'Al dia',
    colorScheme: 'success',
    badgeColor: 'green',
    kmRestantes,
    diasRestantes,
    detalle,
  };
}

export default {
  REGLAS_TIPO_MANTENIMIENTO,
  sugerirProximoMantenimiento,
  calcularEstadoMantenimiento,
};
