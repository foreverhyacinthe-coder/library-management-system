const Book = require('../models/Book');

// GET /api/books  — list with search & filter
exports.getBooks = async (req, res, next) => {
  try {
    const { search, genre, author, available, page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    } else {
      if (author) query.author = { $regex: author, $options: 'i' };
    }

    if (genre)     query.genre = genre;
    if (available === 'true')  query.availableCopies = { $gt: 0 };
    if (available === 'false') query.availableCopies = 0;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Book.countDocuments(query);
    const books = await Book.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      books,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/books/:id
exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || !book.isActive) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }
    res.json({ success: true, book });
  } catch (err) {
    next(err);
  }
};

// POST /api/books
exports.createBook = async (req, res, next) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json({ success: true, message: 'Book added successfully.', book });
  } catch (err) {
    next(err);
  }
};

// PUT /api/books/:id
exports.updateBook = async (req, res, next) => {
  try {
    const { totalCopies, ...rest } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book || !book.isActive) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    // Adjust availableCopies if totalCopies changes
    if (totalCopies !== undefined) {
      const diff = totalCopies - book.totalCopies;
      rest.totalCopies = totalCopies;
      rest.availableCopies = Math.max(0, book.availableCopies + diff);
    }

    const updated = await Book.findByIdAndUpdate(req.params.id, rest, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Book updated.', book: updated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/books/:id  (soft delete)
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!book) return res.status(404).json({ success: false, message: 'Book not found.' });
    res.json({ success: true, message: 'Book removed from catalogue.' });
  } catch (err) {
    next(err);
  }
};