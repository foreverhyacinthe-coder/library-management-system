const mongoose = require('mongoose');

const borrowSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required'],
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member reference is required'],
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Issuing librarian reference is required'],
    },
    borrowDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    returnDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['borrowed', 'returned', 'overdue'],
      default: 'borrowed',
    },
    // Fine tracking
    fine: {
      amount: { type: Number, default: 0, min: 0 },
      paid: { type: Boolean, default: false },
      paidDate: { type: Date },
      paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    renewalCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: days overdue ───────────────────────────────────────────────────
borrowSchema.virtual('daysOverdue').get(function () {
  if (this.status === 'returned') return 0;
  const now = this.returnDate || new Date();
  const diff = Math.floor((now - this.dueDate) / 86400000);
  return diff > 0 ? diff : 0;
});

// ─── Indexes ─────────────────────────────────────────────────────────────────
borrowSchema.index({ member: 1, status: 1 });
borrowSchema.index({ book: 1, status: 1 });
borrowSchema.index({ dueDate: 1, status: 1 });

module.exports = mongoose.model('Borrow', borrowSchema);
