const express = require('express');
const db = require('../config/db');
const authStudent = require('../middleware/authStudent');

const router = express.Router();

// GET /api/orders/:id/qr  -> the student's own QR token (only for paid / delivered orders)
router.get('/:id/qr', authStudent, async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || String(id) !== req.params.id) return res.status(400).json({ error: 'Invalid order id' });

    const [rows] = await db.query(
      'SELECT status, qr_token, delivered_at FROM orders WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });

    const o = rows[0];
    if (!['paid', 'delivered'].includes(o.status) || !o.qr_token) {
      return res.status(409).json({ error: 'No QR code for this order yet' });
    }
    res.json({ status: o.status, qr_token: o.qr_token, delivered_at: o.delivered_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
