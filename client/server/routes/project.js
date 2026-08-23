const express = require('express');
const router = express.Router();
const { get, query, run } = require('../db');
const { authenticateToken, requireLeader } = require('../middleware/auth');

// GET project & problem statement details for current team
router.get('/', authenticateToken, async (req, res) => {
  try {
    const project = await get('SELECT * FROM projects WHERE team_id = ?', [req.user.teamId]);
    const team = await get('SELECT * FROM teams WHERE id = ?', [req.user.teamId]);

    return res.json({
      project: project || {
        title: `${team?.name || 'Hackathon'} Solution`,
        problem_code: 'SIH-1492',
        organization_ministry: 'Ministry of Education / AICTE',
        theme: 'Smart Education & Productivity Tools',
        category: 'Software & Productivity',
        description: 'All-in-one collaborative workspace for Smart India Hackathon teams.',
        proposed_solution: 'A unified web platform replacing WhatsApp, spreadsheets, and Trello with multi-tenant data isolation, task Kanban, AI assistant, and pitch deck tools.',
        objectives: '1. Streamline team task assignments.\n2. Ensure zero data leaks across teams.\n3. Assist teams in 3-minute jury presentation preparation.',
        expected_outcome: 'Higher project completion rate and polished prototype presentations.',
        important_links: 'https://github.com/cyberknights/sih-teamhub, https://sih.gov.in',
        additional_notes: 'Targeting SIH 2026 Grand Finale presentation round.',
        repo_url: 'https://github.com/cyberknights/sih-teamhub',
        demo_url: 'https://sih-teamhub.demo.app',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      team: {
        id: team.id,
        name: team.name,
        code: team.code
      }
    });
  } catch (err) {
    console.error('Get project error:', err);
    return res.status(500).json({ error: 'Failed to fetch project info' });
  }
});

// UPDATE project & problem statement details (Team Leader only)
router.put('/', authenticateToken, requireLeader, async (req, res) => {
  try {
    const {
      title,
      problemCode,
      organizationMinistry,
      theme,
      category,
      description,
      proposedSolution,
      objectives,
      expectedOutcome,
      importantLinks,
      additionalNotes,
      repoUrl,
      demoUrl,
      deadline
    } = req.body;

    const existingProject = await get('SELECT id FROM projects WHERE team_id = ?', [req.user.teamId]);

    if (existingProject) {
      await run(
        `UPDATE projects 
         SET title = ?, problem_code = ?, organization_ministry = ?, theme = ?, category = ?, 
             description = ?, proposed_solution = ?, objectives = ?, expected_outcome = ?, 
             important_links = ?, additional_notes = ?, repo_url = ?, demo_url = ?, deadline = ? 
         WHERE team_id = ?`,
        [
          title,
          problemCode,
          organizationMinistry || '',
          theme || '',
          category || '',
          description || '',
          proposedSolution || '',
          objectives || '',
          expectedOutcome || '',
          importantLinks || '',
          additionalNotes || '',
          repoUrl || '',
          demoUrl || '',
          deadline || null,
          req.user.teamId
        ]
      );
    } else {
      await run(
        `INSERT INTO projects (
          team_id, title, problem_code, organization_ministry, theme, category, 
          description, proposed_solution, objectives, expected_outcome, 
          important_links, additional_notes, repo_url, demo_url, deadline
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.teamId,
          title,
          problemCode,
          organizationMinistry || '',
          theme || '',
          category || '',
          description || '',
          proposedSolution || '',
          objectives || '',
          expectedOutcome || '',
          importantLinks || '',
          additionalNotes || '',
          repoUrl || '',
          demoUrl || '',
          deadline || null
        ]
      );
    }

    // Add activity notification
    await run(
      'INSERT INTO notifications (team_id, title, message, type, color) VALUES (?, ?, ?, ?, ?)',
      [req.user.teamId, 'Problem Statement Updated', `${req.user.fullName} updated SIH Problem Statement details.`, 'event', 'blue']
    );

    const updated = await get('SELECT * FROM projects WHERE team_id = ?', [req.user.teamId]);
    return res.json({ message: 'Problem statement updated successfully', project: updated });
  } catch (err) {
    console.error('Update project error:', err);
    return res.status(500).json({ error: 'Failed to update problem statement' });
  }
});

// GET all members of current team (With Specialization, Total, Completed, Active Tasks)
router.get('/members', authenticateToken, async (req, res) => {
  try {
    const members = await query(
      `SELECT u.id, u.email, u.username, u.full_name, u.role, u.specialization, u.avatar, u.created_at,
              COUNT(t.id) as task_count,
              SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
              SUM(CASE WHEN t.status != 'completed' AND t.id IS NOT NULL THEN 1 ELSE 0 END) as active_tasks
       FROM users u
       LEFT JOIN tasks t ON t.assigned_to_id = u.id AND t.team_id = u.team_id
       WHERE u.team_id = ?
       GROUP BY u.id`,
      [req.user.teamId]
    );

    return res.json({ members });
  } catch (err) {
    console.error('Get members error:', err);
    return res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// REMOVE team member (Leader only)
router.delete('/members/:memberId', authenticateToken, requireLeader, async (req, res) => {
  try {
    const memberId = req.params.memberId;

    if (parseInt(memberId) === req.user.userId) {
      return res.status(400).json({ error: 'Team Leader cannot remove themselves.' });
    }

    const targetUser = await get('SELECT * FROM users WHERE id = ? AND team_id = ?', [memberId, req.user.teamId]);

    if (!targetUser) {
      return res.status(404).json({ error: 'Member not found in your team' });
    }

    await run('UPDATE tasks SET assigned_to_id = NULL WHERE assigned_to_id = ? AND team_id = ?', [memberId, req.user.teamId]);
    await run('DELETE FROM users WHERE id = ? AND team_id = ?', [memberId, req.user.teamId]);

    return res.json({ message: `Removed ${targetUser.full_name} from team successfully` });
  } catch (err) {
    console.error('Remove member error:', err);
    return res.status(500).json({ error: 'Failed to remove member' });
  }
});

module.exports = router;
