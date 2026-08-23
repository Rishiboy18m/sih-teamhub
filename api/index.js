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

// Base Health Check (Placed BEFORE DB init middleware for instant response)
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'SIH TeamHub API',
    tursoConfigured: !!process.env.TURSO_DATABASE_URL,
    jwtConfigured: !!process.env.JWT_SECRET,
    timestamp: new Date().toISOString()
  });
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

// Routes with both /api prefix and direct path for Vercel serverless rewrites
app.use('/api/auth', authRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/ideas', ideasRoutes);
app.use('/api/discussions', discussionsRoutes);
app.use('/api/milestones', milestonesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/judge', judgeRoutes);
app.use('/api/search', searchRoutes);

app.use('/auth', authRoutes);
app.use('/project', projectRoutes);
app.use('/tasks', tasksRoutes);
app.use('/files', filesRoutes);
app.use('/ideas', ideasRoutes);
app.use('/discussions', discussionsRoutes);
app.use('/milestones', milestonesRoutes);
app.use('/ai', aiRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/judge', judgeRoutes);
app.use('/search', searchRoutes);

// Global Express Error Handler for Serverless Resilience
app.use((err, req, res, next) => {
  console.error('Serverless Express Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
