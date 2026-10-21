const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Book = require('../models/Book');
const { protect, canManage } = require('../middleware/auth');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

// ─── GET /api/books/search ───────────────────────────────────────────────────
// Must be before /:id to avoid collision
router.get('/search', protect, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ success: true, data: [] });

    const books = await Book.find(
      { $text: { $search: q }, isActive: true },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(20);

    // Fallback: regex search if text index not ready
    if (books.length === 0) {
      const regex = new RegExp(q, 'i');
      const fallback = await Book.find({
        isActive: true,
        $or: [{ title: regex }, { author: regex }, { isbn: regex }],
      }).limit(20);
      return res.json({ success: true, data: fallback });
    }

    res.json({ success: true, data: books });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET /api/books ──────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { category, available, search, page = 1, limit = 20 } = req.query;

    const filter = { isActive: true };
    if (category) filter.category = new RegExp(category, 'i');
    if (available === 'true') filter.availableCopies = { $gt: 0 };
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ title: re }, { author: re }, { isbn: re }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [books, total] = await Promise.all([
      Book.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Book.countDocuments(filter),
    ]);

    res.json({ success: true, data: books, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET /api/books/:id ──────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || !book.isActive) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, data: book });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── POST /api/books ─────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  canManage,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('author').trim().notEmpty().withMessage('Author is required'),
    body('totalCopies').isInt({ min: 1 }).withMessage('Total copies must be at least 1'),
  ],
  validate,
  async (req, res) => {
    try {
      const book = await Book.create(req.body);
      res.status(201).json({ success: true, data: book });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ success: false, message: 'A book with this ISBN already exists' });
      }
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ─── PUT /api/books/:id ──────────────────────────────────────────────────────
router.put('/:id', protect, canManage, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || !book.isActive) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Prevent available copies from exceeding total
    if (req.body.totalCopies !== undefined) {
      const diff = req.body.totalCopies - book.totalCopies;
      req.body.availableCopies = Math.max(0, (book.availableCopies ?? book.totalCopies) + diff);
    }

    const updated = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── DELETE /api/books/:id ───────────────────────────────────────────────────
router.delete('/:id', protect, canManage, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    // Soft delete
    book.isActive = false;
    await book.save();

    res.json({ success: true, message: 'Book removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
