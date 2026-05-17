require('dotenv').config();
const db = require('./src/db');

async function cleanDuplicates() {
  const sqlClean = `
    DELETE a1 FROM asistencia a1
    INNER JOIN asistencia a2 
    WHERE a1.id < a2.id AND 
          a1.clase_id = a2.clase_id AND 
          a1.estudiante_id = a2.estudiante_id AND 
          a1.fecha = a2.fecha;
  `;

  db.query(sqlClean, (err, result) => {
    if (err) {
      console.error("Error cleaning duplicates:", err);
      process.exit(1);
    }
    console.log(`Cleaned ${result.affectedRows} duplicate records.`);

    // Now try adding the constraint
    console.log("Adding UNIQUE constraint to asistencia table...");
    const sqlAlter = "ALTER TABLE asistencia ADD CONSTRAINT unique_asistencia UNIQUE (clase_id, estudiante_id, fecha)";
    db.query(sqlAlter, (err, result2) => {
      if (err) {
        console.error("Error adding constraint after cleanup:", err);
        process.exit(1);
      }
      console.log("Constraint added successfully.");
      process.exit(0);
    });
  });
}

cleanDuplicates();
