const express = require('express');
const router = express.Router();
const { query, run } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET notifications for team
router.get('/', authenticateToken, async (req, res) => {
  try {
    const notifications = await query(
      'SELECT * FROM notifications WHERE team_id = ? ORDER BY created_at DESC LIMIT 15',
      [req.user.teamId]
    );
    const unreadCount = notifications.filter(n => n.is_read === 0).length;
    return res.json({ notifications, unreadCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// MARK notification as read
router.post('/mark-read', authenticateToken, async (req, res) => {
  try {
    await run('UPDATE notifications SET is_read = 1 WHERE team_id = ?', [req.user.teamId]);
    return res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
});

module.exports = router;
