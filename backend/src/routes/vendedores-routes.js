const express = require('express');
const { verificarToken, verificarRolVendedor } = require('../middlewares/auth-middleware');
const {
  obtenerMiTienda,
  guardarMiTienda,
  obtenerEstadisticas,
  listarPublicas,
  obtenerTiendaPublica,
} = require('../controllers/vendedores-controller');

const router = express.Router();

// Todas las rutas requieren sesion iniciada.
router.use(verificarToken);

// Consulta abierta a cualquier usuario autenticado (clientes, talleres, admin).
router.get('/publicos', listarPublicas);
router.get('/:id/publico', obtenerTiendaPublica);

// Gestion de la tienda propia: solo el rol vendedor_repuestos.
router.get('/mi-tienda', verificarRolVendedor, obtenerMiTienda);
router.put('/mi-tienda', verificarRolVendedor, guardarMiTienda);
router.get('/estadisticas', verificarRolVendedor, obtenerEstadisticas);

module.exports = router;
