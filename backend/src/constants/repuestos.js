// Constantes compartidas del modulo de repuestos.

// Categorias iniciales del catalogo. Se exponen por API para que el frontend
// no tenga que duplicar la lista.
const CATEGORIAS = [
  'Motor',
  'Frenos',
  'Suspension',
  'Electricidad',
  'Aceites',
  'Filtros',
  'Llantas',
  'Iluminacion',
  'Accesorios',
  'Personalizacion',
];

// Estados validos del pedido y transiciones permitidas para el vendedor.
const ESTADOS_PEDIDO = ['pendiente', 'confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'];

const ESTADOS_PAGO = ['pendiente', 'pagado', 'fallido', 'reembolsado'];

const ESTADOS_PRODUCTO = ['activo', 'inactivo'];

const ESTADOS_TIENDA = ['activo', 'inactivo', 'suspendido'];

module.exports = {
  CATEGORIAS,
  ESTADOS_PEDIDO,
  ESTADOS_PAGO,
  ESTADOS_PRODUCTO,
  ESTADOS_TIENDA,
};
