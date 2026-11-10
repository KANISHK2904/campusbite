const express   = require('express');
const crypto    = require('crypto');
const fs        = require('fs');
const path      = require('path');
const multer    = require('multer');
const db        = require('../config/db');
const authAdmin = require('../middleware/authAdmin');

const router = express.Router();

// All routes in this file require an admin JWT
router.use(authAdmin);

// ── Photo upload settings ────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'items'); // d:\campusbit\server\uploads\items
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const IMG_RE    = /^\/uploads\/items\/[a-f0-9]{32}\.(jpg|png|webp)$/;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
}).single('image');

// Look at the first bytes of the file (a browser can lie about the file type, bytes cannot)
function detectImageType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

// Only accept our own upload paths (or nothing). Returns null (no image), a valid path, or undefined (invalid).
function cleanImageUrl(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !IMG_RE.test(value)) return undefined;
  return value;
}

// Delete an old photo file, but only if no item uses it any more
async function removeImageFile(url) {
  try {
    if (!url || !IMG_RE.test(url)) return;
    const [[row]] = await db.execute('SELECT COUNT(*) AS n FROM items WHERE image_url = ?', [url]);
    if (Number(row.n) > 0) return;
    fs.unlink(path.join(UPLOAD_DIR, path.basename(url)), () => {});
  } catch (err) {
    console.error('Could not remove old image:', err.message);
  }
}

// POST /api/admin/upload/item-image   (multipart form, field name "image")
router.post('/upload/item-image', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 2 MB)' : 'Could not read the image',
      });
    }
    if (!req.file) return res.status(400).json({ error: 'Choose an image first' });

    const kind = detectImageType(req.file.buffer);
    if (!kind) return res.status(400).json({ error: 'Only JPG, PNG or WebP images are allowed' });

    // Random name, extension comes from the detected type, never from the uploaded file name
    const name = `${crypto.randomBytes(16).toString('hex')}.${kind}`;
    fs.writeFile(path.join(UPLOAD_DIR, name), req.file.buffer, (writeErr) => {
      if (writeErr) {
        console.error('Image save failed:', writeErr);
        return res.status(500).json({ error: 'Could not save the image' });
      }
      res.status(201).json({ image_url: `/uploads/items/${name}` });
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
// PLACE MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════

// GET /api/admin/place — fetch admin's own place
router.get('/place', async (req, res) => {
  const [[place]] = await db.execute(
    'SELECT id, name, description, image_url, is_open FROM places WHERE admin_id = ? LIMIT 1',
    [req.admin.id]
  );
  if (!place) return res.status(404).json({ error: 'No place found for this admin' });
  res.json({ place });
});

// PUT /api/admin/place — update admin's own place details
router.put('/place', async (req, res) => {
  const { name, description, image_url, is_open } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Place name is required' });
  }

  await db.execute(
    `UPDATE places SET name = ?, description = ?, image_url = ?, is_open = ?
     WHERE admin_id = ?`,
    [name.trim(), description || null, image_url || null, is_open !== false ? 1 : 0, req.admin.id]
  );

  const [[place]] = await db.execute(
    'SELECT id, name, description, image_url, is_open FROM places WHERE admin_id = ? LIMIT 1',
    [req.admin.id]
  );
  res.json({ place });
});

// ════════════════════════════════════════════════════════════════════════════
// ITEMS CRUD — scoped to admin's own place
// ════════════════════════════════════════════════════════════════════════════

// GET /api/admin/items — all items for this admin's place
router.get('/items', async (req, res) => {
  const [items] = await db.execute(
    `SELECT id, name, price, quantity, category, image_url, is_available, created_at
     FROM   items
     WHERE  place_id = ?
     ORDER  BY created_at DESC`,
    [req.admin.place_id]
  );
  res.json({ items });
});

// POST /api/admin/items — create a new item
router.post('/items', async (req, res) => {
  const { name, price, quantity, category, image_url, is_available } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'Item name is required' });
  if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ error: 'Valid price is required' });
  }
  const image = cleanImageUrl(image_url);
  if (image === undefined) return res.status(400).json({ error: 'Invalid image' });

  const [result] = await db.execute(
    `INSERT INTO items (place_id, name, price, quantity, category, image_url, is_available)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      req.admin.place_id,
      name.trim(),
      parseFloat(price),
      parseInt(quantity) || 0,
      category || null,
      image,
      is_available !== false ? 1 : 0,
    ]
  );

  const [[item]] = await db.execute('SELECT * FROM items WHERE id = ?', [result.insertId]);
  res.status(201).json({ item });
});

// Helper: verify item belongs to admin's place (also returns the current photo)
async function verifyItemOwnership(adminPlaceId, itemId, res) {
  const [[item]] = await db.execute(
    'SELECT id, place_id, image_url FROM items WHERE id = ?',
    [itemId]
  );
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return null;
  }
  if (item.place_id !== adminPlaceId) {
    res.status(403).json({ error: 'You do not own this item' });
    return null;
  }
  return item;
}

// PUT /api/admin/items/:id — update an item
router.put('/items/:id', async (req, res) => {
  const owned = await verifyItemOwnership(req.admin.place_id, Number(req.params.id), res);
  if (!owned) return;

  const { name, price, quantity, category, image_url, is_available } = req.body;

  if (!name || !name.trim()) return res.status(400).json({ error: 'Item name is required' });
  if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
    return res.status(400).json({ error: 'Valid price is required' });
  }
  const image = cleanImageUrl(image_url);
  if (image === undefined) return res.status(400).json({ error: 'Invalid image' });

  await db.execute(
    `UPDATE items
     SET name = ?, price = ?, quantity = ?, category = ?, image_url = ?, is_available = ?
     WHERE id = ?`,
    [
      name.trim(),
      parseFloat(price),
      parseInt(quantity) || 0,
      category || null,
      image,
      is_available !== false ? 1 : 0,
      Number(req.params.id),
    ]
  );

  // Photo was replaced or removed: delete the old file
  if (owned.image_url && owned.image_url !== image) await removeImageFile(owned.image_url);

  const [[item]] = await db.execute('SELECT * FROM items WHERE id = ?', [Number(req.params.id)]);
  res.json({ item });
});

// DELETE /api/admin/items/:id — delete an item
router.delete('/items/:id', async (req, res) => {
  const owned = await verifyItemOwnership(req.admin.place_id, Number(req.params.id), res);
  if (!owned) return;

  try {
    await db.execute('DELETE FROM items WHERE id = ?', [Number(req.params.id)]);
  } catch (err) {
    // 1451 = this item is part of past orders, so the database refuses to delete it.
    // Hide it from students instead, so order history stays correct.
    if (err.errno === 1451) {
      await db.execute('UPDATE items SET is_available = 0 WHERE id = ?', [Number(req.params.id)]);
      return res.json({ message: 'This item is in past orders, so it was hidden instead of deleted', hidden: true });
    }
    throw err;
  }

  await removeImageFile(owned.image_url);
  res.json({ message: 'Item deleted' });
});

// PATCH /api/admin/items/:id/availability — toggle is_available quickly
router.patch('/items/:id/availability', async (req, res) => {
  const owned = await verifyItemOwnership(req.admin.place_id, Number(req.params.id), res);
  if (!owned) return;

  const { is_available } = req.body;
  await db.execute('UPDATE items SET is_available = ? WHERE id = ?', [
    is_available ? 1 : 0,
    Number(req.params.id),
  ]);
  res.json({ is_available: !!is_available });
});

// ════════════════════════════════════════════════════════════════════════════
// STATS — summary for the dashboard
// ════════════════════════════════════════════════════════════════════════════

// GET /api/admin/stats
//   orders_today / revenue_today : paid + delivered orders created today (your local day, 00:00 to 24:00)
//   pending_pickups              : ALL paid orders still waiting to be collected (any day)
router.get('/stats', async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [[today]] = await db.query(
    `SELECT COUNT(*)                        AS orders_today,
            COALESCE(SUM(total_amount), 0)  AS revenue_today
     FROM   orders
     WHERE  place_id = ?
       AND  status IN ('paid', 'delivered')
       AND  created_at >= ? AND created_at < ?`,
    [req.admin.place_id, start, end]
  );

  const [[pending]] = await db.query(
    `SELECT COUNT(*) AS pending_pickups
     FROM   orders
     WHERE  place_id = ? AND status = 'paid'`,
    [req.admin.place_id]
  );

  res.json({
    orders_today:    Number(today.orders_today),
    revenue_today:   parseFloat(today.revenue_today).toFixed(2),
    pending_pickups: Number(pending.pending_pickups),
  });
});

// ════════════════════════════════════════════════════════════════════════════
// ORDERS — pending + delivered for this admin's place
// ════════════════════════════════════════════════════════════════════════════

// GET /api/admin/orders?status=paid|delivered
router.get('/orders', async (req, res) => {
  const status = req.query.status === 'delivered' ? 'delivered' : 'paid';
  const [orders] = await db.execute(
    `SELECT o.id, o.total_amount, o.status, o.created_at, o.qr_token,
            u.name AS student_name, u.email AS student_email
     FROM   orders o
     JOIN   users u ON u.id = o.user_id
     WHERE  o.place_id = ? AND o.status = ?
     ORDER  BY o.created_at DESC
     LIMIT  50`,
    [req.admin.place_id, status]
  );

  // Fetch items per order
  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const [items] = await db.execute(
        'SELECT name, price, quantity FROM order_items WHERE order_id = ?',
        [order.id]
      );
      return { ...order, items };
    })
  );

  res.json({ orders: ordersWithItems });
});

module.exports = router;
