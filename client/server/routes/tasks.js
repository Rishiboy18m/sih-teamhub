const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { get, query, run } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Multer storage for Task Attachments
const taskUploadDir = path.join(__dirname, '../uploads/task_attachments');
if (!fs.existsSync(taskUploadDir)) {
  fs.mkdirSync(taskUploadDir, { recursive: true });
}

const taskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, taskUploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const taskUpload = multer({ storage: taskStorage, limits: { fileSize: 25 * 1024 * 1024 } });

// GET all tasks with automatic overdue calculation and filtering/sorting
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { filter, search, sort } = req.query;
    const todayStr = new Date().toISOString().split('T')[0];

    let sql = `
      SELECT t.*, 
             u_assign.full_name as assigned_to_name, u_assign.avatar as assigned_to_avatar,
             u_create.full_name as created_by_name,
             (SELECT COUNT(*) FROM task_comments WHERE task_id = t.id) as comment_count,
             (SELECT COUNT(*) FROM task_attachments WHERE task_id = t.id) as attachment_count,
             CASE WHEN t.due_date IS NOT NULL AND t.due_date < '${todayStr}' AND t.status != 'completed' THEN 1 ELSE 0 END as is_overdue
      FROM tasks t
      LEFT JOIN users u_assign ON t.assigned_to_id = u_assign.id
      LEFT JOIN users u_create ON t.created_by_id = u_create.id
      WHERE t.team_id = ?
    `;

    const params = [req.user.teamId];

    // Filter rules
    if (filter === 'my_tasks') {
      sql += ' AND t.assigned_to_id = ?';
      params.push(req.user.userId);
    } else if (filter === 'assigned_by_me') {
      sql += ' AND t.created_by_id = ?';
      params.push(req.user.userId);
    } else if (filter === 'completed') {
      sql += " AND t.status = 'completed'";
    } else if (filter === 'pending') {
      sql += " AND t.status = 'pending'";
    } else if (filter === 'in_progress') {
      sql += " AND t.status = 'in_progress'";
    } else if (filter === 'review') {
      sql += " AND t.status = 'review'";
    } else if (filter === 'overdue') {
      sql += ` AND t.due_date IS NOT NULL AND t.due_date < '${todayStr}' AND t.status != 'completed'`;
    }

    if (search && search.trim()) {
      sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    // Sort rules
    if (sort === 'deadline') {
      sql += ' ORDER BY t.due_date ASC NULLS LAST';
    } else if (sort === 'priority') {
      sql += ` ORDER BY CASE t.priority 
                WHEN 'critical' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
                ELSE 5 END ASC`;
    } else if (sort === 'member') {
      sql += ' ORDER BY u_assign.full_name ASC NULLS LAST';
    } else {
      sql += ' ORDER BY t.created_at DESC';
    }

    const tasks = await query(sql, params);
    return res.json({ tasks });
  } catch (err) {
    console.error('Get tasks error:', err);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// CREATE task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, priority, category, assignedToId, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const taskPriority = ['critical', 'high', 'medium', 'low'].includes(priority) ? priority : 'medium';
    const taskCategory = category || 'General';
    const assignedId = assignedToId ? parseInt(assignedToId) : null;

    const result = await run(
      `INSERT INTO tasks (team_id, title, description, priority, status, category, assigned_to_id, created_by_id, due_date)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [
        req.user.teamId,
        title.trim(),
        description || '',
        taskPriority,
        taskCategory,
        assignedId,
        req.user.userId,
        dueDate || null
      ]
    );

    const taskId = result.id;

    // Log Activity
    await run(
      'INSERT INTO task_activities (task_id, user_id, action_text) VALUES (?, ?, ?)',
      [taskId, req.user.userId, `Created task "${title.trim()}"`]
    );

    // Notify Team
    await run(
      'INSERT INTO notifications (team_id, title, message) VALUES (?, ?, ?)',
      [req.user.teamId, 'New Task Created', `${req.user.fullName} created task: "${title.trim()}"`]
    );

    const todayStr = new Date().toISOString().split('T')[0];
    const newTask = await get(
      `SELECT t.*, 
              u_assign.full_name as assigned_to_name, u_assign.avatar as assigned_to_avatar,
              u_create.full_name as created_by_name,
              0 as comment_count, 0 as attachment_count,
              CASE WHEN t.due_date IS NOT NULL AND t.due_date < '${todayStr}' AND t.status != 'completed' THEN 1 ELSE 0 END as is_overdue
       FROM tasks t
       LEFT JOIN users u_assign ON t.assigned_to_id = u_assign.id
       LEFT JOIN users u_create ON t.created_by_id = u_create.id
       WHERE t.id = ?`,
      [taskId]
    );

    return res.status(201).json({ message: 'Task created successfully', task: newTask });
  } catch (err) {
    console.error('Create task error:', err);
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

// UPDATE task status / priority / assignment / details
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, priority, status, category, assignedToId, dueDate } = req.body;

    const task = await get('SELECT * FROM tasks WHERE id = ? AND team_id = ?', [taskId, req.user.teamId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const newTitle = title !== undefined ? title : task.title;
    const newDesc = description !== undefined ? description : task.description;
    const newPriority = priority !== undefined ? priority : task.priority;
    const newStatus = status !== undefined ? status : task.status;
    const newCategory = category !== undefined ? category : task.category;
    const newAssignedId = assignedToId !== undefined ? (assignedToId ? parseInt(assignedToId) : null) : task.assigned_to_id;
    const newDueDate = dueDate !== undefined ? dueDate : task.due_date;

    // Log Activity Audit
    if (status !== undefined && status !== task.status) {
      await run(
        'INSERT INTO task_activities (task_id, user_id, action_text) VALUES (?, ?, ?)',
        [taskId, req.user.userId, `Changed status from "${task.status}" to "${status}"`]
      );
    }
    if (assignedToId !== undefined && assignedToId !== task.assigned_to_id) {
      const assignedUser = newAssignedId ? await get('SELECT full_name FROM users WHERE id = ?', [newAssignedId]) : null;
      await run(
        'INSERT INTO task_activities (task_id, user_id, action_text) VALUES (?, ?, ?)',
        [taskId, req.user.userId, `Reassigned task to ${assignedUser ? assignedUser.full_name : 'Unassigned'}`]
      );
    }

    await run(
      `UPDATE tasks 
       SET title = ?, description = ?, priority = ?, status = ?, category = ?, assigned_to_id = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND team_id = ?`,
      [newTitle, newDesc, newPriority, newStatus, newCategory, newAssignedId, newDueDate, taskId, req.user.teamId]
    );

    const todayStr = new Date().toISOString().split('T')[0];
    const updatedTask = await get(
      `SELECT t.*, 
              u_assign.full_name as assigned_to_name, u_assign.avatar as assigned_to_avatar,
              u_create.full_name as created_by_name,
              (SELECT COUNT(*) FROM task_comments WHERE task_id = t.id) as comment_count,
              (SELECT COUNT(*) FROM task_attachments WHERE task_id = t.id) as attachment_count,
              CASE WHEN t.due_date IS NOT NULL AND t.due_date < '${todayStr}' AND t.status != 'completed' THEN 1 ELSE 0 END as is_overdue
       FROM tasks t
       LEFT JOIN users u_assign ON t.assigned_to_id = u_assign.id
       LEFT JOIN users u_create ON t.created_by_id = u_create.id
       WHERE t.id = ?`,
      [taskId]
    );

    return res.json({ message: 'Task updated successfully', task: updatedTask });
  } catch (err) {
    console.error('Update task error:', err);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE task (Leader or Creator)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await get('SELECT * FROM tasks WHERE id = ? AND team_id = ?', [taskId, req.user.teamId]);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (req.user.role !== 'leader' && task.created_by_id !== req.user.userId) {
      return res.status(403).json({ error: 'Permission denied.' });
    }

    await run('DELETE FROM tasks WHERE id = ? AND team_id = ?', [taskId, req.user.teamId]);
    return res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

// GET task comments
router.get('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const comments = await query(
      `SELECT tc.*, u.full_name as user_name, u.avatar as user_avatar, u.role as user_role
       FROM task_comments tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = ?
       ORDER BY tc.created_at ASC`,
      [taskId]
    );
    return res.json({ comments });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST task comment
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { comment } = req.body;
    if (!comment || !comment.trim()) return res.status(400).json({ error: 'Comment required' });

    const result = await run(
      'INSERT INTO task_comments (task_id, user_id, comment) VALUES (?, ?, ?)',
      [taskId, req.user.userId, comment.trim()]
    );

    // Log Activity
    await run(
      'INSERT INTO task_activities (task_id, user_id, action_text) VALUES (?, ?, ?)',
      [taskId, req.user.userId, `Added comment: "${comment.trim()}"`]
    );

    const newComment = await get(
      `SELECT tc.*, u.full_name as user_name, u.avatar as user_avatar, u.role as user_role
       FROM task_comments tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.id = ?`,
      [result.id]
    );
    return res.status(201).json({ comment: newComment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to post comment' });
  }
});

// GET task activity log
router.get('/:id/activities', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const activities = await query(
      `SELECT ta.*, u.full_name as user_name, u.avatar as user_avatar
       FROM task_activities ta
       JOIN users u ON ta.user_id = u.id
       WHERE ta.task_id = ?
       ORDER BY ta.created_at DESC`,
      [taskId]
    );
    return res.json({ activities });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch task activities' });
  }
});

// GET task attachments
router.get('/:id/attachments', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.id;
    const attachments = await query(
      `SELECT ta.*, u.full_name as uploader_name
       FROM task_attachments ta
       JOIN users u ON ta.user_id = u.id
       WHERE ta.task_id = ?
       ORDER BY ta.created_at DESC`,
      [taskId]
    );
    return res.json({ attachments });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch task attachments' });
  }
});

// UPLOAD task attachment
router.post('/:id/attachments', authenticateToken, taskUpload.single('file'), async (req, res) => {
  try {
    const taskId = req.params.id;
    if (!req.file) return res.status(400).json({ error: 'File required' });

    const result = await run(
      `INSERT INTO task_attachments (task_id, user_id, original_name, stored_name, file_size)
       VALUES (?, ?, ?, ?, ?)`,
      [taskId, req.user.userId, req.file.originalname, req.file.filename, req.file.size]
    );

    // Log Activity
    await run(
      'INSERT INTO task_activities (task_id, user_id, action_text) VALUES (?, ?, ?)',
      [taskId, req.user.userId, `Uploaded attachment "${req.file.originalname}"`]
    );

    const attachment = await get(
      `SELECT ta.*, u.full_name as uploader_name
       FROM task_attachments ta
       JOIN users u ON ta.user_id = u.id
       WHERE ta.id = ?`,
      [result.id]
    );

    return res.status(201).json({ attachment });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

module.exports = router;
