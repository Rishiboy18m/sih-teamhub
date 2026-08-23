const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sih_teamhub_super_secret_jwt_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Authentication token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session token. Please sign in again.' });
    }
    req.user = user;
    next();
  });
}

function requireLeader(req, res, next) {
  if (!req.user || req.user.role !== 'leader') {
    return res.status(403).json({ error: 'Permission denied. Action requires Team Leader role.' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireLeader,
  JWT_SECRET
};
