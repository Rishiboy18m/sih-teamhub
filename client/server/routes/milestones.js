const express = require('express');
const router = express.Router();
const { get, query, run } = require('../db');
const { authenticateToken, requireLeader } = require('../middleware/auth');

// GET all milestones for team
router.get('/', authenticateToken, async (req, res) => {
  try {
    const milestones = await query(
      'SELECT * FROM milestones WHERE team_id = ? ORDER BY id ASC',
      [req.user.teamId]
    );

    const calendarEvents = await query(
      'SELECT * FROM calendar_events WHERE team_id = ? ORDER BY event_date ASC',
      [req.user.teamId]
    );

    return res.json({ milestones, calendarEvents });
  } catch (err) {
    console.error('Get milestones error:', err);
    return res.status(500).json({ error: 'Failed to fetch milestones' });
  }
});

// CREATE milestone (Leader only)
router.post('/', authenticateToken, requireLeader, async (req, res) => {
  try {
    const { title, description, dueDate, status, completionPercentage } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Milestone title is required' });
    }

    const percentage = completionPercentage !== undefined ? parseInt(completionPercentage) : 0;

    const result = await run(
      'INSERT INTO milestones (team_id, title, description, due_date, status, completion_percentage) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.teamId, title, description || '', dueDate || null, status || 'pending', percentage]
    );

    const newMilestone = await get('SELECT * FROM milestones WHERE id = ?', [result.id]);
    return res.status(201).json({ message: 'Milestone created', milestone: newMilestone });
  } catch (err) {
    console.error('Create milestone error:', err);
    return res.status(500).json({ error: 'Failed to create milestone' });
  }
});

// UPDATE milestone status/info/percentage (Leader only or team members updating completion)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const milestoneId = req.params.id;
    const { title, description, dueDate, status, completionPercentage } = req.body;

    const existing = await get('SELECT * FROM milestones WHERE id = ? AND team_id = ?', [milestoneId, req.user.teamId]);
    if (!existing) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const newTitle = title !== undefined ? title : existing.title;
    const newDesc = description !== undefined ? description : existing.description;
    const newDueDate = dueDate !== undefined ? dueDate : existing.due_date;
    const newStatus = status !== undefined ? status : existing.status;
    const newPercentage = completionPercentage !== undefined ? parseInt(completionPercentage) : existing.completion_percentage;

    await run(
      `UPDATE milestones 
       SET title = ?, description = ?, due_date = ?, status = ?, completion_percentage = ? 
       WHERE id = ? AND team_id = ?`,
      [newTitle, newDesc, newDueDate, newStatus, newPercentage, milestoneId, req.user.teamId]
    );

    const updated = await get('SELECT * FROM milestones WHERE id = ?', [milestoneId]);
    return res.json({ message: 'Milestone updated', milestone: updated });
  } catch (err) {
    console.error('Update milestone error:', err);
    return res.status(500).json({ error: 'Failed to update milestone' });
  }
});

// DELETE milestone (Leader only)
router.delete('/:id', authenticateToken, requireLeader, async (req, res) => {
  try {
    const milestoneId = req.params.id;
    await run('DELETE FROM milestones WHERE id = ? AND team_id = ?', [milestoneId, req.user.teamId]);
    return res.json({ message: 'Milestone deleted' });
  } catch (err) {
    console.error('Delete milestone error:', err);
    return res.status(500).json({ error: 'Failed to delete milestone' });
  }
});

// POST calendar event
router.post('/calendar', authenticateToken, async (req, res) => {
  try {
    const { title, description, eventDate, eventType } = req.body;

    if (!title || !eventDate) {
      return res.status(400).json({ error: 'Event title and date are required' });
    }

    const result = await run(
      'INSERT INTO calendar_events (team_id, title, description, event_date, event_type) VALUES (?, ?, ?, ?, ?)',
      [req.user.teamId, title, description || '', eventDate, eventType || 'general']
    );

    const event = await get('SELECT * FROM calendar_events WHERE id = ?', [result.id]);
    return res.status(201).json({ message: 'Event added to calendar', event });
  } catch (err) {
    console.error('Create calendar event error:', err);
    return res.status(500).json({ error: 'Failed to create event' });
  }
});

module.exports = router;
