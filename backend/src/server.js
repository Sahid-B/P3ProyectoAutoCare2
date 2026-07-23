require('dotenv').config();

const app = require('./app');
const { esperarBaseDeDatos } = require('./config/database');

const PUERTO = Number(process.env.PORT) || 3000;

// Punto de entrada del backend de AutoCare.
async function iniciarServidor() {
  // Se espera a PostgreSQL, pero el servidor arranca igual para que
  // GET /api/health pueda informar que la base de datos no responde.
  await esperarBaseDeDatos();

  app.listen(PUERTO, () => {
    console.log(`[api] AutoCare escuchando en http://localhost:${PUERTO}`);
    console.log(`[api] Estado del servicio: http://localhost:${PUERTO}/api/health`);
  });
}

iniciarServidor();
