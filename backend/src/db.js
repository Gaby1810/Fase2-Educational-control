const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "gaby1810", // tu contraseña si tienes
    database: "educationalcontrol"
});

db.connect(err => {
    if (err) {
        console.log("Error conexión:", err);
    } else {
        console.log("MySQL conectado");
    }
});

module.exports = db;