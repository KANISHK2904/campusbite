const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');
const authStudent = require('../middleware/authStudent');

const router = express.Router();

// Created lazily so dotenv has already loaded by the time it runs.
const oauthClient = () =>
  new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );

const clientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';
const allowedDomain = () => (process.env.ALLOWED_EMAIL_DOMAIN || '').trim().toLowerCase();

// GET /api/auth/google  -> send the student to Google
router.get('/google', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000,
  });
  const url = oauthClient().generateAuthUrl({
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
    hd: allowedDomain() || undefined, // UI hint only; real check is in the callback
  });
  res.redirect(url);
});

// GET /api/auth/google/callback  -> verify, domain-check, issue JWT
router.get('/google/callback', async (req, res) => {
  const fail = (code) => res.redirect(`${clientUrl()}/login?error=${code}`);
  try {
    const { code, state, error } = req.query;
    if (error) return fail('cancelled');
    if (!code || !state || state !== req.cookies?.oauth_state) return fail('state');
    res.clearCookie('oauth_state');

    const client = oauthClient();
    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const p = ticket.getPayload();
    const email = (p.email || '').toLowerCase();

    // College-only access. Fails closed if ALLOWED_EMAIL_DOMAIN is not set.
    const domain = allowedDomain();
    if (!p.email_verified) return fail('unverified');
    if (!domain || !email.endsWith(`@${domain}`)) return fail('domain');

    await db.query(
      `INSERT INTO users (google_id, name, email, avatar_url)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), avatar_url = VALUES(avatar_url)`,
      [p.sub, p.name || email, email, p.picture || null]
    );
    const [rows] = await db.query('SELECT id FROM users WHERE google_id = ?', [p.sub]);

    const token = jwt.sign(
      { id: rows[0].id, email, role: 'student' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d', algorithm: 'HS256' }
    );
    // Token goes in the URL fragment so it never reaches server logs or Referer headers.
    res.redirect(`${clientUrl()}/auth/callback#token=${token}`);
  } catch (err) {
    console.error('Google callback failed:', err.message);
    fail('server');
  }
});

// GET /api/auth/me
router.get('/me', authStudent, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(401).json({ error: 'User no longer exists' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
