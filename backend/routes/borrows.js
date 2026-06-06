const express = require('express');
const router = express.Router();
const {
  borrowBook, returnBook, getBorrows, getBorrow, payFine,
} = require('../controllers/borrowController');
const { protect, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Borrows
 *   description: Book borrowing and returning
 */

/**
 * @swagger
 * /borrows:
 *   get:
 *     summary: List all borrow records (librarian/admin)
 *     tags: [Borrows]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [borrowed, returned, overdue] }
 *     responses:
 *       200: { description: Paginated borrow records }
 */
router.get('/', protect, authorize('librarian', 'admin'), getBorrows);

/**
 * @swagger
 * /borrows/{id}:
 *   get:
 *     summary: Get a single borrow record
 *     tags: [Borrows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Borrow details with current fine }
 */
router.get('/:id', protect, getBorrow);

/**
 * @swagger
 * /borrows:
 *   post:
 *     summary: Issue a book to a member
 *     tags: [Borrows]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookId, dueDate]
 *             properties:
 *               bookId:  { type: string }
 *               userId:  { type: string, description: "Librarian/admin only" }
 *               dueDate: { type: string, format: date, example: "2025-12-01" }
 *               notes:   { type: string }
 *     responses:
 *       201: { description: Book issued }
 *       409: { description: No copies available }
 */
router.post('/', protect, validate(schemas.borrow), borrowBook);

/**
 * @swagger
 * /borrows/{id}/return:
 *   put:
 *     summary: Return a borrowed book
 *     tags: [Borrows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Returned, fine info included }
 */
router.put('/:id/return', protect, validate(schemas.return), returnBook);

/**
 * @swagger
 * /borrows/{id}/pay-fine:
 *   put:
 *     summary: Mark the fine on a borrow as paid (librarian/admin)
 *     tags: [Borrows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Fine marked as paid }
 */
router.put('/:id/pay-fine', protect, authorize('librarian', 'admin'), payFine);

module.exports = router;