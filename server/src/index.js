require('dotenv').config();
require('express-async-errors');

const path         = require('path');                          // ← NEW (photos)
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes          = require('./routes/auth');
const placesRoutes        = require('./routes/places');
const adminRoutes         = require('./routes/admin');
const authGoogleRoutes    = require('./routes/authGoogle');
const placesStudentRoutes = require('./routes/placesStudent');
const ordersRoutes        = require('./routes/orders');
const orderQrRoutes       = require('./routes/orderQr');        // ← NEW (Step 5)
const orderHistoryRoutes  = require('./routes/orderHistory');   // ← NEW (Step 6)
const adminExtraRoutes    = require('./routes/adminExtras');      // ← NEW (revenue + account)
const scannerRoutes       = require('./routes/scanner');        // ← NEW (Step 5)

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ── Uploaded item photos (public, read-only) ──────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {   // ← NEW (photos)
  index: false,
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  },
}));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',    authGoogleRoutes);
app.use('/api/auth',    authRoutes);
app.use('/api/places',  placesStudentRoutes);
app.use('/api/places',  placesRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/admin',   adminExtraRoutes);                       // ← NEW (revenue + account)
app.use('/api/orders',  ordersRoutes);
app.use('/api/orders',  orderQrRoutes);                          // ← NEW (Step 5)
app.use('/api/orders',  orderHistoryRoutes);                     // ← NEW (Step 6)
app.use('/api/scanner', scannerRoutes);                          // ← NEW (Step 5)

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  CampusBite server listening on http://localhost:${PORT}`);
});
