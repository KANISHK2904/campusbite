# CampusBite

A campus food and snack ordering system. Students browse shops, order items, pay online and receive a QR code. They show the QR at the counter, and the shop owner scans it to confirm the order was collected. Shop owners manage their own menu and stock and track their revenue.

> Status: working locally. Deployment is planned.

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [How it works](#how-it-works)
4. [Project structure](#project-structure)
5. [Getting started](#getting-started)
6. [Environment variables](#environment-variables)
7. [Database](#database)
8. [Running the app](#running-the-app)
9. [Security](#security)
10. [Deployment plan](#deployment-plan)
11. [Roadmap](#roadmap)
12. [Troubleshooting](#troubleshooting)
13. [Author](#author)

---

## Features

### Student side
- Sign in with a Google account (email based).
- Browse shops and their menus.
- Add items to a cart and pay online.
- Receive a QR ticket after payment.
- View order history and the total amount spent.

### Admin (shop owner) side
- Sign up and log in with a username and password.
- Create and manage a shop (place) with its own items.
- Add, edit and delete items with name, price, quantity and photo.
- Stock reduces automatically when students order.
- Live orders screen.
- QR scanner to verify and mark an order as delivered. Already-delivered and invalid QR codes are handled with their own screens.
- Revenue history by period (today, 7 days, 30 days, this month, last month, 90 days, 1 year, or custom dates). It shows revenue, orders, items sold and average order value, with day-wise and month-wise views, a per-item ranking, and CSV export.
- Account page with log out and delete account (requires password and typing DELETE).
- Admins can only see and edit their own shop's data.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MySQL |
| Student login | Google sign-in |
| Admin login | Username and password with JWT |
| Payments | Razorpay |
| Design | Screens designed in Stitch (see `design/`) |

---

## How it works

1. A student signs in with Google and opens a shop.
2. They add items to the cart and pay.
3. After payment, the server creates an order and shows a QR ticket.
4. The student goes to the shop and shows the QR.
5. The shop owner opens the scanner, scans the QR, and the order is marked as delivered.
6. The order appears in the student's history and counts toward the shop's revenue.

---

## Project structure

```
campusbit/
├── client/                  React frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── components/      Shared, admin and student UI components
│   │   ├── contexts/        Auth and cart state
│   │   ├── hooks/           API and Razorpay hooks
│   │   ├── pages/
│   │   │   ├── admin/       Login, signup, dashboard, inventory, orders, scanner, revenue, account
│   │   │   └── student/     Splash login, home, menu, cart, payment, orders, profile
│   │   ├── router/          Admin and student routes
│   │   └── utils/
│   ├── tailwind.config.cjs
│   └── vite.config.js
├── server/                  Express backend
│   ├── src/
│   │   ├── config/          Database connection
│   │   ├── middleware/      Admin and student auth
│   │   ├── routes/          auth, places, items, orders, scanner, history, revenue
│   │   └── index.js         Server entry point
│   ├── schema.sql           Database tables
│   ├── setup-db.bat         Windows helper to create the database
│   └── .env.example         Example environment file
├── design/                  Stitch design exports (HTML and screenshots)
├── reset_history.sql        Developer tool to wipe order history (use with care)
└── README.md
```

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version)
- [MySQL](https://dev.mysql.com/downloads/) and MySQL Workbench
- [Git](https://git-scm.com/)
- A Google Cloud project with OAuth credentials (for student login)
- A Razorpay account in test mode (for payments)

### Installation

```bash
git clone https://github.com/KANISHK2904/campusbite.git
cd campusbite
```

Install the backend:

```bash
cd server
npm install
```

Install the frontend:

```bash
cd ../client
npm install
```

---

## Environment variables

The server reads its settings from `server/.env`. This file is **never committed** to Git.

1. Copy the example file:
   ```bash
   cd server
   copy .env.example .env
   ```
   (On macOS or Linux use `cp .env.example .env`.)
2. Open `.env` and fill in every value: database connection details, a long random `JWT_SECRET`, Google OAuth credentials, and Razorpay test keys. The names of all required variables are listed in `.env.example`.

Never share your `.env` file or paste its contents in public. If a secret leaks, rotate it immediately.

---

## Database

1. Make sure MySQL is running.
2. Create the database and tables using either method:
   - **Windows helper:** run `server/setup-db.bat`.
   - **Manual:** open MySQL Workbench, then run the contents of `server/schema.sql`.
3. The database is named `campusbite`.

Main tables: `admins`, `places`, `items`, `orders`, `order_items`, plus the student accounts table.

### Resetting data (development only)

`reset_history.sql` can delete order history and optionally accounts and stock. **Back up first** (Workbench: Server > Data Export). Deleted rows cannot be recovered. Do not run it on a live database.

---

## Running the app

Open two terminals.

**Terminal 1: backend**
```bash
cd server
npm run dev
```
The API runs on `http://localhost:5000`. Check it at `http://localhost:5000/api/health`. It should return `ok`.

**Terminal 2: frontend**
```bash
cd client
npm run dev
```
The app runs on `http://localhost:5173`.

Keep both terminals open while testing.

### Test flow

1. Open the admin screen and sign up with a shop name, username and password.
2. Add a few items with price and quantity.
3. Open the student side in another browser or a private window and sign in with Google.
4. Order an item and pay in Razorpay test mode.
5. Use the QR ticket with the admin scanner to mark the order delivered.

---

## Security

- Admin passwords are stored hashed, never in plain text.
- Admin routes use the shop ID from the verified token, so one shop cannot access another shop's data.
- Secrets live in `.env`, which is excluded from Git.
- Account deletion requires the admin's password and typing `DELETE`, and is performed as one all-or-nothing operation.
- Prices and totals should always be calculated on the server, not trusted from the browser.
- Orders should be marked as paid only after payment verification on the server.

Before going live, also review: rate limiting on login, restricted CORS, input validation, HTTPS only, a least-privilege database user, regular backups, and restricting student sign-in to the college email domain if needed.

---

## Deployment plan

The goal is a free, single-website deployment where Express serves both the API and the built React app.

| Part | Planned service |
|---|---|
| Website (client and server together) | Render (free web service) |
| MySQL database | TiDB Cloud or Aiven (free tier) |
| Item photos | Cloudinary (free tier) |
| Payments | Razorpay test mode first |

Things to handle before deploying:
- Serve `client/dist` from Express and call the API with relative `/api` paths.
- Move item photo uploads off the local disk, because free hosts wipe it on redeploy.
- Add the live URL to Google OAuth authorized origins.
- Set all environment variables in the hosting dashboard.
- Handle IST time zone in revenue reports, because cloud servers run in UTC.
- Note that free servers sleep when idle, so the first request can be slow.

---

## Roadmap

- [ ] Deploy to the web
- [ ] Cloud photo storage
- [ ] Restrict student login to the college email domain
- [ ] Rate limiting and security headers
- [ ] Order notifications
- [ ] Refunds and cancellations
- [ ] Multiple admins per shop

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm run dev` fails in `server` | Run `npm install` first and check that `.env` exists and is filled in. |
| Database connection error | Make sure MySQL is running and the credentials in `.env` are correct. |
| Client can't reach the API | Confirm the server is running on port 5000. |
| Google login fails | Check that the OAuth client ID is set and `http://localhost:5173` is an authorized origin. |
| `/api/admin/revenue` returns 404 | Restart the backend so the latest routes load. A 401 response is the expected result when not logged in. |
| QR scanner does not open the camera | Browsers allow the camera only on `localhost` or HTTPS. |
| Forgot admin password | Passwords are hashed and cannot be read. Reset it directly in the database with a new hashed password, or create a new admin. |

---

## Author

Built by [KANISHK2904](https://github.com/KANISHK2904) as a college project.

## License

No license has been chosen yet. Add a `LICENSE` file if you want others to be able to reuse the code.
