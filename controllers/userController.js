const User = require('../models/User');
const Borrow = require('../models/Borrow');

// GET /api/users  — admin/librarian only
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (role)   query.role = role;
    if (search) query.$or = [
      { name:  { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { membershipId: { $regex: search, $options: 'i' } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / limit), users });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id  — update own profile (or admin updates any)
exports.updateUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;

    // Members can only update themselves
    if (req.user.role === 'member' && req.user._id.toString() !== targetId) {
      return res.status(403).json({ success: false, message: 'You can only edit your own profile.' });
    }

    const allowedFields = ['name', 'phone', 'address'];

    // Admins can also change role and isActive
    if (['admin', 'librarian'].includes(req.user.role)) {
      allowedFields.push('role', 'isActive');
    }

    const update = {};
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(targetId, update, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, message: 'Profile updated.', user });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id  — admin only (soft delete)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'Member account deactivated.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id/borrows — borrow history for a member
exports.getUserBorrows = async (req, res, next) => {
  try {
    const targetId = req.params.id;

    if (req.user.role === 'member' && req.user._id.toString() !== targetId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const borrows = await Borrow.find({ user: targetId })
      .populate('book', 'title author isbn')
      .sort('-borrowedAt');

    res.json({ success: true, count: borrows.length, borrows });
  } catch (err) {
    next(err);
  }
};