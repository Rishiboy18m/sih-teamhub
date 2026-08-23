const express = require('express');
const router = express.Router();
const { get, query, run } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET all ideas/research/questions for team
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;
    let sql = `
      SELECT i.*, u.full_name as author_name, u.avatar as author_avatar,
             (SELECT COUNT(*) FROM idea_comments WHERE idea_id = i.id) as comment_count
      FROM ideas i
      JOIN users u ON i.author_id = u.id
      WHERE i.team_id = ?
    `;
    const params = [req.user.teamId];

    if (category && category !== 'all') {
      sql += ' AND i.category = ?';
      params.push(category);
    }

    sql += ' ORDER BY i.upvotes DESC, i.created_at DESC';

    const ideas = await query(sql, params);
    return res.json({ ideas });
  } catch (err) {
    console.error('Get ideas error:', err);
    return res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// CREATE idea, research resource, or question
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, url, tags, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const cat = ['idea', 'research', 'question'].includes(category) ? category : 'idea';

    const result = await run(
      `INSERT INTO ideas (team_id, author_id, title, content, url, tags, category, upvotes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [req.user.teamId, req.user.userId, title.trim(), content.trim(), url || '', tags || '', cat]
    );

    // Notify Team
    await run(
      'INSERT INTO notifications (team_id, title, message, type, color) VALUES (?, ?, ?, ?, ?)',
      [req.user.teamId, `New ${cat.toUpperCase()} Posted`, `${req.user.fullName} added ${cat}: "${title.trim()}"`, 'event', 'amber']
    );

    const newIdea = await get(
      `SELECT i.*, u.full_name as author_name, u.avatar as author_avatar, 0 as comment_count
       FROM ideas i
       JOIN users u ON i.author_id = u.id
       WHERE i.id = ?`,
      [result.id]
    );

    return res.status(201).json({ message: 'Item added successfully', idea: newIdea });
  } catch (err) {
    console.error('Create idea error:', err);
    return res.status(500).json({ error: 'Failed to post item' });
  }
});

// UPVOTE idea/question
router.post('/:id/upvote', authenticateToken, async (req, res) => {
  try {
    const ideaId = req.params.id;
    const idea = await get('SELECT * FROM ideas WHERE id = ? AND team_id = ?', [ideaId, req.user.teamId]);

    if (!idea) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await run('UPDATE ideas SET upvotes = upvotes + 1 WHERE id = ? AND team_id = ?', [ideaId, req.user.teamId]);
    const updated = await get('SELECT upvotes FROM ideas WHERE id = ?', [ideaId]);

    return res.json({ upvotes: updated.upvotes });
  } catch (err) {
    console.error('Upvote idea error:', err);
    return res.status(500).json({ error: 'Failed to upvote' });
  }
});

// GET comments on idea
router.get('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const ideaId = req.params.id;
    const comments = await query(
      `SELECT ic.*, u.full_name as user_name, u.avatar as user_avatar
       FROM idea_comments ic
       JOIN users u ON ic.user_id = u.id
       WHERE ic.idea_id = ?
       ORDER BY ic.created_at ASC`,
      [ideaId]
    );
    return res.json({ comments });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST comment on idea
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const ideaId = req.params.id;
    const { comment } = req.body;
    if (!comment || !comment.trim()) return res.status(400).json({ error: 'Comment text required' });

    const result = await run(
      'INSERT INTO idea_comments (idea_id, user_id, comment) VALUES (?, ?, ?)',
      [ideaId, req.user.userId, comment.trim()]
    );

    const newComment = await get(
      `SELECT ic.*, u.full_name as user_name, u.avatar as user_avatar
       FROM idea_comments ic
       JOIN users u ON ic.user_id = u.id
       WHERE ic.id = ?`,
      [result.id]
    );

    return res.status(201).json({ comment: newComment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to post comment' });
  }
});

// DELETE idea (Leader or Author)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const ideaId = req.params.id;
    const idea = await get('SELECT * FROM ideas WHERE id = ? AND team_id = ?', [ideaId, req.user.teamId]);

    if (!idea) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (req.user.role !== 'leader' && idea.author_id !== req.user.userId) {
      return res.status(403).json({ error: 'Permission denied.' });
    }

    await run('DELETE FROM ideas WHERE id = ? AND team_id = ?', [ideaId, req.user.teamId]);
    return res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error('Delete idea error:', err);
    return res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
