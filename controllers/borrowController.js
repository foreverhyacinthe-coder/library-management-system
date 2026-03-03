const Borrow = require('../models/Borrow');
const Book = require('../models/Book');
const User = require('../models/User');

// POST /api/borrows  — issue a book
exports.borrowBook = async (req, res, next) => {
  try {
    const issuedTo = req.body.userId || req.user._id;
    const { bookId, dueDate, notes } = req.body;

    // Librarians/admins can borrow on behalf of a member
    if (req.body.userId && req.user.role === 'member') {
      return res.status(403).json({ success: false, message: 'Members cannot borrow on behalf of others.' });
    }

    const book = await Book.findById(bookId);
    if (!book || !book.isActive) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }
    if (book.availableCopies < 1) {
      return res.status(409).json({ success: false, message: 'No copies available at the moment.' });
    }

    // Check if user already has this book borrowed
    const existing = await Borrow.findOne({ user: issuedTo, book: bookId, status: 'borrowed' });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User already has this book borrowed.' });
    }

    const borrow = await Borrow.create({
      user: issuedTo,
      book: bookId,
      dueDate,
      notes,
      issuedBy: req.user._id,
    });

    // Decrease available copies
    await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1 } });
    await User.findByIdAndUpdate(issuedTo, { $push: { borrowedBooks: borrow._id } });

    await borrow.populate('book', 'title author isbn');
    await borrow.populate('user', 'name email membershipId');

    res.status(201).json({ success: true, message: 'Book issued successfully.', borrow });
  } catch (err) {
    next(err);
  }
};

// PUT /api/borrows/:id/return  — return a book
exports.returnBook = async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id).populate('book');
    if (!borrow) return res.status(404).json({ success: false, message: 'Borrow record not found.' });

    if (borrow.status === 'returned') {
      return res.status(400).json({ success: false, message: 'Book already returned.' });
    }

    // Members can only return their own books
    if (req.user.role === 'member' && borrow.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const fineAmount = borrow.calculateFine();

    borrow.returnedAt = new Date();
    borrow.status = 'returned';
    borrow.fine.amount = fineAmount;
    if (req.body.notes) borrow.notes = req.body.notes;
    await borrow.save();

    // Restore available copies
    await Book.findByIdAndUpdate(borrow.book._id, { $inc: { availableCopies: 1 } });

    res.json({
      success: true,
      message: 'Book returned successfully.',
      fine: fineAmount > 0 ? `Fine due: $${fineAmount}` : 'No fine.',
      borrow,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/borrows  — all borrows (librarian/admin)
exports.getBorrows = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;

    // Auto-mark overdue
    await Borrow.updateMany(
      { status: 'borrowed', dueDate: { $lt: new Date() } },
      { $set: { status: 'overdue' } }
    );

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Borrow.countDocuments(query);
    const borrows = await Borrow.find(query)
      .populate('user', 'name email membershipId')
      .populate('book', 'title author isbn')
      .sort('-borrowedAt')
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / limit), borrows });
  } catch (err) {
    next(err);
  }
};

// GET /api/borrows/:id
exports.getBorrow = async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id)
      .populate('user', 'name email membershipId')
      .populate('book', 'title author isbn')
      .populate('issuedBy', 'name email');

    if (!borrow) return res.status(404).json({ success: false, message: 'Borrow record not found.' });

    // Members can only see their own
    if (req.user.role === 'member' && borrow.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const fine = borrow.calculateFine();
    res.json({ success: true, borrow, currentFine: fine });
  } catch (err) {
    next(err);
  }
};

// PUT /api/borrows/:id/pay-fine  — mark fine as paid
exports.payFine = async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id);
    if (!borrow) return res.status(404).json({ success: false, message: 'Borrow record not found.' });

    if (borrow.fine.amount === 0) {
      return res.status(400).json({ success: false, message: 'No fine on this record.' });
    }
    if (borrow.fine.paid) {
      return res.status(400).json({ success: false, message: 'Fine already paid.' });
    }

    borrow.fine.paid = true;
    borrow.fine.paidAt = new Date();
    await borrow.save();

    res.json({ success: true, message: `Fine of $${borrow.fine.amount} marked as paid.`, borrow });
  } catch (err) {
    next(err);
  }
};