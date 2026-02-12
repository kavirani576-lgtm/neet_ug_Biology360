const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static(__dirname));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'NEET Backend is running' });
});

// Authentication Routes
// Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (user) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        function (err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }

          const token = jwt.sign(
            { userId: this.lastID, username, email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
          );

          res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: this.lastID, username, email }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        // Log failed login attempt
        logSystem('WARNING', `Failed login attempt for email: ${email}`, `IP: ${req.ip}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Compare password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        // Log failed login attempt
        logSystem('WARNING', `Failed login attempt for user: ${user.username}`, `IP: ${req.ip}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Log successful login
      logUserActivity(user.id, 'LOGIN', `User logged in from IP: ${req.ip}`, req);

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username, email: user.email }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Protected route example
app.get('/api/profile', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Protected content routes
app.get('/api/premium-content', authenticateToken, (req, res) => {
  res.json({
    message: 'Premium content access granted',
    content: [
      { type: 'video', title: 'Advanced Cell Biology', duration: '45 min' },
      { type: 'notes', title: 'Complete NCERT Solutions', pages: 250 },
      { type: 'test', title: 'Full Syllabus Mock Test', questions: 180 }
    ]
  });
});

// User progress tracking
app.post('/api/progress', authenticateToken, (req, res) => {
  const { chapterId, progress } = req.body;

  // Store progress in database
  db.run('INSERT OR REPLACE INTO user_progress (user_id, chapter_id, progress, updated_at) VALUES (?, ?, ?, ?)',
    [req.user.userId, chapterId, progress, new Date().toISOString()],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save progress' });
      }
      res.json({ message: 'Progress saved successfully' });
    }
  );
});

// Get user progress
app.get('/api/progress', authenticateToken, (req, res) => {
  db.all('SELECT * FROM user_progress WHERE user_id = ?', [req.user.userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch progress' });
    }
    res.json({ progress: rows });
  });
});

// Admin Authentication Routes
app.post('/api/admin/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Hardcoded Master Admin Check
    if (email === 'rchhaba644@gmail.com' && password === 'rohit12345') {
      const token = jwt.sign(
        { userId: 999999, username: 'Master Admin', email: email, role: 'admin' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      return res.json({
        message: 'Admin login successful',
        token,
        admin: { id: 999999, username: 'Master Admin', email: email, role: 'admin' }
      });
    }

    db.get('SELECT * FROM admin_users WHERE email = ?', [email], async (err, admin) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!admin) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      // Compare password
      const isValidPassword = await bcrypt.compare(password, admin.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      const token = jwt.sign(
        { userId: admin.id, username: admin.username, email: admin.email, role: 'admin' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Admin login successful',
        token,
        admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Admin token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err || user.role !== 'admin') {
      return res.status(403).json({ error: 'Invalid or insufficient admin privileges' });
    }
    req.admin = user;
    next();
  });
};

// Admin API Routes
app.get('/api/admin/users', authenticateAdmin, (req, res) => {
  db.all('SELECT id, username, email, created_at FROM users ORDER BY created_at DESC', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    res.json({ users });
  });
});

app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  const stats = {};

  // Get total users
  db.get('SELECT COUNT(*) as total FROM users', (err, row) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch stats' });
    stats.totalUsers = row.total;

    // Get total progress records
    db.get('SELECT COUNT(*) as total FROM user_progress', (err, row) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch stats' });
      stats.totalProgress = row.total;

      // Get average progress
      db.get('SELECT AVG(progress) as avg FROM user_progress', (err, row) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch stats' });
        stats.averageProgress = Math.round(row.avg || 0);

        res.json(stats);
      });
    });
  });
});

const multer = require('multer');
const fs = require('fs-extra');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/admin/content', authenticateAdmin, upload.single('file'), (req, res) => {
  const { title, type, content, chapter_id, is_premium } = req.body;
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

  db.run('INSERT INTO content (title, type, content, file_url, chapter_id, is_premium) VALUES (?, ?, ?, ?, ?, ?)',
    [title, type, content, fileUrl, chapter_id, is_premium],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create content' });
      }
      res.json({ message: 'Content created successfully', id: this.lastID, fileUrl });
    }
  );
});

app.get('/api/admin/content', authenticateAdmin, (req, res) => {
  const { type } = req.query;
  let query = 'SELECT * FROM content';
  const params = [];

  if (type) {
    query += ' WHERE type = ?';
    params.push(type);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, content) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch content' });
    }
    res.json({ content });
  });
});

// Public Content API
app.get('/api/content', (req, res) => {
  const { type, chapter_id } = req.query;
  let query = 'SELECT id, title, type, content, file_url, chapter_id, is_premium, created_at FROM content WHERE 1=1';
  const params = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  if (chapter_id) {
    query += ' AND chapter_id = ?';
    params.push(chapter_id);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, content) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch content' });
    }
    res.json({ content });
  });
});

app.delete('/api/admin/content/:id', authenticateAdmin, (req, res) => {
  // First get the file path to delete it
  db.get('SELECT file_url FROM content WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (row && row.file_url) {
      const filePath = path.join(__dirname, row.file_url);
      fs.remove(filePath, err => {
        if (err) console.error('Failed to delete file:', err);
      });
    }

    db.run('DELETE FROM content WHERE id = ?', [req.params.id], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete content' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Content not found' });
      }
      res.json({ message: 'Content deleted successfully' });
    });
  });
});

// Enhanced Admin API for Complete Control
app.get('/api/admin/dashboard', authenticateAdmin, (req, res) => {
  const dashboard = {};

  // Get comprehensive stats
  db.get('SELECT COUNT(*) as total FROM users', (err, row) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    dashboard.totalUsers = row.total;

    db.get('SELECT COUNT(*) as total FROM admin_users', (err, row) => {
      dashboard.totalAdmins = row.total;

      db.get('SELECT COUNT(*) as total FROM content', (err, row) => {
        dashboard.totalContent = row.total;

        db.get('SELECT COUNT(*) as total FROM user_activity', (err, row) => {
          dashboard.totalActivities = row.total;

          // Get recent activities
          db.all('SELECT ua.*, u.username FROM user_activity ua JOIN users u ON ua.user_id = u.id ORDER BY ua.created_at DESC LIMIT 10', (err, activities) => {
            dashboard.recentActivities = activities || [];

            // Get active sessions
            db.all('SELECT us.*, u.username FROM user_sessions us JOIN users u ON us.user_id = u.id WHERE us.expires_at > datetime("now") ORDER BY us.created_at DESC LIMIT 10', (err, sessions) => {
              dashboard.activeSessions = sessions || [];

              // Get system logs
              db.all('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 20', (err, logs) => {
                dashboard.systemLogs = logs || [];

                // Get user progress summary
                db.all('SELECT u.username, COUNT(up.id) as progress_count, AVG(up.progress) as avg_progress FROM users u LEFT JOIN user_progress up ON u.id = up.user_id GROUP BY u.id', (err, progressSummary) => {
                  dashboard.userProgressSummary = progressSummary || [];

                  res.json(dashboard);
                });
              });
            });
          });
        });
      });
    });
  });
});

// Get all user activities
app.get('/api/admin/activities', authenticateAdmin, (req, res) => {
  const { userId, limit = 50 } = req.query;

  let query = `
    SELECT ua.*, u.username, u.email 
    FROM user_activity ua 
    JOIN users u ON ua.user_id = u.id
  `;
  const params = [];

  if (userId) {
    query += ' WHERE ua.user_id = ?';
    params.push(userId);
  }

  query += ' ORDER BY ua.created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  db.all(query, params, (err, activities) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch activities' });
    }
    res.json({ activities });
  });
});

// Get system logs
app.get('/api/admin/logs', authenticateAdmin, (req, res) => {
  const { level, limit = 100 } = req.query;

  let query = 'SELECT * FROM system_logs';
  const params = [];

  if (level) {
    query += ' WHERE level = ?';
    params.push(level);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  db.all(query, params, (err, logs) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch logs' });
    }
    res.json({ logs });
  });
});

// Get active sessions
app.get('/api/admin/sessions', authenticateAdmin, (req, res) => {
  db.all(`
    SELECT us.*, u.username, u.email 
    FROM user_sessions us 
    JOIN users u ON us.user_id = u.id 
    WHERE us.expires_at > datetime("now") 
    ORDER BY us.created_at DESC
  `, (err, sessions) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }
    res.json({ sessions });
  });
});

// Control user - suspend/delete
app.post('/api/admin/users/:id/control', authenticateAdmin, (req, res) => {
  const { action } = req.body; // suspend, delete, reset_password
  const userId = req.params.id;

  switch (action) {
    case 'suspend':
      // Mark user as suspended (you'd add a suspended column to users table)
      db.run('UPDATE users SET suspended = 1 WHERE id = ?', [userId], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to suspend user' });
        res.json({ message: 'User suspended successfully' });
      });
      break;

    case 'delete':
      db.run('DELETE FROM users WHERE id = ?', [userId], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to delete user' });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted successfully' });
      });
      break;

    case 'reset_password':
      const newPassword = 'temp123';
      const bcrypt = require('bcryptjs');
      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: 'Failed to reset password' });
        db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], function (err) {
          if (err) return res.status(500).json({ error: 'Failed to reset password' });
          res.json({ message: 'Password reset successfully', newPassword });
        });
      });
      break;

    default:
      res.status(400).json({ error: 'Invalid action' });
  }
});

// Log user activity
function logUserActivity(userId, action, details, req) {
  db.run('INSERT INTO user_activity (user_id, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
    [userId, action, details, req.ip, req.get('User-Agent')],
    (err) => {
      if (err) console.error('Failed to log user activity:', err);
    }
  );
}

// Log system events
function logSystem(level, message, details) {
  db.run('INSERT INTO system_logs (level, message, details) VALUES (?, ?, ?)',
    [level, message, details],
    (err) => {
      if (err) console.error('Failed to log system event:', err);
    }
  );
}

// Serve the main HTML file for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Sample API endpoints for NEET data
app.get('/api/chapters', (req, res) => {
  res.json({
    chapters: [
      { id: 1, name: 'The Living World', subject: 'Biology' },
      { id: 2, name: 'Biological Classification', subject: 'Biology' },
      { id: 3, name: 'Plant Kingdom', subject: 'Biology' },
      { id: 4, name: 'Animal Kingdom', subject: 'Biology' }
    ]
  });
});

app.get('/api/mcq-questions', (req, res) => {
  const { chapter, difficulty } = req.query;
  res.json({
    questions: [
      {
        id: 1,
        question: 'What is the basic unit of life?',
        options: ['Cell', 'Tissue', 'Organ', 'Organism'],
        correct: 0,
        chapter: chapter || 1,
        difficulty: difficulty || 'easy'
      }
    ]
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NEET Backend server running on http://localhost:${PORT}`);
  console.log(`📚 Frontend available at http://localhost:${PORT}`);
  console.log(`🔗 API endpoints available at http://localhost:${PORT}/api`);
});
