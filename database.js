const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'neet.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create users table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table ready');
    }
  });

  // Create user progress table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      chapter_id INTEGER NOT NULL,
      progress INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id, chapter_id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating user_progress table:', err.message);
    } else {
      console.log('User progress table ready');
    }
  });

  // Create courses table
  db.run(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      price REAL DEFAULT 0,
      is_premium BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating courses table:', err.message);
    } else {
      console.log('Courses table ready');
    }
  });

  // Create admin users table
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating admin_users table:', err.message);
    } else {
      console.log('Admin users table ready');
      // Create default admin user
      createDefaultAdmin();
    }
  });

  // Create content management table
  db.run(`
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT,
      file_url TEXT,
      chapter_id INTEGER,
      is_premium BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating content table:', err.message);
    } else {
      console.log('Content table ready');
    }
  });

  // Create user activity tracking table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating user_activity table:', err.message);
    } else {
      console.log('User activity table ready');
    }
  });

  // Create system logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating system_logs table:', err.message);
    } else {
      console.log('System logs table ready');
    }
  });

  // Create user sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating user_sessions table:', err.message);
    } else {
      console.log('User sessions table ready');
    }
  });
});

// Create default admin user
function createDefaultAdmin() {
  const bcrypt = require('bcryptjs');
  const defaultAdmin = {
    username: 'rchhaba644',
    email: 'rchhaba644@gmail.com',
    password: 'rohit12345'
  };

  bcrypt.hash(defaultAdmin.password, 10, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing admin password:', err);
      return;
    }

    db.run('INSERT OR IGNORE INTO admin_users (username, email, password) VALUES (?, ?, ?)',
      [defaultAdmin.username, defaultAdmin.email, hashedPassword],
      (err) => {
        if (err) {
          console.error('Error creating default admin:', err);
        } else {
          console.log('Admin user created (rchhaba644@gmail.com / rohit12345)');
        }
      }
    );
  });
}

module.exports = db;
