import { db, runQuery } from './db.js';

// Función para verificar si una tabla existe
function tableExists(tableName: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [tableName],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      }
    );
  });
}

// Función para ejecutar migraciones
export async function runMigrations() {
  console.log('🔄 Ejecutando migraciones...');

  try {
    // Tabla: users
    if (!(await tableExists('users'))) {
      await runQuery(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT DEFAULT 'student',
          xp_points INTEGER DEFAULT 0,
          level INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabla users creada');
    }

    // Tabla: activities
    if (!(await tableExists('activities'))) {
      await runQuery(`
        CREATE TABLE activities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          details TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ Tabla activities creada');
    }

    // Tabla: lab_reports
    if (!(await tableExists('lab_reports'))) {
      await runQuery(`
        CREATE TABLE lab_reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          priority TEXT DEFAULT 'Media',
          status TEXT DEFAULT 'Pendiente',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ Tabla lab_reports creada');
    }

    // Tabla: course_modules
    if (!(await tableExists('course_modules'))) {
      await runQuery(`
        CREATE TABLE course_modules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          year TEXT NOT NULL,
          subject TEXT NOT NULL,
          status TEXT DEFAULT 'Iniciado',
          color TEXT,
          bg_color TEXT,
          image_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabla course_modules creada');
    }

    // Tabla: simulations
    if (!(await tableExists('simulations'))) {
      await runQuery(`
        CREATE TABLE simulations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          reactants TEXT NOT NULL,
          result_name TEXT NOT NULL,
          result_type TEXT NOT NULL,
          equation TEXT NOT NULL,
          animation_type TEXT,
          glow_color TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ Tabla simulations creada');
    }

    // Tabla: quiz_results
    if (!(await tableExists('quiz_results'))) {
      await runQuery(`
        CREATE TABLE quiz_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          score INTEGER NOT NULL,
          total_questions INTEGER NOT NULL,
          passed BOOLEAN DEFAULT 0,
          validation_code TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ Tabla quiz_results creada');
    }

    // Insertar datos iniciales: usuarios por defecto
    const existingUsers = await new Promise<any[]>((resolve, reject) => {
      db.all("SELECT * FROM users WHERE email = 'alex.martinez@mylab.edu'", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (existingUsers.length === 0) {
      await runQuery(`
        INSERT INTO users (name, email, password, role, xp_points, level)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['Alex Martinez', 'alex.martinez@mylab.edu', 'password123', 'student', 2450, 14]);
      
      await runQuery(`
        INSERT INTO users (name, email, password, role, xp_points, level)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['Dra. Elena Vega', 'elena.vega@mylab.edu', 'admin123', 'admin', 0, 1]);
      
      console.log('✅ Usuarios por defecto creados');
    }

    // Insertar datos iniciales: módulos de curso
    const existingModules = await new Promise<any[]>((resolve, reject) => {
      db.all("SELECT * FROM course_modules", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (existingModules.length === 0) {
      await runQuery(`
        INSERT INTO course_modules (title, year, subject, status, color, bg_color, image_url)
        VALUES 
          ('Tabla Periódica Interactiva', '4º Año', 'Física y Química', 'Iniciado', '#461599', 'bg-primary/10', 'grid_view'),
          ('Equilibrio Químico y pH', '5º Año', 'Química Avanzada', 'Listo', '#735c00', 'bg-[#ffe087]/30', 'thermostat'),
          ('Química Orgánica: Hidrocarburos', '4º Año', 'Fundamentos', 'En Progreso', '#760038', 'bg-[#ffd9e1]/40', 'bubble_chart')
      `);
      console.log('✅ Módulos de curso creados');
    }

    // Insertar actividades iniciales
    const existingActivities = await new Promise<any[]>((resolve, reject) => {
      db.all("SELECT * FROM activities LIMIT 1", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (existingActivities.length === 0) {
      const user = await new Promise<any>((resolve, reject) => {
        db.get("SELECT id FROM users WHERE email = 'alex.martinez@mylab.edu'", (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (user) {
        await runQuery(`
          INSERT INTO activities (user_id, action, details)
          VALUES 
            (?, 'Simulación', 'Simuló con éxito equilibrio de combustión en reactor'),
            (?, 'Reporte', 'Cargó Reporte de Solubilidad de Sales en Laboratorio'),
            (?, 'Cuestionario', 'Completó Cuestionario 4 con calificación perfecta'),
            (?, 'Módulo', 'Habilitó módulo de Química Orgánica: Alquinos')
        `, [user.id, user.id, user.id, user.id]);
        console.log('✅ Actividades iniciales creadas');
      }
    }

    // Insertar reportes iniciales
    const existingReports = await new Promise<any[]>((resolve, reject) => {
      db.all("SELECT * FROM lab_reports LIMIT 1", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (existingReports.length === 0) {
      const user = await new Promise<any>((resolve, reject) => {
        db.get("SELECT id FROM users WHERE email = 'alex.martinez@mylab.edu'", (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (user) {
        await runQuery(`
          INSERT INTO lab_reports (user_id, title, content, priority, status)
          VALUES 
            (?, 'Estequiometría Avanzada', 'El informe detalla el cálculo teórico de reactivo limitante en la neutralización de Ácido Clorhídrico con Hidróxido de Sodio. Los coeficientes se correlacionan 1:1, obteniendo una masa neta de NaCl coincidente con la estequiometría.', 'Alta', 'Pendiente'),
            (?, 'Equilibrio Ácido-Base', 'Análisis detallado del viraje cromático del reactivo fenolftaleína. Se cuantifica el pH de la disolución al iniciar el goteo de reactivo básico, registrando valores estables y un súbito incremento que valida la ecuación de Henderson-Hasselbalch.', 'Media', 'Pendiente'),
            (?, 'Solubilidad de Sales', 'Evaluación de los cambios de sedimentación de Cloruro de Plata a diferentes isotermas. Se evidencia una saturación acelerada por debajo de 25°C que corrobora la ley del producto de solubilidad (Ksp).', 'Baja', 'Pendiente')
        `, [user.id, user.id, user.id]);
        console.log('✅ Reportes iniciales creados');
      }
    }

    console.log('✅ Migraciones completadas exitosamente');
  } catch (error) {
    console.error('❌ Error en migraciones:', error);
    throw error;
  }
}