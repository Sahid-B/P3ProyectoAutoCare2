const express = require('express');
const {
  registrar,
  iniciarSesion,
  verificarLogin2FA,
  obtenerPerfil,
  actualizarPerfil,
  generarSecretoTOTP,
  alternar2FA,
  enviarOtpPrueba,
  cerrarSesion,
  autenticarConGoogle,
} = require('../controllers/auth-controller');
const { verificarToken } = require('../middlewares/auth-middleware');

const router = express.Router();

// Rutas publicas
router.post('/register', registrar);
router.post('/login', iniciarSesion);
router.post('/logout', cerrarSesion);
router.post('/google', autenticarConGoogle);
router.post('/2fa/verify-login', verificarLogin2FA);

// Rutas protegidas con JWT
router.get('/me', verificarToken, obtenerPerfil);
router.put('/profile', verificarToken, actualizarPerfil);
router.post('/2fa/totp/setup', verificarToken, generarSecretoTOTP);
router.post('/2fa/toggle', verificarToken, alternar2FA);
router.post('/2fa/send-email-otp', verificarToken, enviarOtpPrueba);

module.exports = router;
