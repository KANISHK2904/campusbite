const express  = require('express');
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db        = require('../config/db');

const router  = express.Router();
const gClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─────────────────────────────────────────────────────────────
// Helper: sign a JWT
// ─────────────────────────────────────────────────────────────
function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// ─────────────────────────────────────────────────────────────
// STUDENT — Google Sign-In (token from client-side Google SDK)
// POST /api/auth/google/token
// Body: { credential }   (Google ID token from One Tap / GIS)
// ─────────────────────────────────────────────────────────────
router.post('/google/token', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Missing Google credential' });

  // 1. Verify ID token with Google
  const ticket = await gClient.verifyIdToken({
    idToken:  credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { sub: google_id, name, email, picture: avatar_url } = payload;

  // 2. Enforce college domain
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || '';
  if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
    return res.status(403).json({
      error: `Only @${allowedDomain} accounts are allowed`,
    });
  }

  // 3. Upsert user
  const [rows] = await db.execute(
    `INSERT INTO users (google_id, name, email, avatar_url)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), avatar_url = VALUES(avatar_url)`,
    [google_id, name, email, avatar_url]
  );

  // Fetch the user record (insert or existing)
  const [[user]] = await db.execute(
    'SELECT id, google_id, name, email, avatar_url FROM users WHERE google_id = ?',
    [google_id]
  );

  // 4. Issue JWT
  const token = signToken({
    role:       'student',
    id:         user.id,
    google_id:  user.google_id,
    name:       user.name,
    email:      user.email,
    avatar_url: user.avatar_url,
  });

  res.json({ token, user });
});

// ─────────────────────────────────────────────────────────────
// STUDENT — Get current profile
// GET /api/auth/me   (requires student JWT)
// ─────────────────────────────────────────────────────────────
router.get('/me', require('../middleware/authStudent'), async (req, res) => {
  const [[user]] = await db.execute(
    'SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// ─────────────────────────────────────────────────────────────
// ADMIN — Signup
// POST /api/auth/admin/signup
// Body: { username, password, shop_name }
// ─────────────────────────────────────────────────────────────
router.post('/admin/signup', async (req, res) => {
  const { username, password, shop_name } = req.body;

  if (!username || !password || !shop_name) {
    return res.status(400).json({ error: 'username, password, and shop_name are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // Check uniqueness
  const [[existing]] = await db.execute(
    'SELECT id FROM admins WHERE username = ?',
    [username]
  );
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const password_hash = await bcrypt.hash(password, 12);
  const [result] = await db.execute(
    'INSERT INTO admins (username, password_hash, shop_name) VALUES (?, ?, ?)',
    [username, password_hash, shop_name]
  );

  const adminId = result.insertId;

  // Auto-create a place for this admin using their shop_name
  const [placeResult] = await db.execute(
    'INSERT INTO places (admin_id, name) VALUES (?, ?)',
    [adminId, shop_name]
  );
  const placeId = placeResult.insertId;

  const token = signToken({
    role:      'admin',
    id:        adminId,
    username,
    shop_name,
    place_id:  placeId,
  });

  res.status(201).json({
    token,
    admin: { id: adminId, username, shop_name, place_id: placeId },
  });
});

// ─────────────────────────────────────────────────────────────
// ADMIN — Login
// POST /api/auth/admin/login
// Body: { username, password }
// ─────────────────────────────────────────────────────────────
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const [[admin]] = await db.execute(
    'SELECT id, username, password_hash, shop_name FROM admins WHERE username = ?',
    [username]
  );
  if (!admin) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Fetch the admin's place_id
  const [[place]] = await db.execute(
    'SELECT id FROM places WHERE admin_id = ? LIMIT 1',
    [admin.id]
  );
  const place_id = place ? place.id : null;

  const token = signToken({
    role:      'admin',
    id:        admin.id,
    username:  admin.username,
    shop_name: admin.shop_name,
    place_id,
  });

  res.json({
    token,
    admin: { id: admin.id, username: admin.username, shop_name: admin.shop_name, place_id },
  });
});

module.exports = router;
