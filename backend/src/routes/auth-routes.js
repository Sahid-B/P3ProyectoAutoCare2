const express = require('express');
const {
  registrar,
  iniciarSesion,
  obtenerPerfil,
  cerrarSesion,
} = require('../controllers/auth-controller');
const { verificarToken } = require('../middlewares/auth-middleware');

const router = express.Router();

// Rutas publicas
router.post('/register', registrar);
router.post('/login', iniciarSesion);
router.post('/logout', cerrarSesion);

// Ruta protegida con JWT
router.get('/me', verificarToken, obtenerPerfil);

module.exports = router;
