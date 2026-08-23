const express = require('express');
const router = express.Router();
const { get, query, run } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET Judge Preparation 11 sections and mock judge questions + saved answers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pitchSections = await query(
      'SELECT * FROM judge_pitch_sections WHERE team_id = ? ORDER BY id ASC',
      [req.user.teamId]
    );

    const questions = await query(
      `SELECT jq.*, sa.answer_text as saved_answer, sa.updated_at as answer_updated_at, u.full_name as answered_by
       FROM judge_questions jq
       LEFT JOIN saved_answers sa ON sa.question_id = jq.id AND sa.team_id = jq.team_id
       LEFT JOIN users u ON sa.user_id = u.id
       WHERE jq.team_id = ?
       ORDER BY jq.id ASC`,
      [req.user.teamId]
    );

    return res.json({ pitchSections, questions });
  } catch (err) {
    console.error('Get judge prep error:', err);
    return res.status(500).json({ error: 'Failed to fetch judge preparation data' });
  }
});

// UPDATE pitch section content
router.put('/sections', authenticateToken, async (req, res) => {
  try {
    const { sectionName, contentText } = req.body;
    if (!sectionName) return res.status(400).json({ error: 'Section name required' });

    const existing = await get(
      'SELECT id FROM judge_pitch_sections WHERE team_id = ? AND LOWER(section_name) = LOWER(?)',
      [req.user.teamId, sectionName.trim()]
    );

    if (existing) {
      await run(
        'UPDATE judge_pitch_sections SET content_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [contentText || '', existing.id]
      );
    } else {
      await run(
        'INSERT INTO judge_pitch_sections (team_id, section_name, content_text) VALUES (?, ?, ?)',
        [req.user.teamId, sectionName.trim(), contentText || '']
      );
    }

    return res.json({ message: `Updated ${sectionName} successfully` });
  } catch (err) {
    console.error('Update pitch section error:', err);
    return res.status(500).json({ error: 'Failed to update section' });
  }
});

// SAVE custom answer to mock judge question (Section 21)
router.put('/answers/:questionId', authenticateToken, async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const { answerText } = req.body;

    if (!answerText || !answerText.trim()) {
      return res.status(400).json({ error: 'Answer text cannot be empty' });
    }

    const question = await get('SELECT id FROM judge_questions WHERE id = ? AND team_id = ?', [questionId, req.user.teamId]);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const existingAnswer = await get('SELECT id FROM saved_answers WHERE question_id = ? AND team_id = ?', [questionId, req.user.teamId]);

    if (existingAnswer) {
      await run(
        'UPDATE saved_answers SET answer_text = ?, user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [answerText.trim(), req.user.userId, existingAnswer.id]
      );
    } else {
      await run(
        'INSERT INTO saved_answers (question_id, team_id, user_id, answer_text) VALUES (?, ?, ?, ?)',
        [questionId, req.user.teamId, req.user.userId, answerText.trim()]
      );
    }

    // Add activity log
    await run(
      'INSERT INTO notifications (team_id, title, message, type, color) VALUES (?, ?, ?, ?, ?)',
      [req.user.teamId, 'Judge Answer Saved', `${req.user.fullName} updated answer for judge question.`, 'event', 'green']
    );

    return res.json({ message: 'Judge question answer saved successfully' });
  } catch (err) {
    console.error('Save judge answer error:', err);
    return res.status(500).json({ error: 'Failed to save answer' });
  }
});

module.exports = router;
