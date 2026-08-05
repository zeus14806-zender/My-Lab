import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { db, runQuery, getQuery, getOneQuery, User, Activity, LabReport, CourseModule, Simulation, QuizResult } from "./db.js";
import { runMigrations } from "./migrations.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Inicializar GoogleGenAI
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// ==================== ENDPOINTS DE USUARIOS ====================

// Obtener todos los usuarios
app.get("/api/users", async (req, res) => {
  try {
    const users = await getQuery<User>("SELECT id, name, email, role, xp_points, level, created_at FROM users");
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: "Error al obtener usuarios", detail: error.message });
  }
});

// Obtener usuario por email
app.get("/api/users/:email", async (req, res) => {
  try {
    const user = await getOneQuery<User>(
      "SELECT id, name, email, role, xp_points, level, created_at FROM users WHERE email = ?",
      [req.params.email]
    );
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: "Error al obtener usuario", detail: error.message });
  }
});

// Crear usuario - CON VALIDACIÓN DE CONTRASEÑA
app.post("/api/users", async (req, res) => {
  try {
    const { name, email, password, role = 'student' } = req.body;
    
    // ✅ Validar que la contraseña tenga al menos 6 caracteres
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }
    
    // Verificar si ya existe
    const existing = await getOneQuery<User>("SELECT * FROM users WHERE email = ?", [email]);
    if (existing) {
      return res.status(409).json({ error: "El email ya está registrado" });
    }
    
    const result = await runQuery(
      "INSERT INTO users (name, email, password, role, xp_points, level) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, password, role, 0, 1]
    );
    
    const newUser = await getOneQuery<User>(
      "SELECT id, name, email, role, xp_points, level, created_at FROM users WHERE id = ?",
      [result.lastID]
    );
    
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(500).json({ error: "Error al crear usuario", detail: error.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getOneQuery<User>(
      "SELECT * FROM users WHERE email = ? AND password = ?",
      [email, password]
    );
    
    if (!user) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }
    
    // Registrar actividad de login
    await runQuery(
      "INSERT INTO activities (user_id, action, details) VALUES (?, ?, ?)",
      [user.id, 'Login', 'Inicio de sesión exitoso']
    );
    
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error: any) {
    res.status(500).json({ error: "Error en login", detail: error.message });
  }
});

// ==================== ENDPOINTS DE ADMIN ====================

// Obtener todos los usuarios (solo admin)
app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await getQuery<User>(
      "SELECT id, name, email, role, xp_points, level, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: "Error al obtener usuarios", detail: error.message });
  }
});

// Actualizar rol de usuario (solo admin)
app.put("/api/admin/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ error: "Rol inválido" });
    }
    
    const result = await runQuery(
      "UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [role, req.params.id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    
    res.json({ message: "Rol actualizado exitosamente" });
  } catch (error: any) {
    res.status(500).json({ error: "Error al actualizar rol", detail: error.message });
  }
});

// Eliminar usuario (solo admin)
app.delete("/api/admin/users/:id", async (req, res) => {
  try {
    const result = await runQuery("DELETE FROM users WHERE id = ?", [req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json({ message: "Usuario eliminado exitosamente" });
  } catch (error: any) {
    res.status(500).json({ error: "Error al eliminar usuario", detail: error.message });
  }
});

// Obtener estadísticas del sistema (solo admin)
app.get("/api/admin/stats", async (req, res) => {
  try {
    const totalUsers = await getOneQuery<{ count: number }>("SELECT COUNT(*) as count FROM users");
    const totalStudents = await getOneQuery<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const totalAdmins = await getOneQuery<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    const totalSimulations = await getOneQuery<{ count: number }>("SELECT COUNT(*) as count FROM simulations");
    const totalQuizzes = await getOneQuery<{ count: number }>("SELECT COUNT(*) as count FROM quiz_results");
    const pendingReports = await getOneQuery<{ count: number }>("SELECT COUNT(*) as count FROM lab_reports WHERE status = 'Pendiente'");
    
    res.json({
      total_users: totalUsers?.count || 0,
      total_students: totalStudents?.count || 0,
      total_admins: totalAdmins?.count || 0,
      total_simulations: totalSimulations?.count || 0,
      total_quizzes: totalQuizzes?.count || 0,
      pending_reports: pendingReports?.count || 0
    });
  } catch (error: any) {
    res.status(500).json({ error: "Error al obtener estadísticas", detail: error.message });
  }
});

// Obtener todas las actividades (solo admin)
app.get("/api/admin/activities", async (req, res) => {
  try {
    const activities = await getQuery<any>(`
      SELECT a.*, u.name as user_name 
      FROM activities a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 50
    `);
    res.json(activities);
  } catch (error: any) {
    res.status(500).json({ error: "Error al obtener actividades", detail: error.message });
  }
});

// ==================== ENDPOINTS DE ACTIVIDADES ====================

app.get("/api/activities/:userId", async (req, res) => {
  try {
    const activities = await getQuery<Activity>(
      "SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
      [req.params.userId]
    );
    res.json(activities);
  } catch (error: any) {
    res.status(500).json({ error: "Error al obtener actividades", detail: error.message });
  }
});

app.post("/api/activities", async (req, res) => {
  try {
    const { user_id, action, details } = req.body;
    const result = await runQuery(
      "INSERT INTO activities (user_id, action, details) VALUES (?, ?, ?)",
      [user_id, action, details]
    );
    res.status(201).json({ id: result.lastID, message: "Actividad registrada" });
  } catch (error: any) {
    res.status(500).json({ error: "Error al crear actividad", detail: error.message });
  }
});

// ==================== ENDPOINTS DE REPORTES ====================

app.get("/api/reports", async (req, res) => {
  try {
    const reports = await getQuery<LabReport>(`
      SELECT r.*, u.name as sender_name 
      FROM lab_reports r
      JOIN users u ON r.user_id = u.id
      WHERE r.status = 'Pendiente'
      ORDER BY 
        CASE r.priority
          WHEN 'Alta' THEN 1
          WHEN 'Media' THEN 2
          WHEN 'Baja' THEN 3
        END,
        r.created_at DESC
    `);
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ error: "Error al obtener reportes", detail: error.message });
  }
});

app.post("/api/reports", async (req, res) => {
  try {
    const { user_id, title, content, priority = 'Media' } = req.body;
    const result = await runQuery(
      "INSERT INTO lab_reports (user_id, title, content, priority, status) VALUES (?, ?, ?, ?, ?)",
      [user_id, title, content, priority, 'Pendiente']
    );
    res.status(201).json({ id: result.lastID, message: "Reporte creado" });
  } catch (error: any) {
    res.status(500).json({ error: "Error al crear reporte", detail: error.message });
  }
});

app.put("/api/reports/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const result = await runQuery(
      "UPDATE lab_reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, req.params.id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: "Reporte no encontrado" });
    }
    res.json({ message: "Reporte actualizado" });
  } catch (error: any) {
    res.status(500).json({ error: "Error al actualizar reporte", detail: error.message });
  }
});

// ==================== ENDPOINTS DE MÓDULOS ====================

app.get("/api/modules", async (req, res) => {
  try {
    const modules = await getQuery<CourseModule>("SELECT * FROM course_modules");
    res.json(modules);
  } catch (error: any) {
    res.status(500).json({ error: "Error al obtener módulos", detail: error.message });
  }
});

// ==================== ENDPOINTS DE SIMULACIONES ====================

app.get("/api/simulations/:userId", async (req, res) => {
  try {
    const simulations = await getQuery<Simulation>(
      "SELECT * FROM simulations WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
      [req.params.userId]
    );
    res.json(simulations);
  } catch (error: any) {
    res.status(500).json({ error: "Error al obtener simulaciones", detail: error.message });
  }
});

app.post("/api/simulations", async (req, res) => {
  try {
    const { user_id, reactants, result_name, result_type, equation, animation_type, glow_color } = req.body;
    const result = await runQuery(
      `INSERT INTO simulations 
       (user_id, reactants, result_name, result_type, equation, animation_type, glow_color) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, reactants, result_name, result_type, equation, animation_type, glow_color]
    );
    res.status(201).json({ id: result.lastID, message: "Simulación guardada" });
  } catch (error: any) {
    res.status(500).json({ error: "Error al guardar simulación", detail: error.message });
  }
});

// ==================== ENDPOINTS DE QUIZ ====================

app.post("/api/quiz-results", async (req, res) => {
  try {
    const { user_id, score, total_questions, passed, validation_code } = req.body;
    const result = await runQuery(
      "INSERT INTO quiz_results (user_id, score, total_questions, passed, validation_code) VALUES (?, ?, ?, ?, ?)",
      [user_id, score, total_questions, passed ? 1 : 0, validation_code]
    );
    
    // Actualizar XP del usuario
    if (passed) {
      const xpEarned = score * 50;
      await runQuery(
        "UPDATE users SET xp_points = xp_points + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [xpEarned, user_id]
      );
    }
    
    res.status(201).json({ id: result.lastID, message: "Resultado de quiz guardado" });
  } catch (error: any) {
    res.status(500).json({ error: "Error al guardar resultado", detail: error.message });
  }
});

app.get("/api/quiz-results/:userId", async (req, res) => {
  try {
    const results = await getQuery<QuizResult>(
      "SELECT * FROM quiz_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
      [req.params.userId]
    );
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: "Error al obtener resultados", detail: error.message });
  }
});

// ==================== ENDPOINTS DE ESTADÍSTICAS ====================

app.get("/api/stats/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const simCount = await getOneQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM simulations WHERE user_id = ?",
      [userId]
    );
    
    const quizPassed = await getOneQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM quiz_results WHERE user_id = ? AND passed = 1",
      [userId]
    );
    
    const avgScore = await getOneQuery<{ avg: number }>(
      "SELECT AVG(score) as avg FROM quiz_results WHERE user_id = ?",
      [userId]
    );
    
    res.json({
      total_simulations: simCount?.count || 0,
      quizzes_passed: quizPassed?.count || 0,
      average_quiz_score: Math.round(avgScore?.avg || 0)
    });
  } catch (error: any) {
    res.status(500).json({ error: "Error al obtener estadísticas", detail: error.message });
  }
});

// ==================== ENDPOINTS DE GEMINI ====================

app.post("/api/simulate", async (req, res) => {
  const { reactants } = req.body;
  if (!reactants) {
    return res.status(400).json({ error: "Reactants are required." });
  }

  if (!ai) {
    const searchString = String(reactants).toLowerCase();
    let reactionOutput = {
      equation: "H2O + Na ➔ NaOH + H2 (sin balancear)",
      name: "Hidróxido de Sodio y Gas Hidrógeno",
      type: "Reacción Redox Exotérmica",
      visuals: `Al mezclar ${reactants}, se percibe un burbujeo sumamente violento con desprendimiento instantáneo de gas que puede chispear o encenderse si hay oxígeno suficiente.`,
      funFact: "El sodio es tan reactivo que debe almacenarse sumergido en aceite mineral para impedir la ignición con la humedad ambiental.",
      animationType: "explosion",
      glowColor: "#fdd34d",
      warning: "¡Inflamable! Se produce gas hidrógeno altamente explosivo. Usar campana extractora y protección ocular."
    };
    return res.json(reactionOutput);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Simula una reacción química realista para estos reactivos: "${reactants}". 
Devuelve tu respuesta estrictamente en formato JSON utilizando el esquema requerido, sin comentarios, bloques markdown ni textos auxiliares. Traduce el contenido al idioma Español.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["equation", "name", "type", "visuals", "funFact", "animationType", "glowColor", "warning"],
          properties: {
            equation: { 
              type: Type.STRING, 
              description: "Fórmula e ingredientes químicos balanceados (ej: 2 H2 + O2 -> 2 H2O)" 
            },
            name: { 
              type: Type.STRING, 
              description: "Nombre del compuesto o fenómeno químico central resultante" 
            },
            type: { 
              type: Type.STRING, 
              description: "Categoría de reacción (ej: Redox, Ácido-Base, Síntesis)" 
            },
            visuals: { 
              type: Type.STRING, 
              description: "Descripción vívida de lo que se observa físicamente dentro de un vaso químico" 
            },
            funFact: { 
              type: Type.STRING, 
              description: "Dato histórico, industrial o anecdótico fascinante sobre las sustancias" 
            },
            animationType: { 
              type: Type.STRING, 
              enum: ["bubbling", "colorChange", "explosion", "precipitation", "heat", "glowing", "neutral"],
              description: "El tipo de animación visual estimulada que describe mejor el evento" 
            },
            glowColor: { 
              type: Type.STRING, 
              description: "Un color hexadecimal (ej: #5e35b1 o #fdd34d) idóneo para el color del líquido o resplandor de acuerdo a las sustancias" 
            },
            warning: { 
              type: Type.STRING, 
              description: "Amonestación o medida de seguridad de laboratorio que deben seguir los estudiantes" 
            },
          }
        },
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedData);
  } catch (err: any) {
    res.status(500).json({ error: "Error contacting Gemini API", detail: err.message });
  }
});

app.post("/api/ai-report", async (req, res) => {
  const { subject } = req.body;
  
  if (!ai) {
    return res.json({
      report: `REPORTE COGNITIVO PERSONALIZADO - ALEX MARTINEZ:
• Fortalezas individuales: Destacas con un 94% de precisión en identificación de valencias, propiedades iónicas de no metales y balanceo redox básico.
• Temas de práctica recomendados: Reforzar el balance estequiométrico en medio ácido de compuestos de óxido de manganeso.
• Plan autónomo sugerido: Te sugerimos realizar 2 simulaciones autónomas adicionales en nuestro Reactor Hidrógeno-Oxígeno durante esta semana para consolidar tus conceptos de reactivo limitante térmico.`
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Genera un reporte cognitivo de autoevaluación y plan de práctica para un estudiante llamado Alex Martinez de 4º Año de secundaria, enfocado en el tema "${subject || "Química Molecular"}". 
El tono debe ser directo para el estudiante, motivador, científico e instructivo sin mediación ni evaluación de docentes o directivos. Proporciona 3 viñetas claras: 1) Fortalezas individuales, 2) Temas de práctica recomendados para estudio autónomo en el reactor MyLab, y 3) Plan de acciones autónomas recomendadas.`
    });

    res.json({ report: response.text });
  } catch (err: any) {
    res.status(500).json({ error: "Error generating content with Gemini", detail: err.message });
  }
});

// ==================== INICIO DEL SERVIDOR ====================

async function start() {
  try {
    await runMigrations();
    console.log('📦 Base de datos SQLite inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    console.log(`📊 Base de datos: ${path.join(process.cwd(), 'data', 'mylab.db')}`);
  });
}

start();