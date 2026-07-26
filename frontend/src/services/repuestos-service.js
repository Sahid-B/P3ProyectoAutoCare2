// Servicio del modulo de repuestos (tiendas, productos y compras).
// Reutiliza el helper "peticion", que ya adjunta el token JWT.
import { peticion } from './api-service.js';

// --- Tienda del vendedor ---

export function obtenerMiTienda() {
  return peticion('/vendedores/mi-tienda');
}

export function guardarMiTienda(datos) {
  return peticion('/vendedores/mi-tienda', {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
}

export function obtenerEstadisticasVendedor() {
  return peticion('/vendedores/estadisticas');
}

export function obtenerTiendasPublicas() {
  return peticion('/vendedores/publicos');
}

export function obtenerTiendaPublica(id) {
  return peticion(`/vendedores/${id}/publico`);
}

// --- Productos ---

export function obtenerCategorias() {
  return peticion('/productos/categorias');
}

export function obtenerMarcas() {
  return peticion('/productos/marcas');
}

/**
 * Catalogo publico. filtros: { busqueda, categoria, marca, precioMin, precioMax, soloDisponibles }
 */
export function obtenerCatalogo(filtros = {}) {
  const parametros = new URLSearchParams();

  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') {
      parametros.append(clave, valor);
    }
  });

  const consulta = parametros.toString();
  return peticion(`/productos/catalogo${consulta ? `?${consulta}` : ''}`);
}

export function obtenerProducto(id) {
  return peticion(`/productos/${id}`);
}

export function obtenerMisProductos() {
  return peticion('/productos/mis-productos');
}

export function obtenerMiProducto(id) {
  return peticion(`/productos/mis-productos/${id}`);
}

export function crearProducto(datos) {
  return peticion('/productos', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
}

export function actualizarProducto(id, datos) {
  return peticion(`/productos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
}

export function eliminarProducto(id) {
  return peticion(`/productos/${id}`, {
    method: 'DELETE',
  });
}

// --- Compras ---

export function obtenerMetodosPago() {
  return peticion('/compras/metodos-pago');
}

/**
 * Crea los pedidos a partir del carrito. items: [{ producto_id, cantidad }]
 */
export function crearPedido(items) {
  return peticion('/compras', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export function iniciarPago(compraId, metodo) {
  return peticion(`/compras/${compraId}/pago/iniciar`, {
    method: 'POST',
    body: JSON.stringify({ metodo }),
  });
}

export function confirmarPago(compraId, ordenId) {
  return peticion(`/compras/${compraId}/pago/confirmar`, {
    method: 'POST',
    body: JSON.stringify({ ordenId }),
  });
}

export function obtenerMisCompras() {
  return peticion('/compras/mis-compras');
}

export function obtenerPedidosRecibidos(limite) {
  return peticion(`/compras/recibidas${limite ? `?limite=${limite}` : ''}`);
}

export function obtenerDetallePedido(id) {
  return peticion(`/compras/${id}`);
}

export function actualizarEstadoPedido(id, estadoPedido) {
  return peticion(`/compras/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado_pedido: estadoPedido }),
  });
}

// --- Mapa ---

export function obtenerUbicacionesMapa() {
  return peticion('/mapa/ubicaciones');
}

export default {
  obtenerMiTienda,
  guardarMiTienda,
  obtenerEstadisticasVendedor,
  obtenerTiendasPublicas,
  obtenerTiendaPublica,
  obtenerCategorias,
  obtenerMarcas,
  obtenerCatalogo,
  obtenerProducto,
  obtenerMisProductos,
  obtenerMiProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  obtenerMetodosPago,
  crearPedido,
  iniciarPago,
  confirmarPago,
  obtenerMisCompras,
  obtenerPedidosRecibidos,
  obtenerDetallePedido,
  actualizarEstadoPedido,
  obtenerUbicacionesMapa,
};
