const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { initDB, get, run, query } = require('./db');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/project');
const tasksRoutes = require('./routes/tasks');
const filesRoutes = require('./routes/files');
const ideasRoutes = require('./routes/ideas');
const discussionsRoutes = require('./routes/discussions');
const milestonesRoutes = require('./routes/milestones');
const aiRoutes = require('./routes/ai');
const notificationsRoutes = require('./routes/notifications');
const judgeRoutes = require('./routes/judge');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure DB schema is initialized on serverless or server requests
let dbInitialized = false;
let dbInitPromise = null;

app.use(async (req, res, next) => {
  if (!dbInitialized) {
    if (!dbInitPromise) {
      dbInitPromise = initDB().then(() => {
        dbInitialized = true;
      }).catch(err => {
        console.error('Database initialization error:', err);
      });
    }
    await dbInitPromise;
  }
  next();
});

// Routes (Supported with both /api prefix and direct path for Vercel serverless rewrites)
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

// Base Health Check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'ok', service: 'SIH TeamHub API', timestamp: new Date().toISOString() });
});

// Serve frontend static build if built (for single-port local production)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads') && req.method === 'GET') {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// Seed Initial Demo Data if empty
async function seedDemoData() {
  try {
    const teams = await query('SELECT * FROM teams');
    if (teams.length > 0) {
      console.log('Database already populated. Skipping demo seed.');
      return;
    }

    console.log('Seeding demo team data...');
    const teamRes = await run(
      'INSERT INTO teams (name, code) VALUES (?, ?)',
      ['CyberKnights', 'SIH-2026-X']
    );
    const teamId = teamRes.id;

    const pwdHash = await bcrypt.hash('password123', 10);

    const leaderRes = await run(
      `INSERT INTO users (email, username, password_hash, full_name, role, specialization, team_id, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['leader@cyberknights.com', 'rishi_leader', pwdHash, 'Rishi', 'leader', 'Team Leader & Full-Stack Architect', teamId, 'https://api.dicebear.com/7.x/bottts/svg?seed=Rishi']
    );

    await run(
      `INSERT INTO users (email, username, password_hash, full_name, role, specialization, team_id, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['dev@cyberknights.com', 'arun_dev', pwdHash, 'Arun', 'member', 'Backend & API Developer', teamId, 'https://api.dicebear.com/7.x/bottts/svg?seed=Arun']
    );

    await run(
      `INSERT INTO projects (team_id, title, problem_code, organization_ministry, theme, category, description, proposed_solution, objectives, expected_outcome, important_links, additional_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        teamId,
        'SIH TeamHub — Full-Stack Collaborative Workspace',
        'SIH1645',
        'Ministry of Education / AICTE',
        'Smart Education & Collaboration',
        'Software',
        'Hackathon teams rely on fragmented applications causing scattered files and data security risks.',
        'Unified workspace featuring Kanban task management, problem statement analysis, shared file repository, discussion feeds, SIH tracker, AI assistant, and judge presentation prep.',
        'Centralize hackathon project workflow into one secure multi-tenant platform.',
        'Publicly deployed web workspace accessible by team members and hackathon judges.',
        'https://github.com/Rishiboy18m/sih-teamhub',
        'Targeting SIH Grand Finale 2026.'
      ]
    );

    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const demoTasks = [
      { title: 'Define Technical Architecture & DB Schema', desc: 'Design SQLite relational schema and API contracts.', priority: 'critical', status: 'completed', cat: 'Research', assignee: leaderRes.id, due: yesterdayStr },
      { title: 'Implement JWT Auth & Multi-Tenant Team Middleware', desc: 'Secure backend routes with Bearer token checks.', priority: 'high', status: 'completed', cat: 'Development', assignee: leaderRes.id, due: yesterdayStr },
      { title: 'Build Responsive SaaS UI & 4-Color Theme', desc: 'Style dashboard with cream, teal, coral, and yellow palette.', priority: 'high', status: 'completed', cat: 'Design', assignee: leaderRes.id, due: yesterdayStr },
      { title: 'Integrate Context-Aware AI Prompt Engine', desc: 'Condition AI recommendations on project context.', priority: 'medium', status: 'in_progress', cat: 'Development', assignee: leaderRes.id, due: tomorrowStr },
      { title: 'Prepare 3-Minute Grand Finale Jury Slides & Mock Q&A', desc: 'Fill 11 pitch sections and mock judge questions.', priority: 'critical', status: 'pending', cat: 'Pitch Deck', assignee: leaderRes.id, due: tomorrowStr },
      { title: 'Deploy Production Web Server & Database', desc: 'Deploy Vercel serverless application and Turso Cloud database.', priority: 'high', status: 'completed', cat: 'Documentation', assignee: leaderRes.id, due: yesterdayStr }
    ];

    for (const t of demoTasks) {
      await run(
        `INSERT INTO tasks (team_id, title, description, priority, status, category, assigned_to_id, created_by_id, due_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [teamId, t.title, t.desc, t.priority, t.status, t.cat, t.assignee, leaderRes.id, t.due]
      );
    }

    const ideas = [
      { title: 'Real-time WebSocket Cursor Sync', content: 'Enable live collaborative editing on problem statement notes.', type: 'idea', tags: 'websocket,collaboration' },
      { title: 'SIH Official Evaluation Criteria Guidelines', content: 'Resource link to official SIH judging parameters and scoring rubric.', type: 'research', url: 'https://sih.gov.in', tags: 'sih,judging' },
      { title: 'How do we demonstrate offline capability during jury demo?', content: 'Question regarding internet connectivity handling at hackathon venue.', type: 'question', tags: 'demo,offline' }
    ];

    for (const item of ideas) {
      await run(
        `INSERT INTO ideas (team_id, author_id, title, content, url, tags, category, upvotes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [teamId, leaderRes.id, item.title, item.content, item.url || null, item.tags, item.type, 3]
      );
    }

    const discussions = [
      { msg: 'Welcome @Arun! Let us complete the SIH Project Tracker and Judge Prep Q&A.', cat: 'General' },
      { msg: 'API routes and Turso Cloud database connections are live and operational.', cat: 'Technical' }
    ];

    for (const d of discussions) {
      await run(
        `INSERT INTO discussions (team_id, author_id, message, category) VALUES (?, ?, ?, ?)`,
        [teamId, leaderRes.id, d.msg, d.cat]
      );
    }

    const pitchSections = [
      { name: 'Problem', content: 'Hackathon teams currently rely on fragmented applications (WhatsApp, Google Docs, spreadsheets, task trackers), causing scattered data, lost files, and security risks.' },
      { name: 'Existing Solution', content: 'Teams manually manage project details across disconnected tools without multi-tenant isolation or hackathon-specific workflows.' },
      { name: 'Proposed Solution', content: 'SIH TeamHub: An all-in-one collaborative workspace specifically designed for hackathon teams featuring problem analysis, Kanban tasks, file storage, AI assistant, and jury prep.' },
      { name: 'USP', content: 'Built specifically for hackathon workflows with 11 SIH milestone roadmaps, contextual AI recommendations, and interactive jury pitch Q&A.' },
      { name: 'Innovation', content: 'Context-aware AI assistant conditioned directly on team problem statement data with 1-click task conversion.' },
      { name: 'Technical Architecture', content: 'React 18 SPA frontend, Express REST API backend, SQLite/Turso relational database, JWT authentication, and Vercel serverless hosting.' },
      { name: 'Feasibility', content: 'Fully implemented, tested, and live with production bundle optimization.' },
      { name: 'Scalability', content: 'Relational multi-tenant isolation supporting thousands of concurrent teams.' },
      { name: 'Social Impact', content: 'Empowers student innovators across India to organize and execute high-impact hackathon projects efficiently.' },
      { name: 'Business/Deployment Model', content: 'SaaS workspace model for educational institutions, hackathon organizers, and developer communities.' },
      { name: 'Future Scope', content: 'Real-time collaborative document editing, automated code repository analysis, and mobile app integration.' }
    ];

    for (const ps of pitchSections) {
      await run(
        `INSERT INTO judge_pitch_sections (team_id, section_name, content_text) VALUES (?, ?, ?)`,
        [teamId, ps.name, ps.content]
      );
    }

    const judgeQuestions = [
      { q: 'Why is your solution better than existing generic task managers like Trello or Notion?', ans: 'SIH TeamHub is purpose-built for hackathons, integrating problem statement management, official SIH 11-milestone tracking, context-aware AI tools, and jury presentation prep into one platform.' },
      { q: 'What makes your solution innovative?', ans: 'Our AI assistant reads team problem context directly to generate custom roadmaps, risk assessments, and automatically convert suggestions into project tasks.' },
      { q: 'How will your application scale during high-traffic hackathon submission hours?', ans: 'Multi-tenant database schema with indexed team IDs and lightweight serverless deployment guarantees high throughput.' },
      { q: 'What happens if internet connectivity is unavailable at the hackathon venue?', ans: 'Local storage fallback caches critical task data and pitch deck responses client-side.' },
      { q: 'What are the main limitations of your current prototype?', ans: 'Currently supports file uploads up to 50MB per file; real-time video conferencing can be integrated in future phases.' },
      { q: 'How will you deploy and maintain this platform for future hackathons?', ans: 'Hosted on serverless cloud infrastructure with zero maintenance overhead.' }
    ];

    for (const jq of judgeQuestions) {
      await run(
        `INSERT INTO judge_questions (team_id, question_text, default_answer) VALUES (?, ?, ?)`,
        [teamId, jq.q, jq.ans]
      );
    }

    const milestones = [
      { title: 'Phase 1: Problem Analysis & System Design', desc: 'Analyze SIH problem statement.', status: 'completed', due: yesterdayStr },
      { title: 'Phase 2: Core Platform Development & AI Integration', desc: 'Build backend API and UI.', status: 'completed', due: yesterdayStr },
      { title: 'Phase 3: Final Pitch & Live Demo Video', desc: 'Record walkthrough video.', status: 'pending', due: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
    ];

    for (const m of milestones) {
      await run(
        `INSERT INTO milestones (team_id, title, description, due_date, status) VALUES (?, ?, ?, ?, ?)`,
        [teamId, m.title, m.desc, m.due, m.status]
      );
    }

    const calendarEvents = [
      { title: 'SIH Hackathon Pitch Round 1', desc: '3-minute presentation to jury panel', date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], type: 'presentation' },
      { title: 'Team Sync & Code Freeze Review', desc: 'Final code review and demo walkthrough', date: tomorrowStr, type: 'review' }
    ];

    for (const ce of calendarEvents) {
      await run(
        `INSERT INTO calendar_events (team_id, title, description, event_date, event_type) VALUES (?, ?, ?, ?, ?)`,
        [teamId, ce.title, ce.desc, ce.date, ce.type]
      );
    }

    console.log('Demo data seeded successfully!');
    console.log('Default Leader Login: leader@cyberknights.com / password123');
    console.log('Default Member Login: dev@cyberknights.com / password123');
    console.log('Team Code: SIH-2026-X');
  } catch (err) {
    console.error('Error seeding demo data:', err);
  }
}

// Start server if executed directly via Node CLI
if (require.main === module) {
  initDB().then(async () => {
    await seedDemoData();
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`🚀 SIH TeamHub API Server running on port ${PORT}`);
      console.log(`==================================================`);
    });
  }).catch(err => {
    console.error('Failed to initialize database:', err);
  });
}

module.exports = app;
