const { pool } = require('../config/database');
const pagosService = require('./pagos-service');

// Servicio de compras de repuestos.
//
// Ciclo de vida de una compra:
//   1. crearPedidos: valida stock, reserva las unidades y crea la compra en estado
//      pendiente / pago pendiente. El carrito se divide en una compra por vendedor.
//   2. iniciarPago: pide al proveedor (PayPal Sandbox o modo simulado) una orden.
//   3. confirmarPago: captura el cobro. La compra pasa a pagada SOLO si el
//      proveedor responde con una captura completada.
//
// Si el pago falla o el pedido se cancela, las unidades reservadas se devuelven
// al stock dentro de la misma transaccion.

class ErrorCompra extends Error {
  constructor(mensaje, estado = 400) {
    super(mensaje);
    this.estado = estado;
  }
}

/**
 * Crea una compra por cada vendedor presente en el carrito.
 * items: [{ producto_id, cantidad }]
 */
async function crearPedidos(clienteId, items) {
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    // Se bloquean las filas de los productos implicados para que dos compras
    // simultaneas no puedan vender la misma unidad.
    const idsProductos = items.map((item) => item.producto_id);
    const { rows: productos } = await cliente.query(
      `SELECT p.id, p.vendedor_id, p.nombre, p.precio, p.stock, p.estado,
              v.estado AS estado_tienda, u.is_active
       FROM productos p
       JOIN vendedores_repuestos v ON p.vendedor_id = v.id
       JOIN users u ON v.usuario_id = u.id
       WHERE p.id = ANY($1::int[])
       FOR UPDATE OF p`,
      [idsProductos],
    );

    const porId = new Map(productos.map((producto) => [producto.id, producto]));
    const porVendedor = new Map();

    for (const item of items) {
      const producto = porId.get(item.producto_id);

      if (!producto) {
        throw new ErrorCompra(`El producto ${item.producto_id} ya no esta disponible.`, 404);
      }
      if (producto.estado !== 'activo' || producto.estado_tienda !== 'activo' || !producto.is_active) {
        throw new ErrorCompra(`El producto "${producto.nombre}" ya no esta a la venta.`);
      }
      if (producto.stock < item.cantidad) {
        throw new ErrorCompra(
          `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}.`,
        );
      }

      const precioUnitario = Number(producto.precio);
      const subtotal = Number((precioUnitario * item.cantidad).toFixed(2));

      if (!porVendedor.has(producto.vendedor_id)) {
        porVendedor.set(producto.vendedor_id, { total: 0, detalles: [] });
      }

      const grupo = porVendedor.get(producto.vendedor_id);
      grupo.total = Number((grupo.total + subtotal).toFixed(2));
      grupo.detalles.push({
        producto_id: producto.id,
        producto_nombre: producto.nombre,
        cantidad: item.cantidad,
        precio_unitario: precioUnitario,
        subtotal,
      });
    }

    const comprasCreadas = [];

    for (const [vendedorId, grupo] of porVendedor.entries()) {
      const { rows: filasCompra } = await cliente.query(
        `INSERT INTO compras (cliente_id, vendedor_id, total)
         VALUES ($1, $2, $3)
         RETURNING id, cliente_id, vendedor_id, total, metodo_pago, estado_pago,
                   transaccion_id, fecha_pago, estado_pedido, created_at`,
        [clienteId, vendedorId, grupo.total],
      );
      const compra = filasCompra[0];

      for (const detalle of grupo.detalles) {
        await cliente.query(
          `INSERT INTO compra_detalles
             (compra_id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            compra.id,
            detalle.producto_id,
            detalle.producto_nombre,
            detalle.cantidad,
            detalle.precio_unitario,
            detalle.subtotal,
          ],
        );

        // Reserva de stock. La condicion stock >= cantidad protege ante cualquier
        // condicion de carrera que se escape del bloqueo anterior.
        const { rowCount } = await cliente.query(
          'UPDATE productos SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND stock >= $1',
          [detalle.cantidad, detalle.producto_id],
        );

        if (rowCount === 0) {
          throw new ErrorCompra(`Stock insuficiente para "${detalle.producto_nombre}".`);
        }
      }

      compra.detalles = grupo.detalles;
      comprasCreadas.push(compra);
    }

    await cliente.query('COMMIT');
    return comprasCreadas;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

async function obtenerCompra(compraId) {
  const { rows } = await pool.query(
    `SELECT id, cliente_id, vendedor_id, total, metodo_pago, estado_pago,
            transaccion_id, fecha_pago, estado_pedido, created_at
     FROM compras WHERE id = $1`,
    [compraId],
  );
  return rows[0] || null;
}

/**
 * Devuelve al stock las unidades reservadas por una compra.
 */
async function devolverStock(cliente, compraId) {
  await cliente.query(
    `UPDATE productos p
     SET stock = p.stock + d.cantidad, updated_at = CURRENT_TIMESTAMP
     FROM compra_detalles d
     WHERE d.compra_id = $1 AND d.producto_id = p.id`,
    [compraId],
  );
}

/**
 * Pide una orden de pago al proveedor y guarda el metodo elegido.
 */
async function iniciarPago(compraId, clienteId, metodo) {
  const compra = await obtenerCompra(compraId);

  if (!compra) throw new ErrorCompra('La compra no existe.', 404);
  if (compra.cliente_id !== clienteId) throw new ErrorCompra('Esta compra no te pertenece.', 403);
  if (compra.estado_pago === 'pagado') throw new ErrorCompra('Esta compra ya fue pagada.');
  if (compra.estado_pedido === 'cancelado') throw new ErrorCompra('Esta compra fue cancelada.');
  if (!pagosService.metodoSoportado(metodo)) {
    throw new ErrorCompra('El metodo de pago seleccionado no esta disponible en el servidor.');
  }

  const orden = await pagosService.crearOrden({
    metodo,
    total: compra.total,
    referencia: compra.id,
  });

  await pool.query('UPDATE compras SET metodo_pago = $1 WHERE id = $2', [metodo, compraId]);

  return orden;
}

/**
 * Captura el pago. La compra solo pasa a "pagado" con una respuesta valida del
 * proveedor. Si el proveedor rechaza el pago se libera el stock reservado.
 */
async function confirmarPago(compraId, clienteId, ordenId) {
  const compra = await obtenerCompra(compraId);

  if (!compra) throw new ErrorCompra('La compra no existe.', 404);
  if (compra.cliente_id !== clienteId) throw new ErrorCompra('Esta compra no te pertenece.', 403);
  if (compra.estado_pago === 'pagado') throw new ErrorCompra('Esta compra ya fue pagada.');
  if (compra.estado_pedido === 'cancelado') throw new ErrorCompra('Esta compra fue cancelada.');
  if (!ordenId) throw new ErrorCompra('Falta el identificador de la orden de pago.');

  const resultado = await pagosService.capturarOrden({ metodo: compra.metodo_pago, ordenId });

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    if (!resultado.pagado) {
      await devolverStock(cliente, compraId);
      await cliente.query(
        "UPDATE compras SET estado_pago = 'fallido', estado_pedido = 'cancelado' WHERE id = $1",
        [compraId],
      );
      await cliente.query('COMMIT');
      return { pagado: false, mensaje: resultado.mensaje, compra: await obtenerCompra(compraId) };
    }

    const { rows } = await cliente.query(
      `UPDATE compras
       SET estado_pago = 'pagado',
           estado_pedido = 'confirmado',
           transaccion_id = $1,
           fecha_pago = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, cliente_id, vendedor_id, total, metodo_pago, estado_pago,
                 transaccion_id, fecha_pago, estado_pedido, created_at`,
      [resultado.transaccionId, compraId],
    );

    await cliente.query('COMMIT');
    return { pagado: true, mensaje: resultado.mensaje, compra: rows[0] };
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

async function listarPorCliente(clienteId) {
  const { rows } = await pool.query(
    `SELECT c.id, c.total, c.metodo_pago, c.estado_pago, c.transaccion_id, c.fecha_pago,
            c.estado_pedido, c.created_at,
            v.nombre_local, v.direccion, v.telefono,
            COUNT(d.id) AS total_items
     FROM compras c
     JOIN vendedores_repuestos v ON c.vendedor_id = v.id
     LEFT JOIN compra_detalles d ON d.compra_id = c.id
     WHERE c.cliente_id = $1
     GROUP BY c.id, v.id
     ORDER BY c.created_at DESC`,
    [clienteId],
  );
  return rows;
}

async function listarPorVendedor(vendedorId, limite = null) {
  const valores = [vendedorId];
  let sql = `SELECT c.id, c.total, c.metodo_pago, c.estado_pago, c.transaccion_id, c.fecha_pago,
                    c.estado_pedido, c.created_at,
                    u.nombre AS cliente_nombre, u.apellido AS cliente_apellido, u.correo AS cliente_correo,
                    COUNT(d.id) AS total_items
             FROM compras c
             JOIN users u ON c.cliente_id = u.id
             LEFT JOIN compra_detalles d ON d.compra_id = c.id
             WHERE c.vendedor_id = $1
             GROUP BY c.id, u.id
             ORDER BY c.created_at DESC`;

  if (limite) {
    valores.push(limite);
    sql += ` LIMIT $${valores.length}`;
  }

  const { rows } = await pool.query(sql, valores);
  return rows;
}

/**
 * Detalle completo de una compra. Comprueba que quien consulta sea el cliente
 * que la hizo, el vendedor que la recibio o un administrador.
 */
async function obtenerDetalle(compraId, usuario) {
  const { rows } = await pool.query(
    `SELECT c.id, c.cliente_id, c.vendedor_id, c.total, c.metodo_pago, c.estado_pago,
            c.transaccion_id, c.fecha_pago, c.estado_pedido, c.created_at,
            v.nombre_local, v.direccion AS tienda_direccion, v.telefono AS tienda_telefono,
            v.horario AS tienda_horario, v.usuario_id AS vendedor_usuario_id,
            u.nombre AS cliente_nombre, u.apellido AS cliente_apellido, u.correo AS cliente_correo
     FROM compras c
     JOIN vendedores_repuestos v ON c.vendedor_id = v.id
     JOIN users u ON c.cliente_id = u.id
     WHERE c.id = $1`,
    [compraId],
  );

  const compra = rows[0];
  if (!compra) return null;

  const esCliente = compra.cliente_id === usuario.id;
  const esVendedor = compra.vendedor_usuario_id === usuario.id;
  const esAdmin = usuario.rol === 'admin';

  if (!esCliente && !esVendedor && !esAdmin) {
    throw new ErrorCompra('No tienes acceso a este pedido.', 403);
  }

  const { rows: detalles } = await pool.query(
    `SELECT id, producto_id, producto_nombre, cantidad, precio_unitario, subtotal
     FROM compra_detalles WHERE compra_id = $1 ORDER BY id ASC`,
    [compraId],
  );

  return { ...compra, detalles };
}

/**
 * El vendedor cambia el estado del pedido. Cancelar devuelve el stock reservado.
 */
async function actualizarEstadoPedido(compraId, vendedorId, nuevoEstado) {
  const compra = await obtenerCompra(compraId);

  if (!compra) throw new ErrorCompra('El pedido no existe.', 404);
  if (compra.vendedor_id !== vendedorId) throw new ErrorCompra('Este pedido no pertenece a tu tienda.', 403);
  if (compra.estado_pedido === nuevoEstado) {
    return compra;
  }
  if (compra.estado_pedido === 'cancelado') {
    throw new ErrorCompra('Un pedido cancelado no puede cambiar de estado.');
  }
  if (compra.estado_pedido === 'entregado') {
    throw new ErrorCompra('Un pedido entregado no puede cambiar de estado.');
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    if (nuevoEstado === 'cancelado') {
      await devolverStock(cliente, compraId);
    }

    const { rows } = await cliente.query(
      `UPDATE compras SET estado_pedido = $1 WHERE id = $2
       RETURNING id, cliente_id, vendedor_id, total, metodo_pago, estado_pago,
                 transaccion_id, fecha_pago, estado_pedido, created_at`,
      [nuevoEstado, compraId],
    );

    await cliente.query('COMMIT');
    return rows[0];
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

module.exports = {
  ErrorCompra,
  crearPedidos,
  obtenerCompra,
  iniciarPago,
  confirmarPago,
  listarPorCliente,
  listarPorVendedor,
  obtenerDetalle,
  actualizarEstadoPedido,
};
