// Utilidades de formato compartidas por el modulo de repuestos.

/** Formatea un valor numerico como moneda (USD, formato es-EC). */
export function moneda(valor) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor || 0));
}

/** Formatea una fecha ISO como fecha corta legible. */
export function fechaCorta(valor) {
  if (!valor) return '-';
  return new Date(valor).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Formatea una fecha ISO con hora. */
export function fechaHora(valor) {
  if (!valor) return '-';
  return new Date(valor).toLocaleString('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Colores de Chakra asociados a cada estado del pedido. */
export const COLOR_ESTADO_PEDIDO = {
  pendiente: 'yellow',
  confirmado: 'blue',
  preparando: 'purple',
  enviado: 'cyan',
  entregado: 'green',
  cancelado: 'red',
};

/** Colores de Chakra asociados a cada estado de pago. */
export const COLOR_ESTADO_PAGO = {
  pendiente: 'yellow',
  pagado: 'green',
  fallido: 'red',
  reembolsado: 'gray',
};

export default { moneda, fechaCorta, fechaHora, COLOR_ESTADO_PEDIDO, COLOR_ESTADO_PAGO };
