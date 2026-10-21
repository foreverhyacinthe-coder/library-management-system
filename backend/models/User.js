const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Counter for membership ID sequence ────────────────────────────────────
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.model('Counter', counterSchema);

// ─── User schema ────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned by default
    },
    role: {
      type: String,
      enum: ['admin', 'librarian', 'member'],
      default: 'member',
    },
    membershipId: {
      type: String,
      unique: true,
      sparse: true,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    // Password reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Auto-generate membership ID before saving ──────────────────────────────
userSchema.pre('save', async function (next) {
  // Hash password only when modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Generate membershipId only for members on first save
  if (this.isNew && this.role === 'member' && !this.membershipId) {
    const year = new Date().getFullYear();
    const counter = await Counter.findByIdAndUpdate(
      `membershipId_${year}`,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.membershipId = `LMS-${year}-${String(counter.seq).padStart(3, '0')}`;
  }

  next();
});

// ─── Instance method: compare password ──────────────────────────────────────
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

// ─── Virtual: borrow count (populated elsewhere) ────────────────────────────
userSchema.virtual('borrowCount', {
  ref: 'Borrow',
  localField: '_id',
  foreignField: 'member',
  count: true,
});

module.exports = mongoose.model('User', userSchema);
