const mysql = require("mysql2");

// Pool: maneja múltiples conexiones, reconecta automáticamente,
// no muere si MySQL cierra una conexión por timeout.
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "educationalcontrol",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test inicial
pool.getConnection((err, conn) => {
    if (err) {
        console.log("❌ Error conexión MySQL:", err.message);
        return;
    }
    console.log("✅ MySQL conectado (pool)");
    conn.release();
});

// El pool expone el mismo .query(sql, args, callback) que createConnection,
// así que ningún router se rompe.
module.exports = pool;
