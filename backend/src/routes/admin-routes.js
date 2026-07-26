const express = require('express');
const {
  getStats,
  getUsers,
  toggleUserStatus,
  getVendedores,
  cambiarEstadoVendedor,
  getProductosDeVendedor,
  getCompras,
} = require('../controllers/admin-controller');
const { verificarToken, verificarRolAdmin } = require('../middlewares/auth-middleware');

const router = express.Router();

// Todas las rutas de admin requieren token válido y rol de administrador
router.use(verificarToken);
router.use(verificarRolAdmin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.post('/users/:id/toggle-status', toggleUserStatus);

// Modulo de repuestos
router.get('/vendedores', getVendedores);
router.post('/vendedores/:id/estado', cambiarEstadoVendedor);
router.get('/vendedores/:id/productos', getProductosDeVendedor);
router.get('/compras', getCompras);

module.exports = router;
