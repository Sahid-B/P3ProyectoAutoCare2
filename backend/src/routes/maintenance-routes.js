const express = require('express');
const {
  listar,
  obtenerEstadisticas,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
} = require('../controllers/maintenance-controller');
const { verificarToken } = require('../middlewares/auth-middleware');

const router = express.Router();

// Todas las rutas de mantenimientos requieren token JWT valido.
router.use(verificarToken);

router.get('/', listar);
router.get('/stats', obtenerEstadisticas);
router.get('/:id', obtenerPorId);
router.post('/', crear);
router.put('/:id', actualizar);
router.delete('/:id', eliminar);

module.exports = router;
