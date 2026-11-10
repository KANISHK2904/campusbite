const express = require('express');
const db      = require('../config/db');

const router = express.Router();

// ─── GET /api/places ─────────────────────────────────────────────────────────
// Public: list all open places with their available item count
router.get('/', async (req, res) => {
  const [places] = await db.execute(
    `SELECT p.id, p.name, p.description, p.image_url, p.is_open,
            COUNT(i.id) AS item_count
     FROM   places p
     LEFT   JOIN items i ON i.place_id = p.id AND i.is_available = 1
     WHERE  p.is_open = 1
     GROUP  BY p.id
     ORDER  BY p.created_at DESC`
  );
  res.json({ places });
});

// ─── GET /api/places/:id/items ───────────────────────────────────────────────
// Public: all available items for one place (live stock)
router.get('/:id/items', async (req, res) => {
  const placeId = req.params.id;

  const [[place]] = await db.execute(
    'SELECT id, name, description, image_url, is_open FROM places WHERE id = ?',
    [placeId]
  );
  if (!place) return res.status(404).json({ error: 'Place not found' });

  const [items] = await db.execute(
    `SELECT id, name, price, quantity, category, image_url, is_available
     FROM   items
     WHERE  place_id = ? AND is_available = 1
     ORDER  BY category, name`,
    [placeId]
  );

  res.json({ place, items });
});

module.exports = router;
