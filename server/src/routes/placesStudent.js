const express = require('express');
const db = require('../config/db');
const authStudent = require('../middleware/authStudent');

const router = express.Router();

// NOTE: authStudent is applied per route (not router.use) so this router
// never intercepts the admin POST/PUT /api/places routes from Step 2.

// GET /api/places  -> all open places (+ categories for filter chips)
router.get('/', authStudent, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.name, p.description, p.image_url,
              GROUP_CONCAT(DISTINCT i.category ORDER BY i.category SEPARATOR '|') AS categories
       FROM places p
       LEFT JOIN items i ON i.place_id = p.id AND i.is_available = 1
       WHERE p.is_open = 1
       GROUP BY p.id
       ORDER BY p.name`
    );
    res.json(
      rows.map((r) => ({ ...r, categories: r.categories ? r.categories.split('|').filter(Boolean) : [] }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/places/:id/items  -> place + items with live stock
router.get('/:id/items', authStudent, async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid place id' });
  try {
    const [places] = await db.query(
      'SELECT id, name, description, image_url FROM places WHERE id = ? AND is_open = 1',
      [id]
    );
    if (!places.length) return res.status(404).json({ error: 'Place not found or closed' });

    const [items] = await db.query(
      `SELECT id, name, price, quantity, category, image_url
       FROM items
       WHERE place_id = ? AND is_available = 1
       ORDER BY category, name`,
      [id]
    );
    res.json({
      place: places[0],
      items: items.map((i) => ({ ...i, price: Number(i.price) })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
