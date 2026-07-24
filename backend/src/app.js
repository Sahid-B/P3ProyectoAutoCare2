const express = require('express');
const cors = require('cors');

const healthRoutes = require('./routes/health-routes');
const authRoutes = require('./routes/auth-routes');

// Configuracion de la aplicacion Express de AutoCare.
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  }),
);
app.use(express.json());

// Rutas de la API
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);


// Ruta raiz informativa
app.get('/', (_peticion, respuesta) => {
  respuesta.json({
    success: true,
    project: 'AutoCare',
    message: 'API de AutoCare. Consulta GET /api/health para ver el estado del servicio.',
  });
});

// Ruta no encontrada
app.use((_peticion, respuesta) => {
  respuesta.status(404).json({
    success: false,
    message: 'Recurso no encontrado.',
  });
});

// Manejador de errores
app.use((error, _peticion, respuesta, _siguiente) => {
  console.error('[api] Error no controlado:', error.message);

  respuesta.status(500).json({
    success: false,
    message: 'Error interno del servidor.',
  });
});

module.exports = app;
