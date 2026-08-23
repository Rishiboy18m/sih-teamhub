const express = require('express');
const router = express.Router();
const { get } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// AI Assistant for SIH Hackathon
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { mode, prompt, projectTitle } = req.body;

    // Fetch team problem statement context from DB
    const project = await get('SELECT * FROM projects WHERE team_id = ?', [req.user.teamId]);
    const problemCode = project?.problem_code || 'SIH-1492';
    const title = project?.title || projectTitle || 'SIH TeamHub';
    const description = project?.description || 'Collaborative workspace for Smart India Hackathon teams.';
    const solution = project?.proposed_solution || 'Unified web platform replacing WhatsApp & spreadsheets.';

    // Feature 1: Problem Analysis
    if (mode === 'problem-analysis') {
      return res.json({
        type: 'problem-analysis',
        content: {
          problemCode,
          title,
          coreProblem: `Lack of isolated, real-time collaboration tools tailored specifically for Smart India Hackathon teams.`,
          targetUsers: ['Hackathon Team Members', 'Team Leaders', 'Hackathon Mentors & Evaluators'],
          challenges: [
            'Ensuring strict multi-tenant data isolation between competing teams',
            'Synchronizing task assignments, files, and pitch deck progress in real time',
            'Preparing polished 3-minute jury presentations under tight deadlines'
          ],
          requiredModules: [
            'Authentication & Role-Based Access Control',
            'Interactive Kanban Task Board with Overdue Detection',
            'Shared File Repository with Category Tags',
            'SIH Milestone & Submission Tracker',
            'Context-Aware SIH AI Assistant'
          ],
          possibleTechnologies: ['React.js', 'Node.js', 'Express.js', 'SQLite', 'Tailwind CSS', 'JWT'],
          expectedOutcomes: 'Higher team productivity, zero data leaks, and pitch-ready prototypes.'
        }
      });
    }

    // Feature 2: Task Suggestions
    if (mode === 'task-suggestions') {
      return res.json({
        type: 'task-suggestions',
        suggestedTasks: [
          {
            title: 'Database Schema & Multi-Tenant Data Isolation',
            category: 'Database',
            priority: 'critical',
            description: 'Implement SQLite tables with team_id foreign key scoping.'
          },
          {
            title: 'Backend API Authentication & JWT Middleware',
            category: 'Backend API',
            priority: 'high',
            description: 'Develop login, registration, and role-based middleware for Leader & Members.'
          },
          {
            title: 'Frontend Kanban Task Board & Overdue Detection',
            category: 'Frontend UI',
            priority: 'high',
            description: 'Build drag & drop task columns, priority badges, and automatic overdue flags.'
          },
          {
            title: 'SIH Pitch Deck Slide Generator & Judge Prep',
            category: 'Pitch Deck',
            priority: 'high',
            description: 'Create slide deck outliner following official SIH 3-minute presentation rubrics.'
          },
          {
            title: 'Unit Testing & Integration Verification',
            category: 'Testing',
            priority: 'medium',
            description: 'Perform end-to-end testing of task creation, file uploads, and chat feed.'
          },
          {
            title: 'System Architecture & User Guide Documentation',
            category: 'Documentation',
            priority: 'low',
            description: 'Write complete setup instructions and README for judges.'
          }
        ]
      });
    }

    // Feature 3: Roadmap Generation
    if (mode === 'roadmap') {
      return res.json({
        type: 'roadmap',
        phases: [
          { phase: 'Phase 1 (Hours 0-6)', title: 'Problem Analysis & DB Schema', detail: 'Finalize team roles, establish SQLite database tables, and scope multi-tenant isolation.' },
          { phase: 'Phase 2 (Hours 6-18)', title: 'Core Backend API & Kanban Board', detail: 'Build REST endpoints for auth, tasks, files, and develop interactive React Kanban views.' },
          { phase: 'Phase 3 (Hours 18-30)', title: 'AI Assistant & SIH Progress Tracker', detail: 'Integrate prompt assistant module, calendar views, and color-coded notification system.' },
          { phase: 'Phase 4 (Hours 30-36)', title: 'Final Pitch Deck & Live Demo Dry Run', detail: 'Record 3-minute screen walkthrough, verify zero bugs, and lock code base for jury submission.' }
        ]
      });
    }

    // Feature 4: Risk Analysis
    if (mode === 'risk-analysis') {
      return res.json({
        type: 'risk-analysis',
        risks: [
          { risk: 'Unstable Hackathon Venue WiFi', severity: 'High', mitigation: 'Implement local caching and lightweight REST payloads.' },
          { risk: 'Data Leakage Between Competing Teams', severity: 'Critical', mitigation: 'Enforce team_id validation in JWT authorization middleware on all API endpoints.' },
          { risk: 'Running Out of Time During 3-Minute Presentation', severity: 'High', mitigation: 'Use the Judge Preparation module timer to rehearse the pitch 3 times prior to submission.' }
        ]
      });
    }

    // Feature 5: Research Suggestions
    if (mode === 'research-suggestions') {
      return res.json({
        type: 'research-suggestions',
        suggestions: [
          { topic: 'SIH 2026 Evaluation Rubric', rationale: 'Understand how jury members award points for working prototype vs presentation slides.' },
          { topic: 'SQLite Performance Indexing', rationale: 'Optimize database queries for concurrent task updates and comment fetches.' },
          { topic: 'JWT Token Security Best Practices', rationale: 'Ensure tokens expire cleanly and prevent unauthorized workspace access.' }
        ]
      });
    }

    // Feature 6: Judge Questions
    if (mode === 'judge-questions') {
      return res.json({
        type: 'judge-questions',
        questions: [
          { q: 'How does SIH TeamHub ensure complete data isolation between competing teams?', a: 'Every API request validates the JWT bearer token against team_id foreign keys, ensuring zero cross-workspace data access.' },
          { q: 'What makes this solution superior to using Trello or WhatsApp?', a: 'SIH TeamHub is tailored specifically for SIH hackathons with built-in AI problem statement analyzers, milestone trackers, and pitch deck outliners.' },
          { q: 'How do you handle task deadlines and overdue items during the hackathon?', a: 'Tasks automatically compute an is_overdue flag when deadlines pass without completion, triggering red notifications for team leaders.' }
        ]
      });
    }

    // General Chat Fallback
    return res.json({
      type: 'chat',
      reply: `SIH AI Recommendation for ${title}:\nFocus on completing your core Kanban tasks and practicing your 3-minute prototype presentation!`
    });
  } catch (err) {
    console.error('AI route error:', err);
    return res.status(500).json({ error: 'AI processing failed' });
  }
});

module.exports = router;
