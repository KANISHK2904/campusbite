const express = require('express');
const db = require('../config/db');
const authAdmin = require('../middleware/authAdmin');

const router = express.Router();

const TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /api/scanner/scan   Body: { token }
// Always answers 200 with { state } so the scanner screen can show one of 3 results:
//   success           -> order was paid, belongs to THIS admin's shop, now marked delivered
//   already_delivered -> this QR was already used
//   invalid_qr        -> unknown code, wrong shop, or an order that was never paid
router.post('/scan', authAdmin, async (req, res) => {
  try {
    const adminId = Number(req.admin?.id);
    if (!adminId) return res.status(401).json({ error: 'Admin session not recognised. Please log in again.' });

    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    if (!TOKEN_RE.test(token)) return res.json({ state: 'invalid_qr' });

    const [rows] = await db.query(
      `SELECT o.id, o.status, o.total_amount, o.delivered_at, p.admin_id, u.name AS student_name
       FROM orders o
       JOIN places p ON p.id = o.place_id
       JOIN users  u ON u.id = o.user_id
       WHERE o.qr_token = ?`,
      [token]
    );

    // Unknown token, or an order from a DIFFERENT shop: same answer, so nothing is revealed
    if (!rows.length || Number(rows[0].admin_id) !== adminId) return res.json({ state: 'invalid_qr' });
    const order = rows[0];

    const [items] = await db.query('SELECT name, quantity FROM order_items WHERE order_id = ?', [order.id]);
    const summary = {
      id: order.id,
      student_name: order.student_name,
      total_amount: Number(order.total_amount),
      items,
      delivered_at: order.delivered_at,
    };

    if (order.status === 'delivered') return res.json({ state: 'already_delivered', order: summary });
    if (order.status !== 'paid') return res.json({ state: 'invalid_qr' });

    // Atomic: only ONE scan can flip paid -> delivered, even if two phones scan at the same moment
    const [r] = await db.query(
      "UPDATE orders SET status = 'delivered', delivered_at = NOW() WHERE id = ? AND status = 'paid'",
      [order.id]
    );
    if (r.affectedRows === 0) return res.json({ state: 'already_delivered', order: summary });

    res.json({ state: 'success', order: { ...summary, delivered_at: new Date() } });
  } catch (err) {
    console.error('scan failed:', err);
    res.status(500).json({ error: 'Could not check this QR code. Please try again.' });
  }
});

module.exports = router;
