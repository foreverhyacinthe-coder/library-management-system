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
    borrowedAt: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    returnedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['borrowed', 'returned', 'overdue'],
      default: 'borrowed',
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    fine: {
      amount: {
        type: Number,
        default: 0,
        min: 0,
      },
      paid: {
        type: Boolean,
        default: false,
      },
      paidAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Calculate fine based on days overdue
borrowSchema.methods.calculateFine = function () {
  if (this.status === 'returned' || this.status === 'overdue') {
    const now = new Date();
    const due = new Date(this.dueDate);
    const returnTime = this.returnedAt ? new Date(this.returnedAt) : now;
    const overdueMs = returnTime - due;
    if (overdueMs <= 0) return 0;
    const overdueDays = Math.ceil(overdueMs / (1000 * 60 * 60 * 24));
    const finePerDay = parseFloat(process.env.FINE_PER_DAY) || 0.5;
    return parseFloat((overdueDays * finePerDay).toFixed(2));
  }
  return 0;
};

module.exports = mongoose.model('Borrow', borrowSchema);