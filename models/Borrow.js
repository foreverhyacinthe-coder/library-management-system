const mongoose = require('mongoose');

const borrowSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book is required'],
    },
    borrowedAt: { type: Date, default: Date.now },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    returnedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ['borrowed', 'returned', 'overdue'],
      default: 'borrowed',
    },
    fine: {
      amount: { type: Number, default: 0 },
      paid: { type: Boolean, default: false },
      paidAt: { type: Date },
    },
    notes: { type: String, maxlength: 500 },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // The librarian who issued the book
    },
  },
  { timestamps: true }
);

// Auto-mark as overdue
borrowSchema.methods.calculateFine = function () {
  if (this.status === 'returned' || !this.dueDate) return 0;
  const now = new Date();
  if (now <= this.dueDate) return 0;
  const daysLate = Math.ceil((now - this.dueDate) / (1000 * 60 * 60 * 24));
  const ratePerDay = parseFloat(process.env.FINE_PER_DAY) || 0.5;
  return parseFloat((daysLate * ratePerDay).toFixed(2));
};

module.exports = mongoose.model('Borrow', borrowSchema);