const { Pool } = require('pg');

// Pool de conexiones a PostgreSQL.
// Los datos de conexion se leen de las variables de entorno.
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'autocare',
      user: process.env.DB_USER || 'autocare_user',
      password: process.env.DB_PASSWORD || '',
    };

const pool = new Pool({
  ...poolConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (error) => {
  console.error('[base de datos] Error inesperado en el pool:', error.message);
});

/**
 * Comprueba la conexion con PostgreSQL ejecutando una consulta simple.
 * Devuelve true si la base de datos responde.
 */
async function verificarConexion() {
  const resultado = await pool.query('SELECT 1 AS conexion');
  return resultado.rows[0].conexion === 1;
}

/**
 * Espera a que PostgreSQL este disponible.
 * Es util cuando el backend arranca antes que la base de datos en Docker.
 */
async function esperarBaseDeDatos(intentos = 10, esperaMs = 3000) {
  for (let intento = 1; intento <= intentos; intento += 1) {
    try {
      await verificarConexion();
      console.log('[base de datos] Conexion establecida con PostgreSQL.');
      return true;
    } catch (error) {
      console.warn(
        `[base de datos] Intento ${intento}/${intentos} fallido: ${error.message}`,
      );

      if (intento === intentos) {
        console.error('[base de datos] No se pudo conectar con PostgreSQL.');
        return false;
      }

      await new Promise((resolver) => setTimeout(resolver, esperaMs));
    }
  }

  return false;
}

module.exports = { pool, verificarConexion, esperarBaseDeDatos };
