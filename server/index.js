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

// Routes
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

// Base Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SIH TeamHub API', timestamp: new Date().toISOString() });
});

// Serve frontend static build if built
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
    const existingTeam = await get('SELECT * FROM teams LIMIT 1');
    if (existingTeam) {
      console.log('Database already populated. Skipping demo seed.');
      return;
    }

    console.log('Seeding initial SIH TeamHub demo data...');

    // 1. Create Demo Team
    const teamCode = 'SIH-2026-X';
    const teamRes = await run('INSERT INTO teams (name, code) VALUES (?, ?)', ['CyberKnights', teamCode]);
    const teamId = teamRes.id;

    // 2. Hash Password
    const passwordHash = await bcrypt.hash('password123', 10);

    // 3. Create Leader (Rishi)
    const leaderRes = await run(
      `INSERT INTO users (email, username, password_hash, full_name, role, specialization, team_id, avatar) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'leader@cyberknights.com',
        'rishi_leader',
        passwordHash,
        'Rishi',
        'leader',
        'Team Leader & Full-Stack Architect',
        teamId,
        'https://api.dicebear.com/7.x/bottts/svg?seed=rishi_leader'
      ]
    );
    const leaderId = leaderRes.id;

    // 4. Create Members (Arun, Priya)
    const member1Res = await run(
      `INSERT INTO users (email, username, password_hash, full_name, role, specialization, team_id, avatar) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'dev@cyberknights.com',
        'arun_dev',
        passwordHash,
        'Arun',
        'member',
        'Backend & Database Developer',
        teamId,
        'https://api.dicebear.com/7.x/bottts/svg?seed=arun_dev'
      ]
    );
    const member1Id = member1Res.id;

    const member2Res = await run(
      `INSERT INTO users (email, username, password_hash, full_name, role, specialization, team_id, avatar) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'ui@cyberknights.com',
        'priya_ui',
        passwordHash,
        'Priya',
        'member',
        'Research & UI/UX Designer',
        teamId,
        'https://api.dicebear.com/7.x/bottts/svg?seed=priya_ui'
      ]
    );
    const member2Id = member2Res.id;

    // 5. Create Project & Problem Statement
    await run(
      `INSERT INTO projects (
        team_id, title, problem_code, organization_ministry, theme, category, 
        description, proposed_solution, objectives, expected_outcome, 
        important_links, additional_notes, repo_url, demo_url, deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        teamId,
        'SIH TeamHub - Collaborative Workspace',
        'SIH-1492',
        'Ministry of Education / AICTE',
        'Smart Education & Workplace Productivity',
        'Software & Productivity',
        'Collaborative unified workspace for Smart India Hackathon teams replacing WhatsApp, Google Docs, and spreadsheet workflows with isolated multi-tenant team workspaces.',
        'A unified platform featuring task Kanban, problem statement management, pitch deck tools, file repository, discussion feeds, calendar, and built-in AI assistant.',
        '1. Streamline team task assignments.\n2. Ensure zero data leaks across teams.\n3. Assist teams in 3-minute jury presentation preparation.',
        'Higher project completion rate and polished prototype presentations.',
        'https://github.com/cyberknights/sih-teamhub, https://sih.gov.in',
        'Targeting SIH 2026 Grand Finale presentation round.',
        'https://github.com/cyberknights/sih-teamhub',
        'https://sih-teamhub.demo.app',
        new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      ]
    );

    // 6. Create Tasks
    const yesterdayStr = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const pastStr = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const tasksData = [
      {
        title: 'Problem Statement & Market Research',
        desc: 'Gather background statistics and SIH guidelines.',
        priority: 'high',
        status: 'completed',
        category: 'Research',
        assigned: member2Id,
        due: pastStr
      },
      {
        title: 'Database Schema & Data Isolation Architecture',
        desc: 'Define SQLite schemas for Users, Teams, Tasks, Files, Ideas, and Milestones.',
        priority: 'high',
        status: 'completed',
        category: 'Development',
        assigned: member1Id,
        due: pastStr
      },
      {
        title: 'Figma UI Wireframes & Layout Component Design',
        desc: 'Design high-fidelity UI mockup.',
        priority: 'medium',
        status: 'completed',
        category: 'Design',
        assigned: member2Id,
        due: pastStr
      },
      {
        title: 'Backend API Authentication & JWT Middleware',
        desc: 'Implement express endpoints for auth, project, tasks, files, and AI assistant.',
        priority: 'critical',
        status: 'in_progress',
        category: 'Development',
        assigned: member1Id,
        due: tomorrowStr
      },
      {
        title: 'Fix Authentication Token Expiry Edge Case',
        desc: 'Resolve issue where expired session token does not auto-redirect.',
        priority: 'critical',
        status: 'pending',
        category: 'Development',
        assigned: member1Id,
        due: yesterdayStr
      },
      {
        title: 'Unit Testing for API Endpoints & DB Queries',
        desc: 'Perform end-to-end integration test.',
        priority: 'medium',
        status: 'in_progress',
        category: 'Testing',
        assigned: leaderId,
        due: tomorrowStr
      },
      {
        title: 'Prepare SIH 3-Minute Presentation Slide Deck',
        desc: 'Format slides following SIH official guidelines.',
        priority: 'high',
        status: 'review',
        category: 'Pitch Deck',
        assigned: leaderId,
        due: tomorrowStr
      },
      {
        title: 'System Architecture Documentation & README',
        desc: 'Write complete user guide.',
        priority: 'low',
        status: 'completed',
        category: 'Documentation',
        assigned: member2Id,
        due: pastStr
      }
    ];

    for (const t of tasksData) {
      const taskRes = await run(
        `INSERT INTO tasks (team_id, title, description, priority, status, category, assigned_to_id, created_by_id, due_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [teamId, t.title, t.desc, t.priority, t.status, t.category, t.assigned, leaderId, t.due]
      );

      await run(
        'INSERT INTO task_activities (task_id, user_id, action_text) VALUES (?, ?, ?)',
        [taskRes.id, leaderId, `Created task "${t.title}"`]
      );
    }

    // 7. Seed 11 Judge Pitch Sections (Section 21)
    const pitchSectionsSeed = [
      { name: 'Problem', content: 'Hackathon teams rely on fragmented apps (WhatsApp, Docs, Sheets), causing scattered tasks and data leak risks.' },
      { name: 'Existing Solution', content: 'Generic tools like Trello lack SIH milestone trackers, problem statement analyzers, and 3-minute pitch tools.' },
      { name: 'Proposed Solution', content: 'SIH TeamHub: an all-in-one workspace with team data isolation, Kanban, AI assistant, and judge prep.' },
      { name: 'USP', content: 'First workspace custom-built for Smart India Hackathon rubrics with context-aware AI and 100% team isolation.' },
      { name: 'Innovation', content: 'AI Task Converter & Judge Q&A Simulator linked directly to the team problem statement.' },
      { name: 'Technical Architecture', content: 'React 18 + Vite frontend, Node.js/Express REST API backend, SQLite relational database with JWT auth.' },
      { name: 'Feasibility', content: 'Fully functional full-stack prototype ready for immediate deployment and hackathon team onboarding.' },
      { name: 'Scalability', content: 'Lightweight REST API architecture supporting hundreds of concurrent team workspaces.' },
      { name: 'Social Impact', content: 'Boosts hackathon project completion rates across Indian engineering colleges and universities.' },
      { name: 'Business/Deployment Model', content: 'Open-source community edition for hackathons with premium enterprise analytics for universities.' },
      { name: 'Future Scope', content: 'Mobile application, real-time WebSocket sync, and automated Git repository integration.' }
    ];

    for (const ps of pitchSectionsSeed) {
      await run(
        'INSERT INTO judge_pitch_sections (team_id, section_name, content_text) VALUES (?, ?, ?)',
        [teamId, ps.name, ps.content]
      );
    }

    // 8. Seed 6 Official Mock Judge Questions & Default Saved Answers (Section 21)
    const judgeQuestionsSeed = [
      {
        q: 'Why is your solution better?',
        ans: 'Unlike Trello or WhatsApp, SIH TeamHub is designed specifically for SIH hackathons with strict team data isolation, AI task converters, and 3-minute pitch deck outliners.'
      },
      {
        q: 'What makes it innovative?',
        ans: 'Our context-aware AI Assistant reads the team problem statement to generate customized task breakdowns, risk matrices, and simulated judge Q&As.'
      },
      {
        q: 'How will it scale?',
        ans: 'Built on a lightweight REST architecture with SQLite/PostgreSQL support, enabling fast performance even on low-bandwidth hackathon WiFi.'
      },
      {
        q: 'What happens if the internet is unavailable?',
        ans: 'The application supports local offline caching and SQLite sync so teams can continue editing tasks without losing progress.'
      },
      {
        q: 'What are the main limitations?',
        ans: 'Currently requires a central server for multi-device sync, which we plan to expand with P2P WebRTC data sync in future releases.'
      },
      {
        q: 'How will you deploy it?',
        ans: 'Containerized with Docker for 1-click cloud deployment on Vercel, Render, or self-hosted university servers.'
      }
    ];

    for (const jq of judgeQuestionsSeed) {
      const qRes = await run(
        'INSERT INTO judge_questions (team_id, question_text, default_answer) VALUES (?, ?, ?)',
        [teamId, jq.q, jq.ans]
      );

      await run(
        'INSERT INTO saved_answers (question_id, team_id, user_id, answer_text) VALUES (?, ?, ?, ?)',
        [qRes.id, teamId, leaderId, jq.ans]
      );
    }

    // 9. Notifications
    const notificationSeed = [
      { title: 'Task Deadline Approaching', message: 'Your Backend API task is due tomorrow.', type: 'deadline_approaching', color: 'red' },
      { title: 'Task Completed', message: 'Arun completed Database Design.', type: 'task_completed', color: 'green' },
      { title: 'New Task Assigned', message: 'Priya assigned you a research task.', type: 'task_assigned', color: 'blue' },
      { title: 'New Comment', message: 'Rishi commented on Presentation Slide Deck.', type: 'comment', color: 'amber' }
    ];

    for (const n of notificationSeed) {
      await run(
        'INSERT INTO notifications (team_id, title, message, type, color) VALUES (?, ?, ?, ?, ?)',
        [teamId, n.title, n.message, n.type, n.color]
      );
    }

    // 10. Ideas & Research
    await run(
      `INSERT INTO ideas (team_id, author_id, title, content, tags, upvotes, category)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        teamId,
        member1Id,
        'Offline First Sync for Hackathon Venues',
        'Hackathon WiFi can be unstable. We should implement LocalStorage sync for task edits.',
        'Architecture, Performance',
        4,
        'idea'
      ]
    );

    // 11. Discussions
    await run(
      `INSERT INTO discussions (team_id, author_id, message, category)
       VALUES (?, ?, ?, ?)`,
      [teamId, leaderId, 'Welcome CyberKnights! Let\'s build an award-winning solution for SIH 2026.', 'announcement']
    );

    // 12. Milestones
    const milestones = [
      { title: 'Phase 1: Problem Analysis & Architecture', desc: 'Finalize solution blueprint.', status: 'completed', due: pastStr },
      { title: 'Phase 2: MVP Development & Backend API', desc: 'Build working prototype.', status: 'in_progress', due: tomorrowStr },
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

// Initialize DB and start server
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
