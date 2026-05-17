require('dotenv').config();
const pool = require('./src/db');

async function migrate() {
  const promisePool = pool.promise();

  try {
    console.log("Bloque 1: Actualizar enum de roles");
    await promisePool.query("ALTER TABLE usuarios MODIFY COLUMN rol ENUM('estudiante', 'docente', 'administrador') DEFAULT NULL;");
    
    console.log("Bloque 2: Agregar created_at");
    try {
      await promisePool.query("ALTER TABLE usuarios ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("Columna created_at ya existe, ignorando.");
      else throw e;
    }

    console.log("Bloque 3: Agregar descripcion a clases");
    try {
      await promisePool.query("ALTER TABLE clases ADD COLUMN descripcion TEXT DEFAULT NULL;");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log("Columna descripcion ya existe, ignorando.");
      else throw e;
    }

    console.log("Bloque 4: Crear o actualizar administrador");
    await promisePool.query(`
      INSERT INTO usuarios (nombre, correo, password, rol)
      VALUES (
        'Administrador General',
        'admin@educational.com',
        '$2b$10$A.SUnNHsdmydaOsl8rc0J.mAdO3D3ZvSnKtH7c32STivEwjmTtlDO',
        'administrador'
      )
      ON DUPLICATE KEY UPDATE 
        password = '$2b$10$A.SUnNHsdmydaOsl8rc0J.mAdO3D3ZvSnKtH7c32STivEwjmTtlDO',
        rol = 'administrador';
    `);

    console.log("Bug 9: constraint de asistencia");
    try {
        await promisePool.query("ALTER TABLE asistencia ADD UNIQUE KEY `idx_asistencia_unica` (`clase_id`, `estudiante_id`, `fecha`);");
    } catch (e) {
        if (e.code === 'ER_DUP_KEYNAME') console.log("Índice de asistencia ya existe, ignorando.");
        else throw e;
    }

    console.log("Migración completada con éxito.");
  } catch (error) {
    console.error("Error durante migración:", error);
  } finally {
    pool.end();
  }
}

migrate();
