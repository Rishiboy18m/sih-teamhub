const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET Global Search across Tasks, Members, Files, Ideas, Discussions, Events (Section 22)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const q = req.query.q ? req.query.q.trim() : '';

    if (!q || q.length < 2) {
      return res.json({
        tasks: [],
        members: [],
        files: [],
        ideas: [],
        discussions: [],
        events: []
      });
    }

    const searchTerm = `%${q}%`;
    const teamId = req.user.teamId;

    const [tasks, members, files, ideas, discussions, events] = await Promise.all([
      // Tasks search
      query(
        `SELECT id, title, description, priority, status, category 
         FROM tasks 
         WHERE team_id = ? AND (title LIKE ? OR description LIKE ? OR category LIKE ?)
         LIMIT 6`,
        [teamId, searchTerm, searchTerm, searchTerm]
      ),
      // Members search
      query(
        `SELECT id, full_name, username, role, specialization, avatar 
         FROM users 
         WHERE team_id = ? AND (full_name LIKE ? OR username LIKE ? OR specialization LIKE ?)
         LIMIT 6`,
        [teamId, searchTerm, searchTerm, searchTerm]
      ),
      // Files search
      query(
        `SELECT id, original_name, category, file_size, created_at 
         FROM files 
         WHERE team_id = ? AND (original_name LIKE ? OR category LIKE ?)
         LIMIT 6`,
        [teamId, searchTerm, searchTerm]
      ),
      // Ideas search
      query(
        `SELECT id, title, content, category, tags 
         FROM ideas 
         WHERE team_id = ? AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)
         LIMIT 6`,
        [teamId, searchTerm, searchTerm, searchTerm]
      ),
      // Discussions search
      query(
        `SELECT d.id, d.message, d.category, u.full_name as author_name 
         FROM discussions d 
         JOIN users u ON d.author_id = u.id 
         WHERE d.team_id = ? AND (d.message LIKE ? OR d.category LIKE ?)
         LIMIT 6`,
        [teamId, searchTerm, searchTerm]
      ),
      // Events search
      query(
        `SELECT id, title, description, event_date, event_type 
         FROM calendar_events 
         WHERE team_id = ? AND (title LIKE ? OR description LIKE ? OR event_type LIKE ?)
         LIMIT 6`,
        [teamId, searchTerm, searchTerm, searchTerm]
      )
    ]);

    return res.json({
      tasks,
      members,
      files,
      ideas,
      discussions,
      events
    });
  } catch (err) {
    console.error('Global search error:', err);
    return res.status(500).json({ error: 'Global search failed' });
  }
});

module.exports = router;
