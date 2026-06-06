const express = require('express');
const router = express.Router();
const {
  getBooks, getBook, createBook, updateBook, deleteBook,
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: Book catalogue management
 */

/**
 * @swagger
 * /books:
 *   get:
 *     summary: List all books (with search & filters)
 *     tags: [Books]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Full-text search (title, author, ISBN)
 *       - in: query
 *         name: genre
 *         schema: { type: string }
 *       - in: query
 *         name: author
 *         schema: { type: string }
 *       - in: query
 *         name: available
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200: { description: Paginated list of books }
 */
router.get('/', getBooks);

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Get a single book by ID
 *     tags: [Books]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Book details }
 *       404: { description: Not found }
 */
router.get('/:id', getBook);

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Add a new book (librarian/admin)
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, author, isbn, genre]
 *             properties:
 *               title:         { type: string }
 *               author:        { type: string }
 *               isbn:          { type: string }
 *               genre:         { type: string }
 *               totalCopies:   { type: integer, default: 1 }
 *               publishedYear: { type: integer }
 *               publisher:     { type: string }
 *               description:   { type: string }
 *               location:      { type: string }
 *     responses:
 *       201: { description: Book created }
 */
router.post('/', protect, authorize('librarian', 'admin'), validate(schemas.book), createBook);

/**
 * @swagger
 * /books/{id}:
 *   put:
 *     summary: Update a book (librarian/admin)
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Book updated }
 */
router.put('/:id', protect, authorize('librarian', 'admin'), validate(schemas.updateBook), updateBook);

/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: Remove a book from catalogue (admin only)
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Book removed }
 */
router.delete('/:id', protect, authorize('admin'), deleteBook);

module.exports = router;