const express = require('express');
const { verificarToken, verificarRolVendedor } = require('../middlewares/auth-middleware');
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

// Catalogo y filtros: cualquier usuario autenticado.
// Las rutas con nombre fijo van antes de "/:id" para que no las capture.
router.get('/categorias', listarCategorias);
router.get('/marcas', listarMarcas);
router.get('/catalogo', listarCatalogo);

// Gestion de productos propios: solo el rol vendedor_repuestos.
router.get('/mis-productos', verificarRolVendedor, listarMisProductos);
router.get('/mis-productos/:id', verificarRolVendedor, obtenerMiProducto);
router.post('/', verificarRolVendedor, crear);
router.put('/:id', verificarRolVendedor, actualizar);
router.delete('/:id', verificarRolVendedor, eliminar);

// Detalle publico de un producto.
router.get('/:id', obtenerDetalle);

module.exports = router;
