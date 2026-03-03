require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const connectDB = require('./config/db');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');

const authRoutes   = require('./routes/auth');
const bookRoutes   = require('./routes/books');
const userRoutes   = require('./routes/users');
const borrowRoutes = require('./routes/borrows');

const app = express();

//  Connect to MongoDB 
connectDB();

//  Global Middleware 
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  API Routes 
app.use('/api/auth',    authRoutes);
app.use('/api/books',   bookRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/borrows', borrowRoutes);

//  Swagger Docs 
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//  Health Check 
app.get('/', (req, res) => {
  res.json({
    message: ' Library Management System API',
    version: '1.0.0',
    docs: '/api-docs',
  });
});

//  404 Handler 
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

//  Global Error Handler 
app.use(errorHandler);

//  Start Server 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` API Docs at  http://localhost:${PORT}/api-docs`);
});

module.exports = app;