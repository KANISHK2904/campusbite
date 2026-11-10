const express = require('express');
const db = require('../config/db');
const authStudent = require('../middleware/authStudent');

const router = express.Router();

// GET /api/orders/my  -> the logged-in student's own paid / collected orders + totals
// (Unpaid or failed checkouts are left out: they never cost the student anything.)
router.get('/my', authStudent, async (req, res) => {
  try {
    const userId = req.user.id;

    const [[summary]] = await db.query(
      `SELECT COUNT(*) AS order_count, COALESCE(SUM(total_amount), 0) AS total_spent
       FROM orders
       WHERE user_id = ? AND status IN ('paid', 'delivered')`,
      [userId]
    );

    const [orders] = await db.query(
      `SELECT o.id, o.status, o.total_amount, o.created_at, o.delivered_at, p.name AS place_name
       FROM orders o
       JOIN places p ON p.id = o.place_id
       WHERE o.user_id = ? AND o.status IN ('paid', 'delivered')
       ORDER BY o.created_at DESC, o.id DESC
       LIMIT 100`,
      [userId]
    );

    // One query for all items, then group them by order
    const byOrder = new Map(orders.map((o) => [o.id, []]));
    if (orders.length) {
      const [items] = await db.query(
        `SELECT oi.order_id, oi.name, oi.quantity, i.image_url
         FROM order_items oi
         LEFT JOIN items i ON i.id = oi.item_id
         WHERE oi.order_id IN (?)
         ORDER BY oi.id`,
        [orders.map((o) => o.id)]
      );
      for (const it of items) byOrder.get(it.order_id)?.push({ name: it.name, quantity: it.quantity, image_url: it.image_url });
    }

    res.json({
      summary: {
        order_count: Number(summary.order_count),
        total_spent: Number(summary.total_spent),
      },
      orders: orders.map((o) => ({
        id: o.id,
        status: o.status,
        total_amount: Number(o.total_amount),
        created_at: o.created_at,
        delivered_at: o.delivered_at,
        place_name: o.place_name,
        items: byOrder.get(o.id) || [],
      })),
    });
  } catch (err) {
    console.error('order history failed:', err);
    res.status(500).json({ error: 'Could not load your orders' });
  }
});

module.exports = router;
