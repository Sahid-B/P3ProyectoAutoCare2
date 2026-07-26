require('dotenv').config();

const app = require('./app');
const { esperarBaseDeDatos } = require('./config/database');
const { ejecutarMigraciones } = require('./config/run-migrations');

const PUERTO = Number(process.env.PORT) || 3000;

// Punto de entrada del backend de AutoCare.
async function iniciarServidor() {
  // Se espera a PostgreSQL antes de continuar.
  await esperarBaseDeDatos();

  // Se aplican las migraciones pendientes. Si una migracion critica falla,
  // se detiene el arranque para no operar con un esquema inconsistente.

  try {
    await ejecutarMigraciones();
  } catch (error) {
    console.error('[migraciones] Error critico aplicando migraciones:', error.message);
    process.exit(1);
  }

  app.listen(PUERTO, () => {
    console.log(`[api] AutoCare escuchando en http://localhost:${PUERTO}`);
    console.log(`[api] Estado del servicio: http://localhost:${PUERTO}/api/health`);
  });
}

iniciarServidor();
