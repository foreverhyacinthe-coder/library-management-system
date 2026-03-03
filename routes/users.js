const express = require('express');
const router = express.Router();
const {
  getUsers, getUser, updateUser, deleteUser, getUserBorrows,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Member management
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all members (librarian/admin)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [member, librarian, admin] }
 *     responses:
 *       200: { description: List of users }
 */
router.get('/', protect, authorize('librarian', 'admin'), getUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User details }
 *       404: { description: Not found }
 */
router.get('/:id', protect, getUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user profile
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:    { type: string }
 *               phone:   { type: string }
 *               address: { type: string }
 *     responses:
 *       200: { description: Updated }
 */
router.put('/:id', protect, validate(schemas.updateUser), updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Deactivate a user (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Deactivated }
 */
router.delete('/:id', protect, authorize('admin'), deleteUser);

/**
 * @swagger
 * /users/{id}/borrows:
 *   get:
 *     summary: Get borrow history for a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Borrow history }
 */
router.get('/:id/borrows', protect, getUserBorrows);

module.exports = router;