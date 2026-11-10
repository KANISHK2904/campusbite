const express = require('express');
const crypto = require('crypto');
const db = require('../config/db');
const authStudent = require('../middleware/authStudent');

const router = express.Router();

const MAX_LINES = 20;
const MAX_QTY_PER_ITEM = 20;

// PAYMENT_MODE=demo     -> fake "Pay" button, no Razorpay account needed (development only)
// PAYMENT_MODE=razorpay -> real Razorpay checkout (default)
function demoMode() {
  const demo = (process.env.PAYMENT_MODE || 'razorpay').trim().toLowerCase() === 'demo';
  if (demo && process.env.NODE_ENV === 'production') {
    throw Object.assign(new Error('Demo payment mode is disabled in production'), { status: 503 });
  }
  return demo;
}

// Created lazily, so demo mode works even if the razorpay package or keys are missing.
let rzp;
function razorpay() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw Object.assign(new Error('Payments are not configured yet'), { status: 503 });
  }
  if (!rzp) {
    const Razorpay = require('razorpay');
    rzp = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
  }
  return rzp;
}

// POST /api/orders/create-razorpay
// Body: { placeId, items: [{ itemId, quantity }] }
// Prices and stock are read from the DB here. Anything the browser says about price is ignored.
router.post('/create-razorpay', authStudent, async (req, res) => {
  try {
    const demo = demoMode();
    const placeId = Number.parseInt(req.body?.placeId, 10);
    const lines = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!Number.isInteger(placeId) || placeId < 1) return res.status(400).json({ error: 'Invalid place' });
    if (lines.length === 0 || lines.length > MAX_LINES) {
      return res.status(400).json({ error: 'Your cart is empty or too large' });
    }

    // Validate lines and merge duplicates of the same item
    const wanted = new Map();
    for (const l of lines) {
      const itemId = Number.parseInt(l?.itemId, 10);
      const qty = Number.parseInt(l?.quantity, 10);
      if (!Number.isInteger(itemId) || itemId < 1 || !Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ error: 'Invalid cart item' });
      }
      wanted.set(itemId, (wanted.get(itemId) || 0) + qty);
    }
    for (const qty of wanted.values()) {
      if (qty > MAX_QTY_PER_ITEM) {
        return res.status(400).json({ error: `You can order at most ${MAX_QTY_PER_ITEM} of one item` });
      }
    }

    const [places] = await db.query('SELECT id, name FROM places WHERE id = ? AND is_open = 1', [placeId]);
    if (!places.length) return res.status(404).json({ error: 'This place is closed or does not exist' });

    const ids = [...wanted.keys()];
    const [items] = await db.query(
      'SELECT id, name, price, quantity FROM items WHERE place_id = ? AND is_available = 1 AND id IN (?)',
      [placeId, ids]
    );
    if (items.length !== ids.length) {
      return res.status(409).json({ error: 'Some items are no longer available. Please review your cart.' });
    }

    let totalPaise = 0;
    const snapshot = [];
    for (const it of items) {
      const qty = wanted.get(it.id);
      if (it.quantity < qty) {
        return res.status(409).json({
          error: it.quantity === 0 ? `${it.name} is sold out` : `${it.name}: only ${it.quantity} left`,
        });
      }
      const unitPaise = Math.round(Number(it.price) * 100);
      totalPaise += unitPaise * qty;
      snapshot.push({ id: it.id, name: it.name, price: unitPaise / 100, quantity: qty });
    }
    if (totalPaise < 100) return res.status(400).json({ error: 'Minimum order amount is ₹1' });

    const rzpOrder = demo
      ? { id: `demo_order_${crypto.randomBytes(8).toString('hex')}` }
      : await razorpay().orders.create({
          amount: totalPaise, // paise
          currency: 'INR',
          receipt: `cb_${crypto.randomBytes(8).toString('hex')}`,
          notes: { user_id: String(req.user.id), place_id: String(placeId) },
        });

    // Save our own 'pending' order. Stock is NOT touched until the payment is verified.
    const conn = await db.getConnection();
    let orderId;
    try {
      await conn.beginTransaction();
      const [r] = await conn.query(
        'INSERT INTO orders (user_id, place_id, total_amount, status, razorpay_order_id) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, placeId, totalPaise / 100, 'pending', rzpOrder.id]
      );
      orderId = r.insertId;
      await conn.query('INSERT INTO order_items (order_id, item_id, name, price, quantity) VALUES ?', [
        snapshot.map((s) => [orderId, s.id, s.name, s.price, s.quantity]),
      ]);
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    res.json({
      orderId,
      razorpayOrderId: rzpOrder.id,
      amount: totalPaise,
      currency: 'INR',
      mode: demo ? 'demo' : 'razorpay',
      key: demo ? null : process.env.RAZORPAY_KEY_ID, // public key id only, never the secret
      placeName: places[0].name,
    });
  } catch (err) {
    console.error('create-razorpay failed:', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Could not start the payment. Please try again.' });
  }
});

// POST /api/orders/verify-payment
// razorpay mode body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// demo mode body:     { razorpay_order_id }
router.post('/verify-payment', authStudent, async (req, res) => {
  let demo;
  try {
    demo = demoMode();
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }

  const body = req.body || {};
  const { razorpay_order_id, razorpay_signature } = body;
  let { razorpay_payment_id } = body;
  if (typeof razorpay_order_id !== 'string' || !razorpay_order_id) {
    return res.status(400).json({ error: 'Missing payment details' });
  }

  if (demo) {
    // Demo orders only: a real Razorpay order can never be "paid" this way
    if (!razorpay_order_id.startsWith('demo_order_')) return res.status(400).json({ error: 'Not a demo order' });
    razorpay_payment_id = `demo_pay_${crypto.randomBytes(8).toString('hex')}`;
  } else {
    if ([razorpay_payment_id, razorpay_signature].some((v) => typeof v !== 'string' || !v)) {
      return res.status(400).json({ error: 'Missing payment details' });
    }
    if (razorpay_order_id.startsWith('demo_order_')) return res.status(400).json({ error: 'Payment verification failed' });
    if (!process.env.RAZORPAY_KEY_SECRET) return res.status(503).json({ error: 'Payments are not configured yet' });

    // 1) Signature check: proves Razorpay (not the browser) says this payment is real
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(razorpay_signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 2) Lock this order row so a double-click or retry cannot deduct stock twice
    const [orders] = await conn.query(
      'SELECT id, place_id, total_amount, status FROM orders WHERE razorpay_order_id = ? AND user_id = ? FOR UPDATE',
      [razorpay_order_id, req.user.id]
    );
    if (!orders.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = orders[0];

    const [[place]] = await conn.query('SELECT name FROM places WHERE id = ?', [order.place_id]);
    const shape = (status) => ({
      id: order.id,
      status,
      total_amount: Number(order.total_amount),
      place_name: place?.name || '',
    });

    if (order.status === 'paid' || order.status === 'delivered') {
      await conn.rollback(); // already confirmed earlier: safe to call again
      return res.json({ order: shape(order.status), alreadyConfirmed: true });
    }
    if (order.status !== 'pending') {
      await conn.rollback();
      return res.status(409).json({ error: 'This order can no longer be confirmed' });
    }

    // 3) Deduct stock. The WHERE quantity >= ? stops it from ever going negative.
    const [lines] = await conn.query(
      'SELECT item_id, quantity FROM order_items WHERE order_id = ? ORDER BY item_id',
      [order.id]
    );
    let soldOut = false;
    for (const l of lines) {
      const [r] = await conn.query(
        'UPDATE items SET quantity = quantity - ? WHERE id = ? AND quantity >= ?',
        [l.quantity, l.item_id, l.quantity]
      );
      if (r.affectedRows === 0) {
        soldOut = true;
        break;
      }
    }

    if (soldOut) {
      await conn.rollback(); // undoes every deduction made above
      await db.query(
        "UPDATE orders SET status = 'failed', razorpay_payment_id = ? WHERE id = ? AND status = 'pending'",
        [razorpay_payment_id, order.id]
      );
      let refunded = false;
      if (!demo) {
        try {
          await razorpay().payments.refund(razorpay_payment_id, { speed: 'normal' });
          refunded = true;
        } catch (e) {
          console.error('Auto-refund failed for payment', razorpay_payment_id, e);
        }
      }
      return res.status(409).json({
        error: demo
          ? 'Sorry, an item sold out while you were checking out. Nothing was charged (demo mode).'
          : refunded
            ? 'Sorry, an item sold out while you were paying. Your payment is being refunded.'
            : `Sorry, an item sold out. We could not refund automatically, please contact the shop with payment ID ${razorpay_payment_id}.`,
      });
    }

    // 4) Payment is real (or demo) and stock is secured: only now generate the QR token
    const qrToken = crypto.randomUUID();
    await conn.query(
      "UPDATE orders SET status = 'paid', razorpay_payment_id = ?, qr_token = ? WHERE id = ?",
      [razorpay_payment_id, qrToken, order.id]
    );
    await conn.commit();

    res.json({ order: shape('paid') });
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    console.error('verify-payment failed:', err);
    res.status(500).json({ error: 'Could not confirm the payment. Please try again.' });
  } finally {
    conn.release();
  }
});

// GET /api/orders/:id  -> one of the student's own orders (used by the success page)
router.get('/:id', authStudent, async (req, res, next) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || String(id) !== req.params.id) return next(); // lets later routes like /my match
  try {
    const [orders] = await db.query(
      `SELECT o.id, o.status, o.total_amount, o.created_at, p.name AS place_name
       FROM orders o JOIN places p ON p.id = o.place_id
       WHERE o.id = ? AND o.user_id = ?`,
      [id, req.user.id]
    );
    if (!orders.length) return res.status(404).json({ error: 'Order not found' });
    const [items] = await db.query(
      `SELECT oi.name, oi.price, oi.quantity, i.image_url
       FROM order_items oi LEFT JOIN items i ON i.id = oi.item_id
       WHERE oi.order_id = ?`,
      [id]
    );
    res.json({
      ...orders[0],
      total_amount: Number(orders[0].total_amount),
      items: items.map((i) => ({ ...i, price: Number(i.price) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
