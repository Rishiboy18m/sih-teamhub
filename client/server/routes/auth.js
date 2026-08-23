const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run } = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// Helper to generate JWT token
function generateToken(user, team) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      specialization: user.specialization,
      teamId: team.id,
      teamName: team.name,
      teamCode: team.code
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// REGISTER NEW TEAM (Leader)
router.post('/register-team', async (req, res) => {
  try {
    const { teamName, email, username, password, fullName, specialization } = req.body;

    if (!teamName || !email || !username || !password || !fullName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Generate unique 6-character team code (e.g. SIH-8X92)
    const codeSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const teamCode = `SIH-${codeSuffix}`;

    const teamResult = await run('INSERT INTO teams (name, code) VALUES (?, ?)', [teamName.trim(), teamCode]);
    const teamId = teamResult.id;

    const passwordHash = await bcrypt.hash(password, 10);
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

    const userResult = await run(
      `INSERT INTO users (email, username, password_hash, full_name, role, specialization, team_id, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [email.toLowerCase().trim(), username.trim(), passwordHash, fullName.trim(), 'leader', specialization || 'Team Leader', teamId, avatar]
    );

    // Initial Welcome Notification
    await run(
      'INSERT INTO notifications (team_id, title, message, type, color) VALUES (?, ?, ?, ?, ?)',
      [teamId, 'Welcome to SIH TeamHub', `Team ${teamName} created successfully! Team code: ${teamCode}`, 'event', 'blue']
    );

    const user = await get('SELECT id, email, username, full_name, role, specialization, team_id, avatar, created_at FROM users WHERE id = ?', [userResult.id]);
    const team = await get('SELECT id, name, code, created_at FROM teams WHERE id = ?', [teamId]);

    const token = generateToken(user, team);

    return res.status(201).json({
      message: 'Team workspace registered successfully',
      token,
      user,
      team
    });
  } catch (err) {
    console.error('Register team error:', err);
    return res.status(500).json({ error: 'Failed to register team' });
  }
});

// JOIN EXISTING TEAM (Member)
router.post('/join-team', async (req, res) => {
  try {
    const { teamCode, email, username, password, fullName, specialization } = req.body;

    if (!teamCode || !email || !username || !password || !fullName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const team = await get('SELECT * FROM teams WHERE UPPER(code) = UPPER(?)', [teamCode.trim()]);
    if (!team) {
      return res.status(404).json({ error: 'Invalid Team Code. Please verify with your Team Leader.' });
    }

    const existingUser = await get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;

    const userResult = await run(
      `INSERT INTO users (email, username, password_hash, full_name, role, specialization, team_id, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [email.toLowerCase().trim(), username.trim(), passwordHash, fullName.trim(), 'member', specialization || 'Developer', team.id, avatar]
    );

    // Notify Team
    await run(
      'INSERT INTO notifications (team_id, title, message, type, color) VALUES (?, ?, ?, ?, ?)',
      [team.id, 'New Member Joined', `${fullName} joined the team as ${specialization || 'Member'}.`, 'member_joined', 'orange']
    );

    const user = await get('SELECT id, email, username, full_name, role, specialization, team_id, avatar, created_at FROM users WHERE id = ?', [userResult.id]);
    const token = generateToken(user, team);

    return res.status(201).json({
      message: 'Joined team workspace successfully',
      token,
      user,
      team: { id: team.id, name: team.name, code: team.code }
    });
  } catch (err) {
    console.error('Join team error:', err);
    return res.status(500).json({ error: 'Failed to join team' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { loginId, password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({ error: 'Email/Username and password are required' });
    }

    const user = await get(
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)',
      [loginId.trim(), loginId.trim()]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const team = await get('SELECT id, name, code, created_at FROM teams WHERE id = ?', [user.team_id]);
    if (!team) {
      return res.status(404).json({ error: 'Associated team not found' });
    }

    // Strip password hash from returned user object (Section 26 requirement)
    delete user.password_hash;

    const token = generateToken(user, team);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        specialization: user.specialization,
        avatar: user.avatar
      },
      team
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login processing failed' });
  }
});

// GET CURRENT USER PROFILE (/me)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await get(
      'SELECT id, email, username, full_name as fullName, role, specialization, team_id as teamId, avatar, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    const team = await get(
      'SELECT id, name, code, created_at FROM teams WHERE id = ?',
      [req.user.teamId]
    );

    if (!user || !team) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    return res.json({ user, team });
  } catch (err) {
    console.error('Get me error:', err);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

module.exports = router;
