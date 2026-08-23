const path = require('path');
const fs = require('fs');

let sqlite3 = null;
let sqliteDb = null;
let libsqlClient = null;
let useTurso = false;

// Check if Turso Cloud SQLite credentials exist (100% Free Cloud SQLite for Vercel)
if (process.env.TURSO_DATABASE_URL) {
  try {
    const { createClient } = require('@libsql/client');
    libsqlClient = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN || ''
    });
    useTurso = true;
    console.log('⚡ Connected to Turso Cloud SQLite Database for $0 Vercel Persistence');
  } catch (e) {
    console.warn('Failed to load @libsql/client, falling back to local SQLite3:', e.message);
  }
}

if (!useTurso) {
  try {
    const dynamicRequire = eval('require');
    sqlite3 = dynamicRequire('sqlite3').verbose();
    const dbPath = process.env.DATABASE_PATH || (process.env.VERCEL ? '/tmp/sih_teamhub.db' : path.join(__dirname, 'sih_teamhub.db'));
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    sqliteDb = new sqlite3.Database(dbPath);
  } catch (err) {
    console.warn('SQLite3 native driver unavailable on serverless environment (Ensure TURSO_DATABASE_URL is configured):', err.message);
  }
}

// Unified Promisified DB Query Helpers (Works on both Local SQLite & Turso Cloud DB)
async function query(sql, params = []) {
  if (useTurso && libsqlClient) {
    try {
      const result = await libsqlClient.execute({ sql, args: params });
      return result.rows.map(row => {
        const obj = {};
        result.columns.forEach((col, idx) => {
          obj[col] = row[idx];
        });
        return obj;
      });
    } catch (err) {
      console.error('Turso query error:', err.message);
      return [];
    }
  }

  if (!sqliteDb) {
    return [];
  }

  return new Promise((resolve) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) resolve([]);
      else resolve(rows || []);
    });
  });
}

async function get(sql, params = []) {
  if (useTurso && libsqlClient) {
    try {
      const result = await libsqlClient.execute({ sql, args: params });
      if (!result.rows || result.rows.length === 0) return null;
      const row = result.rows[0];
      const obj = {};
      result.columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    } catch (err) {
      console.error('Turso get error:', err.message);
      return null;
    }
  }

  if (!sqliteDb) {
    return null;
  }

  return new Promise((resolve) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) resolve(null);
      else resolve(row || null);
    });
  });
}

async function run(sql, params = []) {
  if (useTurso && libsqlClient) {
    try {
      const result = await libsqlClient.execute({ sql, args: params });
      return { id: Number(result.lastInsertRowid || 0), changes: result.rowsAffected };
    } catch (err) {
      console.error('Turso run error:', err.message);
      return { id: 0, changes: 0 };
    }
  }

  if (!sqliteDb) {
    return { id: 0, changes: 0 };
  }

  return new Promise((resolve) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) resolve({ id: 0, changes: 0 });
      else resolve({ id: this.lastID || 0, changes: this.changes || 0 });
    });
  });
}

// Database initialization & complete relational schema creation
function initDB() {
  return new Promise(async (resolve) => {
    try {
      const schemas = [
        `CREATE TABLE IF NOT EXISTS teams (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          code TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          username TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('leader', 'member')),
          specialization TEXT DEFAULT 'Developer',
          team_id INTEGER NOT NULL,
          avatar TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER UNIQUE NOT NULL,
          title TEXT NOT NULL,
          problem_code TEXT,
          organization_ministry TEXT,
          theme TEXT,
          category TEXT,
          description TEXT,
          proposed_solution TEXT,
          objectives TEXT,
          expected_outcome TEXT,
          important_links TEXT,
          additional_notes TEXT,
          repo_url TEXT,
          demo_url TEXT,
          deadline TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          priority TEXT NOT NULL CHECK(priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
          status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'review', 'completed')) DEFAULT 'pending',
          category TEXT DEFAULT 'Development',
          assigned_to_id INTEGER,
          created_by_id INTEGER NOT NULL,
          due_date TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
          FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS task_comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          comment TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS task_activities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          action_text TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS task_attachments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          original_name TEXT NOT NULL,
          stored_name TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          user_id INTEGER,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT DEFAULT 'event',
          color TEXT DEFAULT 'blue',
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          uploaded_by_id INTEGER NOT NULL,
          original_name TEXT NOT NULL,
          stored_name TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          file_type TEXT,
          category TEXT DEFAULT 'Documents',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
          FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS ideas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          author_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          url TEXT,
          tags TEXT,
          upvotes INTEGER DEFAULT 0,
          category TEXT CHECK(category IN ('idea', 'research', 'question')) DEFAULT 'idea',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
          FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS idea_comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          idea_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          comment TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS discussions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          author_id INTEGER NOT NULL,
          message TEXT NOT NULL,
          category TEXT DEFAULT 'General',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
          FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS discussion_replies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          discussion_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          reply TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS milestones (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          due_date TEXT,
          completion_percentage INTEGER DEFAULT 0,
          status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS calendar_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          event_date TEXT NOT NULL,
          event_type TEXT CHECK(event_type IN ('deadline', 'meeting', 'milestone', 'review', 'presentation', 'submission', 'general')) DEFAULT 'general',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS judge_pitch_sections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          section_name TEXT NOT NULL,
          content_text TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS judge_questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          question_text TEXT NOT NULL,
          default_answer TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS saved_answers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question_id INTEGER NOT NULL,
          team_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          answer_text TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (question_id) REFERENCES judge_questions(id) ON DELETE CASCADE,
          FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`
      ];

      for (const sql of schemas) {
        await run(sql);
      }
      resolve();
    } catch (err) {
      console.error('initDB error:', err);
      resolve();
    }
  });
}

module.exports = {
  db: sqliteDb,
  query,
  get,
  run,
  initDB
};
