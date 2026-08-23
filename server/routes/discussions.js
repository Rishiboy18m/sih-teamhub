const express = require('express');
const router = express.Router();
const { get, query, run } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET team discussions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;
    let sql = `
      SELECT d.*, u.full_name as author_name, u.avatar as author_avatar, u.role as author_role,
             (SELECT COUNT(*) FROM discussion_replies WHERE discussion_id = d.id) as reply_count
      FROM discussions d
      JOIN users u ON d.author_id = u.id
      WHERE d.team_id = ?
    `;
    const params = [req.user.teamId];

    if (category && category !== 'all') {
      sql += ' AND LOWER(d.category) = LOWER(?)';
      params.push(category);
    }

    sql += ' ORDER BY d.created_at DESC';

    const discussions = await query(sql, params);
    return res.json({ discussions });
  } catch (err) {
    console.error('Get discussions error:', err);
    return res.status(500).json({ error: 'Failed to fetch discussions' });
  }
});

// POST message in discussion
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { message, category } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    const msgCat = ['General', 'Technical', 'Research', 'Design', 'Presentation'].includes(category) ? category : 'General';

    const result = await run(
      'INSERT INTO discussions (team_id, author_id, message, category) VALUES (?, ?, ?, ?)',
      [req.user.teamId, req.user.userId, message.trim(), msgCat]
    );

    // Notify Team
    await run(
      'INSERT INTO notifications (team_id, title, message, type, color) VALUES (?, ?, ?, ?, ?)',
      [req.user.teamId, `New Discussion in ${msgCat}`, `${req.user.fullName} posted: "${message.trim().substring(0, 50)}..."`, 'comment', 'amber']
    );

    const newMessage = await get(
      `SELECT d.*, u.full_name as author_name, u.avatar as author_avatar, u.role as author_role, 0 as reply_count
       FROM discussions d
       JOIN users u ON d.author_id = u.id
       WHERE d.id = ?`,
      [result.id]
    );

    return res.status(201).json({ message: newMessage });
  } catch (err) {
    console.error('Post discussion error:', err);
    return res.status(500).json({ error: 'Failed to post message' });
  }
});

// GET discussion replies
router.get('/:id/replies', authenticateToken, async (req, res) => {
  try {
    const discussionId = req.params.id;
    const replies = await query(
      `SELECT dr.*, u.full_name as user_name, u.avatar as user_avatar
       FROM discussion_replies dr
       JOIN users u ON dr.user_id = u.id
       WHERE dr.discussion_id = ?
       ORDER BY dr.created_at ASC`,
      [discussionId]
    );
    return res.json({ replies });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch replies' });
  }
});

// POST discussion reply
router.post('/:id/replies', authenticateToken, async (req, res) => {
  try {
    const discussionId = req.params.id;
    const { reply } = req.body;
    if (!reply || !reply.trim()) return res.status(400).json({ error: 'Reply text required' });

    const result = await run(
      'INSERT INTO discussion_replies (discussion_id, user_id, reply) VALUES (?, ?, ?)',
      [discussionId, req.user.userId, reply.trim()]
    );

    const newReply = await get(
      `SELECT dr.*, u.full_name as user_name, u.avatar as user_avatar
       FROM discussion_replies dr
       JOIN users u ON dr.user_id = u.id
       WHERE dr.id = ?`,
      [result.id]
    );

    return res.status(201).json({ reply: newReply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to post reply' });
  }
});

module.exports = router;
