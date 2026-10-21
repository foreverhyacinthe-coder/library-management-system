const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Borrow = require('../models/Borrow');
const { protect, adminOnly, canManage, selfOrManage } = require('../middleware/auth');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg });
  }
  next();
};

// ─── GET /api/users/dashboard/stats  (MUST come before /:id) ─────────────────
router.get('/dashboard/stats', protect, canManage, async (req, res) => {
  try {
    const [totalBooks, totalMembers, issuedBooks, overdueBooks, fineData] = await Promise.all([
      require('../models/Book').countDocuments({ isActive: true }),
      User.countDocuments({ role: 'member', isActive: true }),
      Borrow.countDocuments({ status: 'borrowed' }),
      Borrow.countDocuments({ status: 'overdue' }),
      Borrow.aggregate([
        { $match: { 'fine.paid': true } },
        { $group: { _id: null, total: { $sum: '$fine.amount' } } },
      ]),
    ]);

    const collectedFines = fineData[0]?.total ?? 0;

    res.json({
      success: true,
      data: { totalBooks, totalMembers, issuedBooks, overdueBooks, collectedFines },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET /api/users ──────────────────────────────────────────────────────────
router.get('/', protect, canManage, async (req, res) => {
  try {
    const { role, search, isActive, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ name: re }, { email: re }, { membershipId: re }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, data: users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET /api/users/:id ──────────────────────────────────────────────────────
router.get('/:id', protect, selfOrManage, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── POST /api/users ─────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  canManage,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'librarian', 'member']).withMessage('Invalid role'),
  ],
  validate,
  async (req, res) => {
    try {
      // Only admins can create non-member users
      if (req.body.role && req.body.role !== 'member' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Only admins can create staff accounts' });
      }

      const existing = await User.findOne({ email: req.body.email });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }

      const user = await User.create(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ─── PUT /api/users/:id ──────────────────────────────────────────────────────
router.put('/:id', protect, selfOrManage, async (req, res) => {
  try {
    // Prevent escalating role unless admin
    if (req.body.role && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only admins can change user roles' });
    }

    // Don't allow password updates through this endpoint
    delete req.body.password;

    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: user });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── DELETE /api/users/:id ───────────────────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Check for active borrows
    const activeBorrows = await Borrow.countDocuments({
      member: req.params.id,
      status: { $in: ['borrowed', 'overdue'] },
    });
    if (activeBorrows > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: member has ${activeBorrows} active borrow(s). Return all books first.`,
      });
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
