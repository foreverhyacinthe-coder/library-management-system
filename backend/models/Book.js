const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      maxlength: [150, 'Author name cannot exceed 150 characters'],
    },
    isbn: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    publisher: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    publishYear: {
      type: Number,
      min: [1000, 'Invalid year'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      min: [1, 'Must have at least 1 copy'],
      default: 1,
    },
    availableCopies: {
      type: Number,
      min: [0, 'Available copies cannot be negative'],
    },
    location: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      trim: true,
      default: 'English',
      maxlength: 50,
    },
    pages: {
      type: Number,
      min: 1,
    },
    tags: [{ type: String, trim: true }],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Set availableCopies = totalCopies on first save ────────────────────────
bookSchema.pre('save', function (next) {
  if (this.isNew && this.availableCopies === undefined) {
    this.availableCopies = this.totalCopies;
  }
  next();
});

// ─── Text index for search ───────────────────────────────────────────────────
bookSchema.index({ title: 'text', author: 'text', isbn: 'text', category: 'text' });

// ─── Virtual: borrow count ───────────────────────────────────────────────────
bookSchema.virtual('borrowCount', {
  ref: 'Borrow',
  localField: '_id',
  foreignField: 'book',
  count: true,
});

module.exports = mongoose.model('Book', bookSchema);
