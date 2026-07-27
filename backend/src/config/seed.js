require('dotenv').config();
const { pool } = require('./database');

async function seed() {
  try {
    console.log('Iniciando seed de datos...');

    // 1. Vendedor 1
    let v1 = await pool.query("SELECT id FROM vendedores_repuestos WHERE nombre_local ILIKE '%todo gas%' LIMIT 1");
    let v1Id = v1.rows[0]?.id;
    if (!v1Id) {
      const userRes = await pool.query("SELECT id FROM users WHERE email_verified = true LIMIT 1");
      const userId = userRes.rows[0]?.id || 12;
      const res1 = await pool.query(
        "INSERT INTO vendedores_repuestos (usuario_id, nombre_local, descripcion, direccion, latitud, longitud, telefono, horario) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
        [userId, 'Repuestos A todo Gas', 'Venta de repuestos multimarca', 'Av. La Lorena', -0.258235, -79.145978, '0991884323', 'Lun-Vie 8:30-18:30']
      );
      v1Id = res1.rows[0].id;
    }

    // 2. Vendedor 2 'Repuestos Baratos'
    let v2 = await pool.query("SELECT id FROM vendedores_repuestos WHERE nombre_local ILIKE '%baratos%' LIMIT 1");
    let v2Id = v2.rows[0]?.id;
    if (!v2Id) {
      const adminRes = await pool.query("SELECT id FROM users WHERE rol = 'admin' LIMIT 1");
      const adminId = adminRes.rows[0]?.id || 3;
      const res2 = await pool.query(
        "INSERT INTO vendedores_repuestos (usuario_id, nombre_local, descripcion, direccion, latitud, longitud, telefono, horario) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
        [adminId, 'Repuestos Baratos', 'Repuestos económicos y de calidad', 'Calle Los Chacos', -0.251000, -79.155000, '0987654321', 'Lun-Sab 8:00-19:00']
      );
      v2Id = res2.rows[0].id;
    }

    // 3. Productos
    const prodCheck = await pool.query('SELECT COUNT(*) FROM productos');
    if (parseInt(prodCheck.rows[0].count) === 0) {
      await pool.query(
        "INSERT INTO productos (vendedor_id, nombre, descripcion, categoria, marca, compatibilidad, precio, stock, imagen_url, estado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [v1Id, 'Llanta Rin 15 Goodyear', 'Llanta Goodyear Eagle Sport 195/65 R15 con excelente agarre.', 'llantas', 'Goodyear', 'Universal Rin 15', 75.50, 12, 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=500', 'activo']
      );
      await pool.query(
        "INSERT INTO productos (vendedor_id, nombre, descripcion, categoria, marca, compatibilidad, precio, stock, imagen_url, estado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [v2Id, 'Parabrisas Delantero Templado', 'Parabrisas delantero con laminado de seguridad y filtro UV.', 'carroceria', 'GlassTech', 'Chevrolet Aveo / Sail', 110.00, 5, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500', 'activo']
      );
      console.log('Productos creados con exito.');
    }

    // 4. Auto en venta
    const carCheck = await pool.query('SELECT COUNT(*) FROM marketplace_listings');
    if (parseInt(carCheck.rows[0].count) === 0) {
      const userRes = await pool.query("SELECT id FROM users LIMIT 1");
      const uId = userRes.rows[0]?.id || 3;
      await pool.query(
        `INSERT INTO marketplace_listings 
         (usuario_id, marca, modelo, anio, kilometraje, ciudad, tipo_vehiculo, precio_vendedor, imagen_url, estado_visual, historial_mantenimiento, danos_reportados, precio_sugerido_min, precio_sugerido_max, precio_sugerido, puntaje, veredicto, analisis)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [uId, 'Chevrolet', 'Aveo Family', 2020, 45000, 'Santo Domingo', 'automovil', 8900.00, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500', 'excelente', 'completo', 'ninguno', 8500, 9200, 8850, 90, 'precio_justo', 'Vehículo en excelente estado con historial de mantenimiento completo.']
      );
      console.log('Auto en venta creado con exito.');
    }

    console.log('Seed completado exitosamente.');
  } catch (err) {
    console.error('Error en seed:', err);
  } finally {
    pool.end();
  }
}

seed();
