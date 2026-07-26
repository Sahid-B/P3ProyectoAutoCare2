const express = require('express');
const { verificarToken } = require('../middlewares/auth-middleware');
const { listarUbicaciones } = require('../controllers/mapa-controller');

const router = express.Router();

router.get('/ubicaciones', verificarToken, listarUbicaciones);

module.exports = router;
