const express = require('express');
const cors = require('cors');

const { initDB } = require('../server/db');
const authRoutes = require('../server/routes/auth');
const projectRoutes = require('../server/routes/project');
const tasksRoutes = require('../server/routes/tasks');
const filesRoutes = require('../server/routes/files');
const ideasRoutes = require('../server/routes/ideas');
const discussionsRoutes = require('../server/routes/discussions');
const milestonesRoutes = require('../server/routes/milestones');
const aiRoutes = require('../server/routes/ai');
const notificationsRoutes = require('../server/routes/notifications');
const judgeRoutes = require('../server/routes/judge');
const searchRoutes = require('../server/routes/search');

const app = express();

app.use(cors());
app.use(express.json());

// Log incoming req.url for Vercel debugging
app.use((req, res, next) => {
  console.log(`[Vercel Serverless] ${req.method} ${req.url}`);
  next();
});

// Ensure DB schema initialization
let dbInitialized = false;
let dbInitPromise = null;

app.use((req, res, next) => {
  if (!dbInitialized) {
    if (!dbInitPromise) {
      dbInitPromise = initDB()
        .then(() => {
          dbInitialized = true;
        })
        .catch(err => {
          console.error('Database initialization error:', err);
          dbInitialized = true;
        });
    }
    dbInitPromise.then(() => next()).catch(() => next());
  } else {
    next();
  }
});

// Base Health Check
app.get(['/api/health', '/health', '/health.js', '/index.js'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'SIH TeamHub API',
    tursoConfigured: !!process.env.TURSO_DATABASE_URL,
    jwtConfigured: !!process.env.JWT_SECRET,
    url: req.url,
    timestamp: new Date().toISOString()
  });
});

// Routes with /api, direct path, and wildcard handling
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/project', '/project'], projectRoutes);
app.use(['/api/tasks', '/tasks'], tasksRoutes);
app.use(['/api/files', '/files'], filesRoutes);
app.use(['/api/ideas', '/ideas'], ideasRoutes);
app.use(['/api/discussions', '/discussions'], discussionsRoutes);
app.use(['/api/milestones', '/milestones'], milestonesRoutes);
app.use(['/api/ai', '/ai'], aiRoutes);
app.use(['/api/notifications', '/notifications'], notificationsRoutes);
app.use(['/api/judge', '/judge'], judgeRoutes);
app.use(['/api/search', '/search'], searchRoutes);

// Fallback response for unmapped API routes
app.use((req, res) => {
  res.status(404).json({ error: 'API Endpoint Not Found', url: req.url, method: req.method });
});

// Global Express Error Handler
app.use((err, req, res, next) => {
  console.error('Serverless Express Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
