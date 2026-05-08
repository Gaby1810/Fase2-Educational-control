CREATE DATABASE educationalcontrol;
USE educationalcontrol;
CREATE TABLE rol (
 id_rol INT AUTO_INCREMENT PRIMARY KEY,
 nombre_rol VARCHAR(50) NOT NULL UNIQUE
);
CREATE TABLE institucion (
 id_institucion INT AUTO_INCREMENT PRIMARY KEY,
 nombre VARCHAR(150) NOT NULL,
 codigo VARCHAR(50) NOT NULL UNIQUE
);
CREATE TABLE usuario (
 id_usuario INT AUTO_INCREMENT PRIMARY KEY,
 nombre VARCHAR(100) NOT NULL,
 correo VARCHAR(100) NOT NULL UNIQUE,
 contrasena VARCHAR(255) NOT NULL,
 id_rol INT NOT NULL,
 CONSTRAINT fk_usuario_rol
 FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
);
CREATE TABLE docente (
 id_docente INT AUTO_INCREMENT PRIMARY KEY,
 usuario_id INT NOT NULL UNIQUE,
 dui VARCHAR(20) NOT NULL UNIQUE,
 institucion_id INT NOT NULL,
 CONSTRAINT fk_docente_usuario
 FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario),
 CONSTRAINT fk_docente_institucion
 FOREIGN KEY (institucion_id) REFERENCES institucion(id_institucion)
);
CREATE TABLE estudiante (
 id_estudiante INT AUTO_INCREMENT PRIMARY KEY,
 usuario_id INT NOT NULL UNIQUE,
 nie VARCHAR(30) NOT NULL UNIQUE,
 institucion_id INT NOT NULL,
 CONSTRAINT fk_estudiante_usuario
 FOREIGN KEY (usuario_id) REFERENCES usuario(id_usuario),
 CONSTRAINT fk_estudiante_institucion
 FOREIGN KEY (institucion_id) REFERENCES institucion(id_institucion)
);
CREATE TABLE clase (
 id_clase INT AUTO_INCREMENT PRIMARY KEY,
 nombre VARCHAR(100) NOT NULL,
 codigo_clase VARCHAR(50) NOT NULL UNIQUE,
 grado VARCHAR(50),
 seccion VARCHAR(50),
 docente_id INT NOT NULL,
 CONSTRAINT fk_clase_docente
 FOREIGN KEY (docente_id) REFERENCES docente(id_docente)
);
CREATE TABLE inscripcion (
 id_inscripcion INT AUTO_INCREMENT PRIMARY KEY,
 estudiante_id INT NOT NULL,
 clase_id INT NOT NULL,
 fecha_inscripcion DATE NOT NULL,
 CONSTRAINT fk_inscripcion_estudiante
 FOREIGN KEY (estudiante_id) REFERENCES estudiante(id_estudiante),
 CONSTRAINT fk_inscripcion_clase
 FOREIGN KEY (clase_id) REFERENCES clase(id_clase),
 CONSTRAINT uq_inscripcion UNIQUE (estudiante_id, clase_id)
);
CREATE TABLE material (
 id_material INT AUTO_INCREMENT PRIMARY KEY,
 titulo VARCHAR(150) NOT NULL,
 descripcion TEXT,
 fecha_publicacion DATE NOT NULL,
 clase_id INT NOT NULL,
 CONSTRAINT fk_material_clase
 FOREIGN KEY (clase_id) REFERENCES clase(id_clase)
);
CREATE TABLE tarea (
 id_tarea INT AUTO_INCREMENT PRIMARY KEY,
 titulo VARCHAR(150) NOT NULL,
 instrucciones TEXT,
 fecha_entrega DATE NOT NULL,
 clase_id INT NOT NULL,
 CONSTRAINT fk_tarea_clase
 FOREIGN KEY (clase_id) REFERENCES clase(id_clase)
);
CREATE TABLE entrega_tarea (
 id_entrega INT AUTO_INCREMENT PRIMARY KEY,
 tarea_id INT NOT NULL,
 estudiante_id INT NOT NULL,
 archivo VARCHAR(255) NOT NULL,
 fecha_entrega DATE NOT NULL,
 CONSTRAINT fk_entrega_tarea
 FOREIGN KEY (tarea_id) REFERENCES tarea(id_tarea),
 CONSTRAINT fk_entrega_estudiante
 FOREIGN KEY (estudiante_id) REFERENCES estudiante(id_estudiante),
 CONSTRAINT uq_entrega UNIQUE (tarea_id, estudiante_id)
);
CREATE TABLE asistencia (
 id_asistencia INT AUTO_INCREMENT PRIMARY KEY,
 fecha DATE NOT NULL,
 estado VARCHAR(20) NOT NULL,
 clase_id INT NOT NULL,
 estudiante_id INT NOT NULL,
 CONSTRAINT fk_asistencia_clase
 FOREIGN KEY (clase_id) REFERENCES clase(id_clase),
 CONSTRAINT fk_asistencia_estudiante
 FOREIGN KEY (estudiante_id) REFERENCES estudiante(id_estudiante),
 CONSTRAINT uq_asistencia UNIQUE (fecha, clase_id, estudiante_id)
);
CREATE TABLE nota (
 id_nota INT AUTO_INCREMENT PRIMARY KEY,
 calificacion FLOAT NOT NULL,
 evaluacion VARCHAR(100) NOT NULL,
 clase_id INT NOT NULL,
 estudiante_id INT NOT NULL,
 CONSTRAINT fk_nota_clase
 FOREIGN KEY (clase_id) REFERENCES clase(id_clase),
 CONSTRAINT fk_nota_estudiante
 FOREIGN KEY (estudiante_id) REFERENCES estudiante(id_estudiante)
);
