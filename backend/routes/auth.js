const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Registration and login
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: Alice Smith }
 *               email:    { type: string, example: alice@example.com }
 *               password: { type: string, example: secret123 }
 *               role:     { type: string, enum: [member, librarian, admin], example: member }
 *               phone:    { type: string }
 *               address:  { type: string }
 *     responses:
 *       201: { description: Registered successfully }
 *       409: { description: Email already exists }
 */
router.post("/register", validate(schemas.register), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive a JWT
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: alice@example.com }
 *               password: { type: string, example: secret123 }
 *     responses:
 *       200: { description: Login successful, token returned }
 *       401: { description: Invalid credentials }
 */
router.post("/login", validate(schemas.login), login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Auth]
 *     responses:
 *       200: { description: Current user info }
 *       401: { description: Unauthorized }
 */
router.get("/me", protect, getMe);

module.exports = router;
