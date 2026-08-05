import sqlite3 from 'sqlite3';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const db = new sqlite3.Database(path.join(__dirname, 'data', 'myLab.db'));

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

// Mostrar todos los usuarios
function mostrarUsuarios() {
  return new Promise((resolve, reject) => {
    db.all("SELECT id, name, email, role, xp_points, level, created_at FROM users ORDER BY id", (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('\n');
      console.log('╔═══════════════════════════════════════════════════════════════════════════════════════╗');
      console.log('║                          📊 TABLA DE USUARIOS - MyLab                              ║');
      console.log('╠═══════════════════════════════════════════════════════════════════════════════════════╣');
      console.log('║ ID │ Nombre            │ Email                      │ Rol       │ XP   │ Nivel │ ║');
      console.log('╠═══════════════════════════════════════════════════════════════════════════════════════╣');
      
      rows.forEach(row => {
        const id = String(row.id).padEnd(3);
        const name = row.name.padEnd(18);
        const email = row.email.padEnd(26);
        const role = row.role.padEnd(9);
        const xp = String(row.xp_points).padEnd(5);
        const level = row.level;
        console.log(`║ ${id}│ ${name}│ ${email}│ ${role}│ ${xp}│ ${level}  │ ║`);
      });
      
      console.log('╠═══════════════════════════════════════════════════════════════════════════════════════╣');
      console.log(`║ 📌 Total: ${rows.length} usuarios                                                ║`);
      console.log(`║   👨‍🎓 Estudiantes: ${rows.filter(u => u.role === 'student').length}                ║`);
      console.log(`║   👑 Administradores: ${rows.filter(u => u.role === 'admin').length}               ║`);
      console.log('╚═══════════════════════════════════════════════════════════════════════════════════════╝');
      console.log('\n');
      
      resolve(rows);
    });
  });
}

// Obtener usuario por ID
function obtenerUsuarioPorId(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      resolve(row);
    });
  });
}

// Actualizar usuario
function actualizarUsuario(id, campo, valor) {
  return new Promise((resolve, reject) => {
    const query = `UPDATE users SET ${campo} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    db.run(query, [valor, id], function(err) {
      if (err) reject(err);
      resolve(this.changes);
    });
  });
}

// Eliminar usuario
function eliminarUsuarioPorId(id) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM users WHERE id = ?", [id], function(err) {
      if (err) reject(err);
      resolve(this.changes);
    });
  });
}

// Crear usuario
function crearNuevoUsuario(name, email, password, role) {
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO users (name, email, password, role, xp_points, level) VALUES (?, ?, ?, ?, ?, ?)",
      [name, email, password, role, 0, 1],
      function(err) {
        if (err) reject(err);
        resolve(this.lastID);
      }
    );
  });
}

// ============================================
// MENÚ PRINCIPAL
// ============================================

function mostrarMenu() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          🔧 GESTIÓN DE USUARIOS - MyLab                ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  1. 📋 Ver todos los usuarios                          ║');
  console.log('║  2. ➕ Crear nuevo usuario                             ║');
  console.log('║  3. ✏️  Editar usuario                                 ║');
  console.log('║  4. ❌ Eliminar usuario                                ║');
  console.log('║  5. 🔍 Buscar usuario por ID                          ║');
  console.log('║  6. 💰 Ver top 5 usuarios con más XP                  ║');
  console.log('║  7. 📊 Ver estadísticas del sistema                   ║');
  console.log('║  8. 🚪 Salir                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
}

// ============================================
// FUNCIONES DEL MENÚ
// ============================================

async function verTodosUsuarios() {
  await mostrarUsuarios();
  await presionarEnter();
}

async function crearUsuario() {
  console.clear();
  console.log('\n📝 CREAR NUEVO USUARIO\n');
  
  const name = await preguntar('Nombre completo: ');
  const email = await preguntar('Email: ');
  const password = await preguntar('Contraseña: ');
  const role = await preguntar('Rol (student/admin): ');
  
  if (!['student', 'admin'].includes(role.toLowerCase())) {
    console.log('❌ Rol inválido. Usa student o admin');
    await presionarEnter();
    return;
  }
  
  try {
    const id = await crearNuevoUsuario(name, email, password, role.toLowerCase());
    console.log(`✅ Usuario creado con éxito! ID: ${id}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  await presionarEnter();
}

async function editarUsuario() {
  console.clear();
  console.log('\n✏️  EDITAR USUARIO\n');
  
  await mostrarUsuarios();
  
  const id = await preguntar('ID del usuario a editar: ');
  const userId = parseInt(id);
  
  if (isNaN(userId)) {
    console.log('❌ ID inválido');
    await presionarEnter();
    return;
  }
  
  const usuario = await obtenerUsuarioPorId(userId);
  if (!usuario) {
    console.log('❌ Usuario no encontrado');
    await presionarEnter();
    return;
  }
  
  console.log(`\n📌 Editando: ${usuario.name} (${usuario.email})`);
  console.log('  1. Cambiar nombre');
  console.log('  2. Cambiar email');
  console.log('  3. Cambiar rol');
  console.log('  4. Cambiar contraseña');
  console.log('  5. Sumar XP');
  console.log('  6. Establecer XP exacto');
  console.log('  7. Cambiar nivel');
  console.log('  8. Cancelar');
  
  const opcion = await preguntar('Opción: ');
  
  let campo, valor;
  
  switch(opcion) {
    case '1':
      valor = await preguntar('Nuevo nombre: ');
      if (!valor.trim()) { console.log('❌ Nombre no puede estar vacío'); break; }
      await actualizarUsuario(userId, 'name', valor);
      console.log(`✅ Nombre actualizado a: ${valor}`);
      break;
      
    case '2':
      valor = await preguntar('Nuevo email: ');
      if (!valor.includes('@')) { console.log('❌ Email inválido'); break; }
      await actualizarUsuario(userId, 'email', valor);
      console.log(`✅ Email actualizado a: ${valor}`);
      break;
      
    case '3':
      valor = await preguntar('Nuevo rol (student/admin): ');
      if (!['student', 'admin'].includes(valor)) { console.log('❌ Rol inválido'); break; }
      await actualizarUsuario(userId, 'role', valor);
      console.log(`✅ Rol actualizado a: ${valor}`);
      break;
      
    case '4':
      valor = await preguntar('Nueva contraseña: ');
      if (valor.length < 6) { console.log('❌ Mínimo 6 caracteres'); break; }
      await actualizarUsuario(userId, 'password', valor);
      console.log('✅ Contraseña actualizada');
      break;
      
    case '5':
      const xpSum = await preguntar('Cantidad de XP a sumar: ');
      const suma = parseInt(xpSum);
      if (isNaN(suma)) { console.log('❌ Valor inválido'); break; }
      const xpActual = usuario.xp_points || 0;
      await actualizarUsuario(userId, 'xp_points', xpActual + suma);
      console.log(`✅ Sumados ${suma} XP. Total: ${xpActual + suma}`);
      break;
      
    case '6':
      const xpSet = await preguntar('Nuevo XP: ');
      const set = parseInt(xpSet);
      if (isNaN(set)) { console.log('❌ Valor inválido'); break; }
      await actualizarUsuario(userId, 'xp_points', set);
      console.log(`✅ XP establecido a: ${set}`);
      break;
      
    case '7':
      const level = await preguntar('Nuevo nivel: ');
      const lvl = parseInt(level);
      if (isNaN(lvl) || lvl < 1) { console.log('❌ Nivel inválido (mínimo 1)'); break; }
      await actualizarUsuario(userId, 'level', lvl);
      console.log(`✅ Nivel actualizado a: ${lvl}`);
      break;
      
    case '8':
      console.log('❌ Cancelado');
      break;
      
    default:
      console.log('❌ Opción inválida');
  }
  
  await presionarEnter();
}

async function eliminarUsuario() {
  console.clear();
  console.log('\n❌ ELIMINAR USUARIO\n');
  
  await mostrarUsuarios();
  
  const id = await preguntar('ID del usuario a eliminar: ');
  const userId = parseInt(id);
  
  if (isNaN(userId)) {
    console.log('❌ ID inválido');
    await presionarEnter();
    return;
  }
  
  const usuario = await obtenerUsuarioPorId(userId);
  if (!usuario) {
    console.log('❌ Usuario no encontrado');
    await presionarEnter();
    return;
  }
  
  console.log(`\n⚠️  ¿Estás seguro de eliminar a "${usuario.name}" (${usuario.email})?`);
  const confirm = await preguntar('Escribe "si" para confirmar: ');
  
  if (confirm.toLowerCase() === 'si') {
    const changes = await eliminarUsuarioPorId(userId);
    if (changes > 0) {
      console.log(`✅ Usuario "${usuario.name}" eliminado`);
    } else {
      console.log('❌ Error al eliminar');
    }
  } else {
    console.log('❌ Cancelado');
  }
  
  await presionarEnter();
}

async function buscarUsuario() {
  console.clear();
  console.log('\n🔍 BUSCAR USUARIO\n');
  
  const id = await preguntar('ID del usuario: ');
  const userId = parseInt(id);
  
  if (isNaN(userId)) {
    console.log('❌ ID inválido');
    await presionarEnter();
    return;
  }
  
  const usuario = await obtenerUsuarioPorId(userId);
  if (!usuario) {
    console.log('❌ Usuario no encontrado');
  } else {
    console.log('\n📌 DATOS DEL USUARIO');
    console.log('═'.repeat(50));
    console.log(`  ID: ${usuario.id}`);
    console.log(`  Nombre: ${usuario.name}`);
    console.log(`  Email: ${usuario.email}`);
    console.log(`  Rol: ${usuario.role}`);
    console.log(`  XP: ${usuario.xp_points}`);
    console.log(`  Nivel: ${usuario.level}`);
    console.log(`  Creado: ${usuario.created_at}`);
    console.log(`  Actualizado: ${usuario.updated_at}`);
    console.log('═'.repeat(50));
  }
  
  await presionarEnter();
}

async function topUsuarios() {
  console.clear();
  console.log('\n🏆 TOP 5 USUARIOS CON MÁS XP\n');
  
  return new Promise((resolve, reject) => {
    db.all("SELECT id, name, email, role, xp_points, level FROM users ORDER BY xp_points DESC LIMIT 5", (err, rows) => {
      if (err) {
        console.log('❌ Error:', err.message);
        resolve();
        return;
      }
      
      console.log('╔═══════════════════════════════════════════════════════════════╗');
      console.log('║  # │ Nombre            │ Rol       │ XP     │ Nivel         ║');
      console.log('╠═══════════════════════════════════════════════════════════════╣');
      
      rows.forEach((row, index) => {
        const pos = String(index + 1).padEnd(3);
        const name = row.name.padEnd(18);
        const role = row.role.padEnd(9);
        const xp = String(row.xp_points).padEnd(7);
        console.log(`║ ${pos}│ ${name}│ ${role}│ ${xp}│ ${row.level}          ║`);
      });
      
      console.log('╚═══════════════════════════════════════════════════════════════╝');
      console.log('\n');
      
      resolve();
    });
  });
}

async function estadisticas() {
  console.clear();
  console.log('\n📊 ESTADÍSTICAS DEL SISTEMA\n');
  
  return new Promise((resolve, reject) => {
    db.get("SELECT COUNT(*) as total FROM users", (err, total) => {
      if (err) { console.log('❌ Error:', err.message); resolve(); return; }
      
      db.get("SELECT COUNT(*) as estudiantes FROM users WHERE role = 'student'", (err, estudiantes) => {
        if (err) { console.log('❌ Error:', err.message); resolve(); return; }
        
        db.get("SELECT COUNT(*) as admins FROM users WHERE role = 'admin'", (err, admins) => {
          if (err) { console.log('❌ Error:', err.message); resolve(); return; }
          
          db.get("SELECT SUM(xp_points) as total_xp FROM users", (err, xp) => {
            if (err) { console.log('❌ Error:', err.message); resolve(); return; }
            
            db.get("SELECT AVG(xp_points) as avg_xp FROM users", (err, avg) => {
              if (err) { console.log('❌ Error:', err.message); resolve(); return; }
              
              console.log('╔══════════════════════════════════════════════════════════╗');
              console.log('║                    📊 ESTADÍSTICAS                      ║');
              console.log('╠══════════════════════════════════════════════════════════╣');
              console.log(`║  Total de usuarios:     ${String(total.total).padStart(6)}                         ║`);
              console.log(`║  Estudiantes:           ${String(estudiantes.estudiantes).padStart(6)}                         ║`);
              console.log(`║  Administradores:       ${String(admins.admins).padStart(6)}                         ║`);
              console.log(`║  XP total:             ${String(xp.total_xp || 0).padStart(6)}                         ║`);
              console.log(`║  XP promedio:          ${String(Math.round(avg.avg_xp || 0)).padStart(6)}                         ║`);
              console.log('╚══════════════════════════════════════════════════════════╝');
              console.log('\n');
              resolve();
            });
          });
        });
      });
    });
  });
}

// ============================================
// UTILIDADES
// ============================================

function preguntar(texto) {
  return new Promise((resolve) => {
    rl.question(texto, (respuesta) => {
      resolve(respuesta);
    });
  });
}

function presionarEnter() {
  return new Promise((resolve) => {
    rl.question('\nPresiona Enter para continuar...', () => {
      resolve();
    });
  });
}

// ============================================
// MENÚ PRINCIPAL
// ============================================

async function main() {
  console.clear();
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     🧪 MyLab - Gestión de Usuarios                        ║');
  console.log('║     ═══════════════════════════════════════════════        ║');
  console.log('║     Administra todos los usuarios del sistema              ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  while (true) {
    mostrarMenu();
    
    const opcion = await preguntar('Selecciona una opción: ');
    
    switch(opcion) {
      case '1':
        await verTodosUsuarios();
        break;
      case '2':
        await crearUsuario();
        break;
      case '3':
        await editarUsuario();
        break;
      case '4':
        await eliminarUsuario();
        break;
      case '5':
        await buscarUsuario();
        break;
      case '6':
        await topUsuarios();
        await presionarEnter();
        break;
      case '7':
        await estadisticas();
        await presionarEnter();
        break;
      case '8':
        console.log('\n👋 ¡Hasta luego!');
        rl.close();
        db.close();
        process.exit(0);
        break;
      default:
        console.log('❌ Opción inválida. Intenta de nuevo.');
        await presionarEnter();
    }
  }
}

// ============================================
// EJECUTAR
// ============================================

main().catch((error) => {
  console.error('❌ Error:', error);
  rl.close();
  db.close();
});