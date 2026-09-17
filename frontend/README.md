#  Library Management System — Frontend

A modern web interface for the **Library Management System**, built with **React** and **Vite**.

The frontend provides an interface for members, librarians, and administrators to interact with the library system through the backend REST API.

##  Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the backend URL

Create a `.env` file if your project uses environment variables for the API URL.

Example:

```env
VITE_API_URL=http://localhost:3000/api
```

Make sure the backend server is running before using features that require API access.

### 3. Run the development server

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

### 4. Build for production

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

##  Technologies

* React
* Vite
* JavaScript
* CSS
* React Router
* REST API

Additional libraries used by the project can be found in `package.json`.

##  Features

###  Authentication

* User registration
* User login
* JWT-based authentication
* Protected pages
* Role-based access

###  Books

* Browse books
* Search books
* Filter books
* View book details
* Check book availability

###  Borrowing

* Borrow books
* Return books
* View borrowing history
* View overdue books
* View fines

###  User Management

Depending on the user's role:

* View profile
* Update profile
* Manage members
* Manage user roles

###  Dashboard

The dashboard provides information about library activity, such as:

* Total books
* Available books
* Borrowed books
* Registered members
* Borrowing activity
* Fines

##  User Roles

### Member

Members can:

* Browse and search books
* View book details
* Borrow books
* Return books
* View borrowing history
* View fines

### Librarian

Librarians can:

* Manage books
* View members
* Issue books
* Process returns
* Manage fines
* View library activity

### Administrator

Administrators can:

* Manage books
* Manage users
* Manage user roles
* Delete books
* Access administrative functionality

##  Project Structure

```text
frontend/
│
├── public/
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── App.jsx
│   └── main.jsx
│
├── .env
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

> The exact structure may vary depending on the current implementation.

##  Backend Connection

The frontend communicates with the backend through REST API endpoints.

The backend should be running at:

```text
http://localhost:3000
```

The frontend API base URL can be configured using:

```env
VITE_API_URL=http://localhost:3000/api
```

For example, the frontend may communicate with endpoints such as:

```text
GET    /api/books
POST   /api/books
GET    /api/books/:id
POST   /api/borrows
PUT    /api/borrows/:id/return
GET    /api/users/:id/borrows
```

##  Development

Start the frontend:

```bash
npm run dev
```

Start the backend separately:

```bash
npm run dev
```

The frontend and backend run as separate applications during development.

##  Project Status

**Frontend development in progress.**
