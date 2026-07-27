const express = require('express');
const { verificarToken, verificarRolAdmin } = require('../middlewares/auth-middleware');
const { listarTodos, obtenerMiTaller, actualizarMiTaller, actualizarTaller, eliminarTaller } = require('../controllers/talleres-controller');

const router = express.Router();

router.get('/', verificarToken, listarTodos);
router.get('/mi-taller', verificarToken, obtenerMiTaller);
router.put('/mi-taller', verificarToken, actualizarMiTaller);
router.put('/:id', verificarToken, verificarRolAdmin, actualizarTaller);
router.delete('/:id', verificarToken, verificarRolAdmin, eliminarTaller);

module.exports = router;
