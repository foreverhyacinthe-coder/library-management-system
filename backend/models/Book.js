const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      enum: [
        'Fiction',
        'Non-Fiction',
        'Science',
        'Technology',
        'History',
        'Biography',
        'Children',
        'Fantasy',
        'Mystery',
        'Romance',
        'Self-Help',
        'Philosophy',
        'Art',
        'Other',
      ],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },
    publisher: {
      type: String,
      trim: true,
      default: '',
    },
    publishedYear: {
      type: Number,
      min: 1000,
      max: new Date().getFullYear(),
    },
    totalCopies: {
      type: Number,
      default: 1,
      min: 1,
    },
    availableCopies: {
      type: Number,
      default: 1,
      min: 0,
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    coverImage: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Full-text search index
bookSchema.index({ title: 'text', author: 'text', isbn: 'text' });

module.exports = mongoose.model('Book', bookSchema);