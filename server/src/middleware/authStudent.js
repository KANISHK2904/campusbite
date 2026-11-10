const jwt = require('jsonwebtoken');

/**
 * Middleware: verify student JWT (issued after Google OAuth).
 * Attaches req.user = { id, google_id, name, email, avatar_url }
 */
function authStudent(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing student token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: student token required' });
    }
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authStudent;
