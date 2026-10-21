const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Protect: verify JWT ────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorised – no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// ─── Admin only ─────────────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// ─── Admin or Librarian ──────────────────────────────────────────────────────
const canManage = (req, res, next) => {
  if (!['admin', 'librarian'].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Librarian or admin access required' });
  }
  next();
};

// ─── Signed-in user can only access their own data, unless staff ─────────────
const selfOrManage = (req, res, next) => {
  const isStaff = ['admin', 'librarian'].includes(req.user?.role);
  const isSelf = req.user?._id.toString() === req.params.id;

  if (!isStaff && !isSelf) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
};

module.exports = { protect, adminOnly, canManage, selfOrManage };
