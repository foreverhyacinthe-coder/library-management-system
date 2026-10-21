# eSomero — Library Management System

A full-stack library management platform built with **React + TypeScript** (frontend) and **Node.js + Express + MongoDB** (backend).

---

## Features

| Feature | Detail |
|---|---|
| **Role-based access** | Admin · Librarian · Member |
| **Books catalogue** | Add, edit, search, filter by category / availability |
| **Members** | Register members, auto-generate membership IDs (`LMS-YYYY-NNN`) |
| **Circulation** | Issue & return books with typeahead search |
| **Fines** | Auto-calculated at **$0.50 / overdue day**, collect and track payment |
| **Dashboard** | Live stats, weekly & monthly borrow charts |
| **JWT auth** | 24-hour tokens, password change, 401 auto-redirect |
| **Rate limiting** | 300 req/15 min general · 20 req/15 min login |

---

## Project Structure

```
eSomero/
├── frontend/          React + TypeScript + Vite
└── backend/           Node.js + Express + MongoDB
```

---

## Prerequisites

- **Node.js** ≥ 18
- **MongoDB** ≥ 6 (local) or a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

---

## Quick Start

### 1 — Backend

```bash
cd backend
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env — set MONGO_URI and JWT_SECRET at minimum

# (Optional) seed the database with sample data
npm run seed

# Start the API server
npm run dev        # development (nodemon, auto-restart)
# or
npm start          # production
```

The API will be available at **http://localhost:3000**.

---

### 2 — Frontend

```bash
cd frontend
npm install

# (Optional) override API URL — defaults to http://localhost:3000
# Create frontend/.env.local and add:
# VITE_API_URL=http://localhost:3000

npm run dev        # development server on http://localhost:5173
npm run build      # production build → frontend/dist/
npm run preview    # preview production build
```

---

## Environment Variables

### Backend — `.env`

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | `development` or `production` |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/esomero` | MongoDB connection string |
| `JWT_SECRET` | *(required)* | Long random string — generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_EXPIRE` | `24h` | JWT expiry (e.g. `12h`, `7d`) |
| `FINE_RATE` | `0.50` | Fine per overdue day (USD) |
| `LOAN_DAYS` | `14` | Default loan period in days |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:4173` | Comma-separated CORS origins |

### Frontend — `.env.local` *(optional)*

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Backend API base URL |

---

## Default Seed Accounts

Run `npm run seed` in the backend directory to populate the database.

| Role | Email | Password |
|---|---|---|
| Admin | admin@esomero.com | Admin@123 |
| Librarian | librarian@esomero.com | Lib@123 |
| Member | alice@example.com | Member@123 |
| Member | brian@example.com | Member@123 |
| Member | carol@example.com | Member@123 |

> ⚠️ The seed script clears all existing data. Run it only on a fresh/development database.

---

## API Reference

All endpoints are prefixed with `/api`.

### Auth
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login → returns JWT |
| GET | `/auth/me` | Any | Get current user |
| PUT | `/auth/change-password` | Any | Change own password |

### Books
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/books` | Any | List books (filter: `search`, `category`, `available`, `page`, `limit`) |
| GET | `/books/search?q=` | Any | Full-text search |
| GET | `/books/:id` | Any | Get single book |
| POST | `/books` | Staff | Create book |
| PUT | `/books/:id` | Staff | Update book |
| DELETE | `/books/:id` | Staff | Soft-delete book |

### Users
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/users` | Staff | List users |
| GET | `/users/dashboard/stats` | Staff | Dashboard statistics |
| GET | `/users/:id` | Self/Staff | Get user |
| POST | `/users` | Staff | Create user |
| PUT | `/users/:id` | Self/Staff | Update user |
| DELETE | `/users/:id` | Admin | Deactivate user |

### Borrows
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/borrows` | Staff (all) / Member (own) | List borrows |
| GET | `/borrows/my` | Any | Own borrows |
| GET | `/borrows/overdue` | Staff | All overdue records |
| GET | `/borrows/:id` | Self/Staff | Single borrow |
| POST | `/borrows` | Staff | Issue a book |
| PUT | `/borrows/:id/return` | Staff | Return a book |
| PUT | `/borrows/:id/pay-fine` | Staff | Mark fine as paid |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · TypeScript · Vite · React Router v6 · Axios · Lucide React |
| Backend | Node.js · Express 4 · Mongoose 8 |
| Database | MongoDB 6+ |
| Auth | JSON Web Tokens (jsonwebtoken) · bcryptjs |
| Validation | express-validator |
| Rate limiting | express-rate-limit |

---

## Production Deployment Notes

1. Set `NODE_ENV=production` and a strong `JWT_SECRET`.
2. Point `MONGO_URI` at your Atlas cluster.
3. Set `ALLOWED_ORIGINS` to your deployed frontend URL.
4. Build the frontend: `cd frontend && npm run build` — serve `dist/` via a CDN or reverse proxy (e.g. Nginx).
5. Run the backend behind a process manager like **PM2**: `pm2 start server.js --name esomero-api`.

---

*eSomero — Your Library, Smarter*
