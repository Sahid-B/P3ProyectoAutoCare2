const express = require('express');
const { verificarToken, verificarRoles, verificarRolVendedor } = require('../middlewares/auth-middleware');
const {
  listarMetodosPago,
  crear,
  iniciarPago,
  confirmarPago,
  listarMisCompras,
  listarRecibidas,
  obtenerDetalle,
  actualizarEstado,
} = require('../controllers/compras-controller');

const router = express.Router();

router.use(verificarToken);

// Solo los clientes compran. Las rutas con nombre fijo van antes de "/:id".
router.get('/metodos-pago', listarMetodosPago);
router.get('/mis-compras', verificarRoles('usuario', 'taller'), listarMisCompras);
router.get('/recibidas', verificarRolVendedor, listarRecibidas);

router.post('/', verificarRoles('usuario', 'taller'), crear);
router.post('/:id/pago/iniciar', verificarRoles('usuario', 'taller'), iniciarPago);
router.post('/:id/pago/confirmar', verificarRoles('usuario', 'taller'), confirmarPago);

// El detalle valida dentro del servicio que quien consulta sea el cliente,
// el vendedor del pedido o un administrador.
router.get('/:id', obtenerDetalle);
router.patch('/:id/estado', verificarRolVendedor, actualizarEstado);

module.exports = router;
