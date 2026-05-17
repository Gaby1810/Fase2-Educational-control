require('dotenv').config();
const db = require('./src/db');

async function fixNotas() {
  const sqlClean = `
    DELETE n1 FROM notas n1
    INNER JOIN notas n2 
    WHERE n1.id < n2.id AND 
          n1.clase_id = n2.clase_id AND 
          n1.estudiante_id = n2.estudiante_id AND 
          n1.evaluacion = n2.evaluacion;
  `;

  db.query(sqlClean, (err, result) => {
    if (err) {
      console.error("Error cleaning duplicates:", err);
      process.exit(1);
    }
    console.log(`Cleaned ${result.affectedRows} duplicate records in notas.`);

    console.log("Adding UNIQUE constraint to notas table...");
    const sqlAlter = "ALTER TABLE notas ADD CONSTRAINT unique_nota UNIQUE (clase_id, estudiante_id, evaluacion)";
    db.query(sqlAlter, (err, result2) => {
      if (err) {
        console.error("Error adding constraint to notas:", err);
        // It might fail if there are null evaluations that collide, but MySQL InnoDB handles multiple NULLs in UNIQUE without error.
        process.exit(1);
      }
      console.log("Constraint added successfully.");
      process.exit(0);
    });
  });
}

fixNotas();
