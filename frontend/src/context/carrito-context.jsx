import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

// Carrito de repuestos del cliente.
// Se guarda en localStorage para que sobreviva a una recarga o a una perdida de
// conexion. Los precios se validan de nuevo en el backend al crear el pedido:
// lo que hay aqui es solo una copia para mostrar el resumen.

const CARRITO_KEY = 'autocare_carrito';

const CarritoContext = createContext(null);

function leerCarritoGuardado() {
  try {
    const guardado = localStorage.getItem(CARRITO_KEY);
    const items = guardado ? JSON.parse(guardado) : [];
    return Array.isArray(items) ? items : [];
  } catch (error) {
    console.warn('[carrito-context] No se pudo leer el carrito guardado:', error.message);
    return [];
  }
}

export function CarritoProvider({ children }) {
  const [items, setItems] = useState(leerCarritoGuardado);

  useEffect(() => {
    try {
      localStorage.setItem(CARRITO_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn('[carrito-context] No se pudo guardar el carrito:', error.message);
    }
  }, [items]);

  /** Agrega un producto o suma unidades si ya estaba en el carrito. */
  const agregarProducto = useCallback((producto, cantidad = 1) => {
    setItems((anteriores) => {
      const existente = anteriores.find((item) => item.producto_id === producto.id);
      const stockDisponible = Number(producto.stock);

      if (existente) {
        const nuevaCantidad = Math.min(existente.cantidad + cantidad, stockDisponible);
        return anteriores.map((item) =>
          item.producto_id === producto.id ? { ...item, cantidad: nuevaCantidad } : item,
        );
      }

      return [
        ...anteriores,
        {
          producto_id: producto.id,
          nombre: producto.nombre,
          precio: Number(producto.precio),
          imagen_url: producto.imagen_url || null,
          stock: stockDisponible,
          vendedor_id: producto.vendedor_id,
          nombre_local: producto.nombre_local || '',
          cantidad: Math.min(cantidad, stockDisponible),
        },
      ];
    });
  }, []);

  /** Fija la cantidad exacta de una linea, siempre dentro del stock disponible. */
  const cambiarCantidad = useCallback((productoId, cantidad) => {
    setItems((anteriores) =>
      anteriores.map((item) => {
        if (item.producto_id !== productoId) return item;
        const limitada = Math.max(1, Math.min(Number(cantidad) || 1, item.stock));
        return { ...item, cantidad: limitada };
      }),
    );
  }, []);

  const eliminarProducto = useCallback((productoId) => {
    setItems((anteriores) => anteriores.filter((item) => item.producto_id !== productoId));
  }, []);

  const vaciarCarrito = useCallback(() => setItems([]), []);

  const valor = useMemo(() => {
    const total = items.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
    const totalUnidades = items.reduce((suma, item) => suma + item.cantidad, 0);

    return {
      items,
      total: Number(total.toFixed(2)),
      totalUnidades,
      cantidadLineas: items.length,
      agregarProducto,
      cambiarCantidad,
      eliminarProducto,
      vaciarCarrito,
    };
  }, [items, agregarProducto, cambiarCantidad, eliminarProducto, vaciarCarrito]);

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}

export function useCarrito() {
  const contexto = useContext(CarritoContext);
  if (!contexto) {
    throw new Error('useCarrito debe ser utilizado dentro de un CarritoProvider');
  }
  return contexto;
}

export default CarritoContext;
