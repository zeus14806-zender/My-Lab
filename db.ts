import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Asegurar que el directorio data existe
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'mylab.db');

// Crear y conectar a la base de datos
const db = new sqlite3.Database(dbPath);

// Interfaz para Usuario
export interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'admin';
  xp_points: number;
  level: number;
  created_at?: string;
  updated_at?: string;
}

// Interfaz para Actividad
export interface Activity {
  id?: number;
  user_id: number;
  action: string;
  details: string;
  created_at?: string;
}

// Interfaz para Reporte de Laboratorio
export interface LabReport {
  id?: number;
  user_id: number;
  title: string;
  content: string;
  priority: 'Alta' | 'Media' | 'Baja';
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
  created_at?: string;
  updated_at?: string;
}

// Interfaz para Módulo de Curso
export interface CourseModule {
  id?: number;
  title: string;
  year: string;
  subject: string;
  status: 'Iniciado' | 'Listo' | 'En Progreso';
  color: string;
  bg_color: string;
  image_url: string;
  created_at?: string;
}

// Interfaz para Simulación
export interface Simulation {
  id?: number;
  user_id: number;
  reactants: string;
  result_name: string;
  result_type: string;
  equation: string;
  animation_type: string;
  glow_color: string;
  created_at?: string;
}

// Interfaz para Resultado de Quiz
export interface QuizResult {
  id?: number;
  user_id: number;
  score: number;
  total_questions: number;
  passed: boolean;
  validation_code: string;
  created_at?: string;
}

// Función para ejecutar queries con promesas
export function runQuery(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

export function getQuery<T>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
}

export function getOneQuery<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row as T | undefined);
      }
    });
  });
}

export { db };

export default {
  db,
  runQuery,
  getQuery,
  getOneQuery
};