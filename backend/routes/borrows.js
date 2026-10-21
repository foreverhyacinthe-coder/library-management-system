const express = require('express');
const { body, validationResult } = require('express-validator');
const Borrow = require('../models/Borrow');
const Book = require('../models/Book');
const User = require('../models/User');
const { protect, canManage } = require('../middleware/auth');

const router = express.Router();

const FINE_RATE = parseFloat(process.env.FINE_RATE || '0.50'); // per overdue day
const LOAN_DAYS = parseInt(process.env.LOAN_DAYS || '14', 10);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

// ─── Helper: mark any borrowed records past dueDate as overdue ───────────────
const autoMarkOverdue = async (filter = {}) => {
  await Borrow.updateMany(
    { ...filter, status: 'borrowed', dueDate: { $lt: new Date() } },
    { $set: { status: 'overdue' } }
  );
};

// ─── Helper: calculate current fine amount ───────────────────────────────────
const calcFine = (dueDate, referenceDate = new Date()) => {
  const days = Math.max(0, Math.floor((referenceDate - new Date(dueDate)) / 86400000));
  return parseFloat((days * FINE_RATE).toFixed(2));
};

// ─── GET /api/borrows/my  (MUST be before /:id) ───────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    await autoMarkOverdue({ member: req.user._id });

    const borrows = await Borrow.find({ member: req.user._id })
      .populate('book', 'title author isbn coverImage')
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: borrows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET /api/borrows/overdue  (MUST be before /:id) ─────────────────────────
router.get('/overdue', protect, canManage, async (req, res) => {
  try {
    await autoMarkOverdue();

    const borrows = await Borrow.find({ status: 'overdue' })
      .populate('book', 'title author isbn')
      .populate('member', 'name email membershipId phone')
      .populate('issuedBy', 'name')
      .sort({ dueDate: 1 });

    // Attach live fine amounts
    const enriched = borrows.map(b => {
      const obj = b.toObject();
      obj.fine = { ...obj.fine, amount: calcFine(b.dueDate) };
      return obj;
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET /api/borrows ─────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const isStaff = ['admin', 'librarian'].includes(req.user.role);

    // Auto-update overdue
    const overdueFilter = isStaff ? {} : { member: req.user._id };
    await autoMarkOverdue(overdueFilter);

    const { status, member, page = 1, limit = 20 } = req.query;

    const filter = {};
    // Members only see their own borrows
    if (!isStaff) {
      filter.member = req.user._id;
    } else if (member) {
      filter.member = member;
    }
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [borrows, total] = await Promise.all([
      Borrow.find(filter)
        .populate('book', 'title author isbn coverImage')
        .populate('member', 'name email membershipId')
        .populate('issuedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Borrow.countDocuments(filter),
    ]);

    res.json({ success: true, data: borrows, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET /api/borrows/:id ─────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id)
      .populate('book', 'title author isbn coverImage')
      .populate('member', 'name email membershipId')
      .populate('issuedBy', 'name');

    if (!borrow) return res.status(404).json({ success: false, message: 'Borrow record not found' });

    // Members can only view their own records
    const isStaff = ['admin', 'librarian'].includes(req.user.role);
    if (!isStaff && borrow.member._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: borrow });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── POST /api/borrows  (issue a book) ───────────────────────────────────────
router.post(
  '/',
  protect,
  canManage,
  [
    body('bookId').notEmpty().withMessage('Book ID required'),
    body('memberId').notEmpty().withMessage('Member ID required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { bookId, memberId, dueDate } = req.body;

      // Validate book
      const book = await Book.findById(bookId);
      if (!book || !book.isActive) {
        return res.status(404).json({ success: false, message: 'Book not found' });
      }
      if (book.availableCopies < 1) {
        return res.status(400).json({ success: false, message: 'No copies available' });
      }

      // Validate member
      const member = await User.findById(memberId);
      if (!member || !member.isActive) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }
      if (member.role !== 'member') {
        return res.status(400).json({ success: false, message: 'User is not a library member' });
      }

      // Check for unpaid fines
      const unpaidFines = await Borrow.countDocuments({
        member: memberId,
        'fine.paid': false,
        'fine.amount': { $gt: 0 },
        status: { $in: ['returned', 'overdue'] },
      });
      if (unpaidFines > 0) {
        return res.status(400).json({
          success: false,
          message: 'Member has unpaid fines. Please settle before issuing a new book.',
        });
      }

      // Calculate due date
      const due = dueDate
        ? new Date(dueDate)
        : new Date(Date.now() + LOAN_DAYS * 86400000);

      if (due <= new Date()) {
        return res.status(400).json({ success: false, message: 'Due date must be in the future' });
      }

      // Create borrow record
      const borrow = await Borrow.create({
        book: bookId,
        member: memberId,
        issuedBy: req.user._id,
        dueDate: due,
      });

      // Decrement available copies
      await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1 } });

      const populated = await Borrow.findById(borrow._id)
        .populate('book', 'title author isbn')
        .populate('member', 'name email membershipId')
        .populate('issuedBy', 'name');

      res.status(201).json({ success: true, data: populated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ─── PUT /api/borrows/:id/return ──────────────────────────────────────────────
router.put('/:id/return', protect, canManage, async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id);
    if (!borrow) return res.status(404).json({ success: false, message: 'Borrow record not found' });
    if (borrow.status === 'returned') {
      return res.status(400).json({ success: false, message: 'Book already returned' });
    }

    const returnDate = new Date();
    const fineAmount = calcFine(borrow.dueDate, returnDate);

    borrow.status = 'returned';
    borrow.returnDate = returnDate;
    borrow.notes = req.body.notes || borrow.notes;
    borrow.fine = {
      amount: fineAmount,
      paid: fineAmount === 0, // auto-mark paid if no fine
      paidDate: fineAmount === 0 ? returnDate : undefined,
    };
    await borrow.save();

    // Restore available copy
    await Book.findByIdAndUpdate(borrow.book, { $inc: { availableCopies: 1 } });

    const populated = await Borrow.findById(borrow._id)
      .populate('book', 'title author isbn')
      .populate('member', 'name email membershipId')
      .populate('issuedBy', 'name');

    res.json({ success: true, data: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── PUT /api/borrows/:id/pay-fine ────────────────────────────────────────────
router.put('/:id/pay-fine', protect, canManage, async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id);
    if (!borrow) return res.status(404).json({ success: false, message: 'Borrow record not found' });

    if (borrow.fine.paid) {
      return res.status(400).json({ success: false, message: 'Fine already paid' });
    }
    if (!borrow.fine.amount || borrow.fine.amount <= 0) {
      return res.status(400).json({ success: false, message: 'No fine to collect' });
    }

    borrow.fine.paid = true;
    borrow.fine.paidDate = new Date();
    borrow.fine.paidBy = req.user._id;
    await borrow.save();

    const populated = await Borrow.findById(borrow._id)
      .populate('book', 'title author isbn')
      .populate('member', 'name email membershipId')
      .populate('issuedBy', 'name')
      .populate('fine.paidBy', 'name');

    res.json({ success: true, data: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
