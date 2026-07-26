const comprasService = require('../services/compras-service');
const vendedoresService = require('../services/vendedores-service');
const pagosService = require('../services/pagos-service');
const { ESTADOS_PEDIDO } = require('../constants/repuestos');

const { ErrorCompra } = comprasService;

/**
 * Traduce los errores de negocio del servicio a respuestas HTTP.
 */
function responderError(res, error, mensajeGenerico) {
  if (error instanceof ErrorCompra) {
    return res.status(error.estado).json({ success: false, message: error.message });
  }
  console.error(`[compras-controller] ${mensajeGenerico}:`, error);
  return res.status(500).json({ success: false, message: mensajeGenerico });
}

/**
 * Normaliza y valida los items recibidos del carrito.
 */
function validarItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'El carrito esta vacio.' };
  }

  const normalizados = [];
  const vistos = new Set();

  for (const item of items) {
    const productoId = Number(item?.producto_id);
    const cantidad = Number(item?.cantidad);

    if (!Number.isInteger(productoId) || productoId <= 0) {
      return { error: 'Uno de los productos del carrito no es valido.' };
    }
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return { error: 'La cantidad de cada producto debe ser un entero mayor que cero.' };
    }
    if (cantidad > 999) {
      return { error: 'La cantidad maxima por producto es 999 unidades.' };
    }
    if (vistos.has(productoId)) {
      return { error: 'El carrito contiene productos repetidos.' };
    }

    vistos.add(productoId);
    normalizados.push({ producto_id: productoId, cantidad });
  }

  return { items: normalizados };
}

/**
 * Metodos de pago habilitados en el servidor.
 * GET /api/compras/metodos-pago
 */
function listarMetodosPago(_req, res) {
  return res.json({
    success: true,
    metodos: pagosService.metodosDisponibles(),
    moneda: pagosService.MONEDA,
  });
}

/**
 * Crea los pedidos a partir del carrito (una compra por vendedor).
 * POST /api/compras
 */
async function crear(req, res) {
  try {
    const { items, error: errorItems } = validarItems(req.body.items);

    if (errorItems) {
      return res.status(400).json({ success: false, message: errorItems });
    }

    const compras = await comprasService.crearPedidos(req.usuario.id, items);

    return res.status(201).json({
      success: true,
      message: 'Pedido creado. Falta completar el pago.',
      compras,
    });
  } catch (error) {
    return responderError(res, error, 'Error al crear el pedido');
  }
}

/**
 * Solicita al proveedor la orden de pago.
 * POST /api/compras/:id/pago/iniciar
 */
async function iniciarPago(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Identificador de compra invalido.' });
    }

    const { metodo } = req.body;
    if (!metodo) {
      return res.status(400).json({ success: false, message: 'Debes indicar el metodo de pago.' });
    }

    const orden = await comprasService.iniciarPago(id, req.usuario.id, metodo);
    return res.json({ success: true, orden });
  } catch (error) {
    return responderError(res, error, 'Error al iniciar el pago');
  }
}

/**
 * Captura el cobro y marca la compra como pagada si el proveedor lo confirma.
 * POST /api/compras/:id/pago/confirmar
 */
async function confirmarPago(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Identificador de compra invalido.' });
    }

    const resultado = await comprasService.confirmarPago(id, req.usuario.id, req.body.ordenId);

    if (!resultado.pagado) {
      return res.status(402).json({
        success: false,
        message: resultado.mensaje || 'El pago no pudo confirmarse.',
        compra: resultado.compra,
      });
    }

    return res.json({
      success: true,
      message: 'Pago confirmado. Tu pedido fue enviado a la tienda.',
      compra: resultado.compra,
    });
  } catch (error) {
    return responderError(res, error, 'Error al confirmar el pago');
  }
}

/**
 * Pedidos del cliente autenticado.
 * GET /api/compras/mis-compras
 */
async function listarMisCompras(req, res) {
  try {
    const compras = await comprasService.listarPorCliente(req.usuario.id);
    return res.json({ success: true, data: compras });
  } catch (error) {
    return responderError(res, error, 'Error al obtener tus compras');
  }
}

/**
 * Pedidos recibidos por la tienda del vendedor autenticado.
 * GET /api/compras/recibidas
 */
async function listarRecibidas(req, res) {
  try {
    const tienda = await vendedoresService.obtenerPorUsuario(req.usuario.id);
    if (!tienda) {
      return res.status(404).json({
        success: false,
        message: 'Debes registrar tu tienda para ver los pedidos.',
      });
    }

    const limite = req.query.limite ? Number(req.query.limite) : null;
    const compras = await comprasService.listarPorVendedor(
      tienda.id,
      Number.isInteger(limite) && limite > 0 ? limite : null,
    );

    return res.json({ success: true, data: compras });
  } catch (error) {
    return responderError(res, error, 'Error al obtener los pedidos');
  }
}

/**
 * Detalle de un pedido (cliente propietario, vendedor receptor o administrador).
 * GET /api/compras/:id
 */
async function obtenerDetalle(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Identificador de compra invalido.' });
    }

    const compra = await comprasService.obtenerDetalle(id, req.usuario);

    if (!compra) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado.' });
    }

    return res.json({ success: true, compra });
  } catch (error) {
    return responderError(res, error, 'Error al obtener el pedido');
  }
}

/**
 * El vendedor cambia el estado del pedido.
 * PATCH /api/compras/:id/estado
 */
async function actualizarEstado(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Identificador de compra invalido.' });
    }

    const { estado_pedido } = req.body;
    if (!estado_pedido || !ESTADOS_PEDIDO.includes(estado_pedido)) {
      return res.status(400).json({
        success: false,
        message: `El estado debe ser uno de: ${ESTADOS_PEDIDO.join(', ')}.`,
      });
    }

    const tienda = await vendedoresService.obtenerPorUsuario(req.usuario.id);
    if (!tienda) {
      return res.status(404).json({ success: false, message: 'No tienes una tienda registrada.' });
    }

    const compra = await comprasService.actualizarEstadoPedido(id, tienda.id, estado_pedido);

    return res.json({
      success: true,
      message: 'Estado del pedido actualizado.',
      compra,
    });
  } catch (error) {
    return responderError(res, error, 'Error al actualizar el estado del pedido');
  }
}

module.exports = {
  listarMetodosPago,
  crear,
  iniciarPago,
  confirmarPago,
  listarMisCompras,
  listarRecibidas,
  obtenerDetalle,
  actualizarEstado,
};
