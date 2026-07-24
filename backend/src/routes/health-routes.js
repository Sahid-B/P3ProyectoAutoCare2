const { Router } = require('express');
const { verificarConexion } = require('../config/database');

const router = Router();

/**
 * GET /api/health
 * Informa el estado de la API y comprueba realmente la conexion con PostgreSQL.
 */
router.get('/health', async (_peticion, respuesta) => {
  let baseDeDatos = 'disconnected';
  let detalleError = null;

  try {
    await verificarConexion();
    baseDeDatos = 'connected';
  } catch (error) {
    detalleError = error.message;
  }

  const conectada = baseDeDatos === 'connected';

  respuesta.status(conectada ? 200 : 503).json({
    success: conectada,
    project: 'AutoCare',
    api: 'online',
    database: baseDeDatos,
    timestamp: new Date().toISOString(),
    ...(detalleError ? { message: detalleError } : {}),
  });
});

module.exports = router;
