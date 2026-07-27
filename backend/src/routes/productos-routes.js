const express = require('express');
const { verificarToken, verificarRoles } = require('../middlewares/auth-middleware');
const {
  listarCategorias,
  listarMarcas,
  listarCatalogo,
  listarMisProductos,
  obtenerDetalle,
  obtenerMiProducto,
  crear,
  actualizar,
  eliminar,
} = require('../controllers/productos-controller');

const router = express.Router();

router.use(verificarToken);

const verificarGestorProductos = verificarRoles('vendedor_repuestos', 'admin');

// Catalogo y filtros: cualquier usuario autenticado.
// Las rutas con nombre fijo van antes de "/:id" para que no las capture.
router.get('/categorias', listarCategorias);
router.get('/marcas', listarMarcas);
router.get('/catalogo', listarCatalogo);

// Gestion de productos: rol vendedor_repuestos o admin.
router.get('/mis-productos', verificarGestorProductos, listarMisProductos);
router.get('/mis-productos/:id', verificarGestorProductos, obtenerMiProducto);
router.post('/', verificarGestorProductos, crear);
router.put('/:id', verificarGestorProductos, actualizar);
router.delete('/:id', verificarGestorProductos, eliminar);

// Detalle publico de un producto.
router.get('/:id', obtenerDetalle);

module.exports = router;
