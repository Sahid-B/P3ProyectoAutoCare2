const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

// Runner de migraciones de AutoCare.
// - Registra en la tabla schema_migrations que migraciones ya se aplicaron.
// - Ejecuta unicamente las pendientes, en orden alfabetico, dentro de una transaccion.
// - Las migraciones estan escritas de forma idempotente (IF NOT EXISTS), por lo que
//   volver a arrancar el backend no produce errores ni duplica datos.
//
// Ubicacion de los .sql: se resuelve por candidatos para funcionar tanto en Docker
// (donde database/migrations se monta en /app/database/migrations) como en ejecucion
// local (carpeta database/migrations en la raiz del proyecto).

function resolverDirectorioMigraciones() {
  const candidatos = [
    process.env.MIGRATIONS_DIR,
    path.join(process.cwd(), 'database', 'migrations'),
    path.join(__dirname, '..', '..', 'database', 'migrations'),
    path.join(__dirname, '..', '..', '..', 'database', 'migrations'),
  ].filter(Boolean);

  for (const dir of candidatos) {
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

async function ejecutarMigraciones() {
  const dir = resolverDirectorioMigraciones();

  if (!dir) {
    console.warn('[migraciones] No se encontro la carpeta de migraciones. Se omite el runner.');
    return;
  }

  const archivos = fs
    .readdirSync(dir)
    .filter((nombre) => nombre.endsWith('.sql'))
    .sort();

  if (archivos.length === 0) {
    console.log('[migraciones] No hay archivos de migracion para aplicar.');
    return;
  }

  const cliente = await pool.connect();
  try {
    // 1) Tabla de control de migraciones
    await cliente.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        nombre VARCHAR(255) PRIMARY KEY,
        aplicada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2) Migraciones ya aplicadas
    const { rows } = await cliente.query('SELECT nombre FROM schema_migrations');
    const aplicadas = new Set(rows.map((r) => r.nombre));

    let nuevas = 0;

    // 3) Ejecutar cada pendiente dentro de una transaccion
    for (const archivo of archivos) {
      if (aplicadas.has(archivo)) continue;

      const sql = fs.readFileSync(path.join(dir, archivo), 'utf8');

      try {
        await cliente.query('BEGIN');
        await cliente.query(sql);
        await cliente.query('INSERT INTO schema_migrations (nombre) VALUES ($1)', [archivo]);
        await cliente.query('COMMIT');
        console.log(`[migraciones] Aplicada: ${archivo}`);
        nuevas += 1;
      } catch (error) {
        await cliente.query('ROLLBACK');
        // Se relanza para detener el arranque ante un fallo critico.
        throw new Error(`Fallo la migracion "${archivo}": ${error.message}`);
      }
    }

    if (nuevas === 0) {
      console.log('[migraciones] Base de datos al dia. No habia migraciones pendientes.');
    } else {
      console.log(`[migraciones] ${nuevas} migracion(es) aplicada(s) correctamente.`);
    }
  } finally {
    cliente.release();
  }
}

module.exports = { ejecutarMigraciones };
