CREATE DATABASE educationalcontrol;
USE educationalcontrol;

-- =========================
-- TABLA USUARIOS
-- =========================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    correo VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    rol ENUM('estudiante','docente'),

    -- Datos estudiante
    grado INT,
    seccion VARCHAR(10),
    turno VARCHAR(20),

    -- Datos docente
    materia_principal VARCHAR(100),
    telefono VARCHAR(20)
);
-- =========================
-- CLASES
-- =========================
CREATE TABLE clases (
    id INT AUTO_INCREMENT PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,
    codigo_clase VARCHAR(50) UNIQUE NOT NULL,

    grado VARCHAR(20),
    seccion VARCHAR(10),

    docente_id INT,

    FOREIGN KEY (docente_id)
    REFERENCES usuarios(id)
    ON DELETE SET NULL
);

-- =========================
-- INSCRIPCIONES
-- =========================
CREATE TABLE inscripciones (
    id INT AUTO_INCREMENT PRIMARY KEY,

    estudiante_id INT,
    clase_id INT,

    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (estudiante_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE,

    FOREIGN KEY (clase_id)
    REFERENCES clases(id)
    ON DELETE CASCADE
);

-- =========================
-- MATERIALES
-- =========================
CREATE TABLE materiales (
    id INT AUTO_INCREMENT PRIMARY KEY,

    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,

    archivo VARCHAR(255),

    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    clase_id INT,

    FOREIGN KEY (clase_id)
    REFERENCES clases(id)
    ON DELETE CASCADE
);

-- =========================
-- TAREAS
-- =========================
CREATE TABLE tareas (
    id INT AUTO_INCREMENT PRIMARY KEY,

    titulo VARCHAR(150) NOT NULL,
    instrucciones TEXT,

    fecha_entrega DATE,

    clase_id INT,

    FOREIGN KEY (clase_id)
    REFERENCES clases(id)
    ON DELETE CASCADE
);

-- =========================
-- ENTREGA TAREAS
-- =========================
CREATE TABLE entrega_tareas (
    id INT AUTO_INCREMENT PRIMARY KEY,

    tarea_id INT,
    estudiante_id INT,

    archivo VARCHAR(255),

    fecha_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tarea_id)
    REFERENCES tareas(id)
    ON DELETE CASCADE,

    FOREIGN KEY (estudiante_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE
);

-- =========================
-- ASISTENCIA
-- =========================
CREATE TABLE asistencia (
    id INT AUTO_INCREMENT PRIMARY KEY,

    fecha DATE NOT NULL,

    estado ENUM('presente','ausente','tarde'),

    clase_id INT,
    estudiante_id INT,

    FOREIGN KEY (clase_id)
    REFERENCES clases(id)
    ON DELETE CASCADE,

    FOREIGN KEY (estudiante_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE
);

-- =========================
-- NOTAS
-- =========================
CREATE TABLE notas (
    id INT AUTO_INCREMENT PRIMARY KEY,

    calificacion FLOAT NOT NULL,

    evaluacion VARCHAR(100),

    clase_id INT,
    estudiante_id INT,

    FOREIGN KEY (clase_id)
    REFERENCES clases(id)
    ON DELETE CASCADE,

    FOREIGN KEY (estudiante_id)
    REFERENCES usuarios(id)
    ON DELETE CASCADE
);
select*from clases;
select*from usuarios;
SELECT 
    clases.*,
    usuarios.nombre AS docente;