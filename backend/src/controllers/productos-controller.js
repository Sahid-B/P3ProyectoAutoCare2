const productosService = require('../services/productos-service');
const vendedoresService = require('../services/vendedores-service');
const { CATEGORIAS, ESTADOS_PRODUCTO } = require('../constants/repuestos');

/**
 * Valida los campos de un producto. Devuelve un mensaje de error o null.
 */
function validarProducto(datos) {
  if (!datos.nombre || !datos.nombre.trim()) {
    return 'El nombre del producto es obligatorio.';
  }
  if (!datos.categoria || !CATEGORIAS.includes(datos.categoria)) {
    return 'Debes seleccionar una categoria valida.';
  }

  const precio = Number(datos.precio);
  if (datos.precio === undefined || datos.precio === null || datos.precio === '' || Number.isNaN(precio)) {
    return 'El precio es obligatorio.';
  }
  if (precio <= 0) {
    return 'El precio debe ser mayor que cero.';
  }

  const stock = Number(datos.stock);
  if (datos.stock === undefined || datos.stock === null || datos.stock === '' || Number.isNaN(stock)) {
    return 'El stock es obligatorio.';
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return 'El stock debe ser un numero entero mayor o igual que cero.';
  }

  if (datos.estado && !ESTADOS_PRODUCTO.includes(datos.estado)) {
    return 'El estado del producto no es valido.';
  }

  return null;
}

/**
 * Obtiene la tienda del vendedor autenticado o responde 404.
 */
async function obtenerTiendaDelUsuario(req, res) {
  const tienda = await vendedoresService.obtenerPorUsuario(req.usuario.id);
  if (!tienda) {
    res.status(404).json({
      success: false,
      message: 'Debes registrar tu tienda antes de gestionar productos.',
    });
    return null;
  }
  return tienda;
}

/**
 * Categorias disponibles del catalogo.
 * GET /api/productos/categorias
 */
function listarCategorias(_req, res) {
  return res.json({ success: true, categorias: CATEGORIAS });
}

/**
 * Marcas presentes en el catalogo activo.
 * GET /api/productos/marcas
 */
async function listarMarcas(_req, res) {
  try {
    const marcas = await productosService.listarMarcas();
    return res.json({ success: true, marcas });
  } catch (error) {
    console.error('[productos-controller] Error al listar marcas:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener las marcas.' });
  }
}

/**
 * Catalogo publico con filtros.
 * GET /api/productos/catalogo
 */
async function listarCatalogo(req, res) {
  try {
    const { busqueda, categoria, marca, precioMin, precioMax, soloDisponibles, vendedorId } = req.query;

    const filtros = {
      busqueda: busqueda?.trim() || null,
      categoria: categoria && CATEGORIAS.includes(categoria) ? categoria : null,
      marca: marca?.trim() || null,
      precioMin: precioMin !== undefined && precioMin !== '' && !Number.isNaN(Number(precioMin))
        ? Number(precioMin)
        : null,
      precioMax: precioMax !== undefined && precioMax !== '' && !Number.isNaN(Number(precioMax))
        ? Number(precioMax)
        : null,
      soloDisponibles: soloDisponibles === 'true',
      vendedorId: vendedorId && Number.isInteger(Number(vendedorId)) ? Number(vendedorId) : null,
    };

    const productos = await productosService.listarCatalogo(filtros);
    return res.json({ success: true, data: productos });
  } catch (error) {
    console.error('[productos-controller] Error al listar el catalogo:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener el catalogo.' });
  }
}

/**
 * Productos de la tienda del vendedor autenticado.
 * GET /api/productos/mis-productos
 */
async function listarMisProductos(req, res) {
  try {
    const tienda = await obtenerTiendaDelUsuario(req, res);
    if (!tienda) return undefined;

    const productos = await productosService.listarPorVendedor(tienda.id);
    return res.json({ success: true, data: productos });
  } catch (error) {
    console.error('[productos-controller] Error al listar mis productos:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener los productos.' });
  }
}

/**
 * Detalle publico de un producto.
 * GET /api/productos/:id
 */
async function obtenerDetalle(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Identificador de producto invalido.' });
    }

    const producto = await productosService.obtenerDetallePublico(id);
    if (!producto) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
    }

    return res.json({ success: true, producto });
  } catch (error) {
    console.error('[productos-controller] Error al obtener el producto:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener el producto.' });
  }
}

/**
 * Producto propio (para el formulario de edicion del vendedor).
 * GET /api/productos/mis-productos/:id
 */
async function obtenerMiProducto(req, res) {
  try {
    const tienda = await obtenerTiendaDelUsuario(req, res);
    if (!tienda) return undefined;

    const id = Number(req.params.id);
    const producto = await productosService.obtenerPorId(id);

    if (!producto || producto.vendedor_id !== tienda.id) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado en tu tienda.' });
    }

    return res.json({ success: true, producto });
  } catch (error) {
    console.error('[productos-controller] Error al obtener mi producto:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener el producto.' });
  }
}

/**
 * Crea un producto en la tienda del vendedor autenticado.
 * POST /api/productos
 */
async function crear(req, res) {
  try {
    const esAdmin = req.usuario?.rol === 'admin';
    let vendedorId = null;

    if (esAdmin) {
      vendedorId = req.body.vendedor_id ? Number(req.body.vendedor_id) : null;
      if (!vendedorId) {
        // Si no mandó vendedor_id, tomar la primera tienda disponible
        const tiendas = await vendedoresService.listarPublicas();
        if (tiendas.length > 0) vendedorId = tiendas[0].id;
      }
    } else {
      const tienda = await obtenerTiendaDelUsuario(req, res);
      if (!tienda) return undefined;
      vendedorId = tienda.id;
    }

    if (!vendedorId) {
      return res.status(400).json({ success: false, message: 'No hay ninguna tienda asociada para crear el producto.' });
    }

    const mensajeError = validarProducto(req.body);
    if (mensajeError) {
      return res.status(400).json({ success: false, message: mensajeError });
    }

    const producto = await productosService.crear(vendedorId, {
      ...req.body,
      precio: Number(req.body.precio),
      stock: Number(req.body.stock),
    });

    return res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente.',
      producto,
    });
  } catch (error) {
    console.error('[productos-controller] Error al crear el producto:', error);
    return res.status(500).json({ success: false, message: 'Error al crear el producto.' });
  }
}

/**
 * Actualiza un producto propio.
 * PUT /api/productos/:id
 */
async function actualizar(req, res) {
  try {
    const esAdmin = req.usuario?.rol === 'admin';
    let vendedorId = null;

    if (!esAdmin) {
      const tienda = await obtenerTiendaDelUsuario(req, res);
      if (!tienda) return undefined;
      vendedorId = tienda.id;
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Identificador de producto invalido.' });
    }

    const mensajeError = validarProducto(req.body);
    if (mensajeError) {
      return res.status(400).json({ success: false, message: mensajeError });
    }

    const producto = await productosService.actualizar(id, vendedorId, {
      ...req.body,
      precio: Number(req.body.precio),
      stock: Number(req.body.stock),
    }, esAdmin);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'El producto no existe o no pertenece a tu tienda.',
      });
    }

    return res.json({
      success: true,
      message: 'Producto actualizado exitosamente.',
      producto,
    });
  } catch (error) {
    console.error('[productos-controller] Error al actualizar el producto:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar el producto.' });
  }
}

/**
 * Elimina un producto propio.
 * DELETE /api/productos/:id
 */
async function eliminar(req, res) {
  try {
    const esAdmin = req.usuario?.rol === 'admin';
    let vendedorId = null;

    if (!esAdmin) {
      const tienda = await obtenerTiendaDelUsuario(req, res);
      if (!tienda) return undefined;
      vendedorId = tienda.id;
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Identificador de producto invalido.' });
    }

    const eliminado = await productosService.eliminar(id, vendedorId, esAdmin);

    if (!eliminado) {
      return res.status(404).json({
        success: false,
        message: 'El producto no existe o no tienes permisos.',
      });
    }

    return res.json({ success: true, message: 'Producto eliminado exitosamente.' });
  } catch (error) {
    console.error('[productos-controller] Error al eliminar el producto:', error);
    return res.status(500).json({ success: false, message: 'Error al eliminar el producto.' });
  }
}

module.exports = {
  validarProducto,
  listarCategorias,
  listarMarcas,
  listarCatalogo,
  listarMisProductos,
  obtenerDetalle,
  obtenerMiProducto,
  crear,
  actualizar,
  eliminar,
};
