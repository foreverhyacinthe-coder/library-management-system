#  Library Management System

A RESTful API built with **Node.js**, **Express**, and **MongoDB** for managing books, members, and borrowing.

---

##  Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

### 3. Run the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The API will be live at `http://localhost:3000`  
Swagger docs at `http://localhost:3000/api-docs`

---

## Project Structure

```
JS-WORK/
├── config/
│   ├── db.js            # MongoDB connection
│   └── swagger.js       # Swagger/OpenAPI config
├── controllers/
│   ├── authController.js
│   ├── bookController.js
│   ├── borrowController.js
│   └── userController.js
├── middleware/
│   ├── auth.js          # JWT protect + role authorize
│   ├── errorHandler.js  # Central error handler
│   └── validate.js      # Joi validation schemas
├── models/
│   ├── Book.js
│   ├── Borrow.js
│   └── User.js
├── routes/
│   ├── auth.js
│   ├── books.js
│   ├── borrows.js
│   └── users.js
├── .env.example
├── app.js
├── package.json
└── package-lock.json
```

---

## Roles & Permissions

| Action                     | Member | Librarian | Admin |
|----------------------------|:------:|:---------:|:-----:|
| Browse / search books      | ✅     | ✅        | ✅    |
| Borrow a book (self)       | ✅     | ✅        | ✅    |
| Borrow on behalf of member | ❌     | ✅        | ✅    |
| Return a book              | ✅     | ✅        | ✅    |
| Add / edit books           | ❌     | ✅        | ✅    |
| Delete books               | ❌     | ❌        | ✅    |
| View all members           | ❌     | ✅        | ✅    |
| Manage user roles          | ❌     | ❌        | ✅    |
| Pay / clear fines          | ❌     | ✅        | ✅    |

---

## API Endpoints

### Auth
| Method | Endpoint           | Description          |
|--------|--------------------|----------------------|
| POST   | /api/auth/register | Register new user    |
| POST   | /api/auth/login    | Login, get JWT token |
| GET    | /api/auth/me       | Get current user     |

### Books
| Method | Endpoint        | Description                     |
|--------|-----------------|---------------------------------|
| GET    | /api/books      | List books (search, filter, paginate) |
| GET    | /api/books/:id  | Get single book                 |
| POST   | /api/books      | Add a book *(librarian/admin)*  |
| PUT    | /api/books/:id  | Update a book *(librarian/admin)* |
| DELETE | /api/books/:id  | Remove a book *(admin only)*    |

### Borrows
| Method | Endpoint                    | Description                   |
|--------|-----------------------------|-------------------------------|
| GET    | /api/borrows                | All borrow records *(lib/admin)* |
| GET    | /api/borrows/:id            | Single borrow record          |
| POST   | /api/borrows                | Issue a book                  |
| PUT    | /api/borrows/:id/return     | Return a book                 |
| PUT    | /api/borrows/:id/pay-fine   | Mark fine as paid *(lib/admin)* |

### Users
| Method | Endpoint               | Description                  |
|--------|------------------------|------------------------------|
| GET    | /api/users             | All users *(lib/admin)*      |
| GET    | /api/users/:id         | Get user profile             |
| PUT    | /api/users/:id         | Update profile               |
| DELETE | /api/users/:id         | Deactivate user *(admin)*    |
| GET    | /api/users/:id/borrows | User borrow history          |

---

## Search & Filter Books

```
GET /api/books?search=javascript
GET /api/books?genre=Technology&available=true
GET /api/books?author=martin&page=1&limit=5
```

---

## Fine Calculation

Fines accrue at **$0.50/day** (configurable via `FINE_PER_DAY` in `.env`).  
Fines are calculated automatically on return and can be marked paid via `PUT /api/borrows/:id/pay-fine`.