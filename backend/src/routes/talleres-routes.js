const express = require('express');
const { verificarToken } = require('../middlewares/auth-middleware');
const { listarTodos, obtenerMiTaller, actualizarMiTaller } = require('../controllers/talleres-controller');

const router = express.Router();

router.get('/', verificarToken, listarTodos);
router.get('/mi-taller', verificarToken, obtenerMiTaller);
router.put('/mi-taller', verificarToken, actualizarMiTaller);

module.exports = router;
