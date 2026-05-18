const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function importInternalDatabase() {
    // Railway inyecta de manera nativa estas variables si las vinculaste en el entorno
    const config = {
        host: process.env.DB_HOST || 'mysql.railway.internal',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        multipleStatements: true
    };

    if (!config.password) {
        console.error('Error: No se detectó la variable DB_PASSWORD en el entorno.');
        process.exit(1);
    }

    try {
        console.log(`Conectando internamente a MySQL en ${config.host}:${config.port}...`);
        const connection = await mysql.createConnection(config);

        console.log(`Asegurando existencia de la base de datos: ${process.env.DB_NAME || 'educationalcontrol'}`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'educationalcontrol'}\`;`);
        await connection.query(`USE \`${process.env.DB_NAME || 'educationalcontrol'}\`;`);

        // Al estar en la misma carpeta del backend en Railway, lo leemos directamente
        const sqlPath = path.join(__dirname, 'educationalcontrol.sql');
        if (!fs.existsSync(sqlPath)) {
            throw new Error(`No se encontró el archivo SQL en la ruta: ${sqlPath}`);
        }

        console.log('Leyendo archivo educationalcontrol.sql para la migración...');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Ejecutando sentencias SQL en la base de datos de producción...');
        await connection.query(sql);

        console.log('¡Base de datos aprovisionada e importada con éxito de forma interna!');
        await connection.end();
    } catch (error) {
        console.error('Error crítico durante la importación interna:', error);
        process.exit(1);
    }
}

importInternalDatabase();