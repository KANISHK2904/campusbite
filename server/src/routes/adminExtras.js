const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const authAdmin = require('../middleware/authAdmin');

// Use whichever bcrypt package your admin login already uses
let bcrypt;
try { bcrypt = require('bcryptjs'); } catch { bcrypt = require('bcrypt'); }

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'items');
const IMG_RE = /^\/uploads\/items\/[a-f0-9]{32}\.(jpg|png|webp)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 1100; // about 3 years

// ── date helpers (all in the server's local time, same as the rest of the app) ──
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const ym = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const round2 = (v) => Math.round(Number(v) * 100) / 100;
function parseYmd(s) {
  if (!DATE_RE.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d ? dt : null;
}

// ════════════════════════════════════════════════════════════════════════════
// GET /api/admin/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
// Revenue = paid + delivered orders of THIS admin's shop (unpaid / failed never count).
// ════════════════════════════════════════════════════════════════════════════
router.get('/revenue', authAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fromD = req.query.from ? parseYmd(String(req.query.from)) : addDays(today, -29);
    const toD = req.query.to ? parseYmd(String(req.query.to)) : today;
    if (!fromD || !toD) return res.status(400).json({ error: 'Dates must look like 2026-11-09' });
    if (fromD > toD) return res.status(400).json({ error: 'The start date must be before the end date' });
    if (Math.round((toD - fromD) / 86400000) + 1 > MAX_DAYS) {
      return res.status(400).json({ error: 'Please choose a range of up to 3 years' });
    }

    const end = addDays(toD, 1); // exclusive end = start of the day after "to"
    const params = [req.admin.place_id, fromD, end];
    const WHERE = `o.place_id = ? AND o.status IN ('paid', 'delivered') AND o.created_at >= ? AND o.created_at < ?`;

    const [[tot]] = await db.query(
      `SELECT COUNT(*) AS orders, COALESCE(SUM(o.total_amount), 0) AS revenue FROM orders o WHERE ${WHERE}`,
      params
    );
    const [[sold]] = await db.query(
      `SELECT COALESCE(SUM(oi.quantity), 0) AS items_sold
       FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE ${WHERE}`,
      params
    );
    const [dayRows] = await db.query(
      `SELECT DATE_FORMAT(o.created_at, '%Y-%m-%d') AS d, COUNT(*) AS orders, SUM(o.total_amount) AS revenue
       FROM orders o WHERE ${WHERE} GROUP BY d ORDER BY d`,
      params
    );
    const [monthRows] = await db.query(
      `SELECT DATE_FORMAT(o.created_at, '%Y-%m') AS m, COUNT(*) AS orders, SUM(o.total_amount) AS revenue
       FROM orders o WHERE ${WHERE} GROUP BY m ORDER BY m`,
      params
    );
    const [itemRows] = await db.query(
      `SELECT oi.item_id, MAX(oi.name) AS name, SUM(oi.quantity) AS quantity, SUM(oi.price * oi.quantity) AS revenue
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE ${WHERE} GROUP BY oi.item_id ORDER BY revenue DESC`,
      params
    );

    // Fill days / months that had no sales with zeros, so charts have no gaps
    const dayMap = new Map(dayRows.map((r) => [r.d, r]));
    const by_day = [];
    for (let d = new Date(fromD); d <= toD; d = addDays(d, 1)) {
      const r = dayMap.get(ymd(d));
      by_day.push({ date: ymd(d), orders: r ? Number(r.orders) : 0, revenue: r ? round2(r.revenue) : 0 });
    }
    const monthMap = new Map(monthRows.map((r) => [r.m, r]));
    const by_month = [];
    for (let d = new Date(fromD.getFullYear(), fromD.getMonth(), 1); d <= toD; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      const r = monthMap.get(ym(d));
      by_month.push({ month: ym(d), orders: r ? Number(r.orders) : 0, revenue: r ? round2(r.revenue) : 0 });
    }

    const orders = Number(tot.orders);
    const revenue = round2(tot.revenue);
    res.json({
      range: { from: ymd(fromD), to: ymd(toD) },
      totals: {
        revenue,
        orders,
        items_sold: Number(sold.items_sold),
        avg_order: orders ? round2(revenue / orders) : 0,
      },
      by_day,
      by_month,
      by_item: itemRows.map((r) => ({
        item_id: r.item_id,
        name: r.name,
        quantity: Number(r.quantity),
        revenue: round2(r.revenue),
      })),
    });
  } catch (err) {
    console.error('revenue failed:', err);
    res.status(500).json({ error: 'Could not load the revenue report' });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// DELETE /api/admin/account    Body: { password, confirm: "DELETE" }
// Permanently removes this admin, their shop, items, photos and ALL orders of the shop.
// ════════════════════════════════════════════════════════════════════════════
router.delete('/account', authAdmin, async (req, res) => {
  const adminId = Number(req.admin?.id);
  const { password, confirm } = req.body || {};

  if (!adminId) return res.status(401).json({ error: 'Admin session not recognised. Please log in again.' });
  if (confirm !== 'DELETE') return res.status(400).json({ error: 'Type DELETE to confirm' });
  if (typeof password !== 'string' || !password) return res.status(400).json({ error: 'Enter your password' });

  let conn;
  try {
    const [[admin]] = await db.query('SELECT password_hash FROM admins WHERE id = ?', [adminId]);
    if (!admin) return res.status(404).json({ error: 'Account not found' });

    // 403 (not 401), so a wrong password does not log the admin out
    if (!(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(403).json({ error: 'Incorrect password' });
    }

    conn = await db.getConnection();
    await conn.beginTransaction();

    const [places] = await conn.query('SELECT id FROM places WHERE admin_id = ?', [adminId]);
    const placeIds = places.map((p) => p.id);
    let photos = [];

    if (placeIds.length) {
      const [imgs] = await conn.query(
        'SELECT image_url FROM items WHERE place_id IN (?) AND image_url IS NOT NULL',
        [placeIds]
      );
      photos = imgs.map((i) => i.image_url);

      // Children first, so the database foreign keys are satisfied
      await conn.query(
        'DELETE oi FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.place_id IN (?)',
        [placeIds]
      );
      await conn.query('DELETE FROM orders WHERE place_id IN (?)', [placeIds]);
      await conn.query('DELETE FROM items WHERE place_id IN (?)', [placeIds]);
      await conn.query('DELETE FROM places WHERE admin_id = ?', [adminId]);
    }
    await conn.query('DELETE FROM admins WHERE id = ?', [adminId]);
    await conn.commit();

    // Photos are removed only after the database part succeeded
    for (const url of photos) {
      if (IMG_RE.test(url)) fs.unlink(path.join(UPLOAD_DIR, path.basename(url)), () => {});
    }
    res.json({ message: 'Account deleted' });
  } catch (err) {
    if (conn) { try { await conn.rollback(); } catch { /* ignore */ } }
    console.error('delete account failed:', err);
    res.status(500).json({ error: 'Could not delete the account. Nothing was changed.' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
