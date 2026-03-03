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
        'Fiction', 'Non-Fiction', 'Science', 'Technology', 'History',
        'Biography', 'Children', 'Fantasy', 'Mystery', 'Romance',
        'Self-Help', 'Philosophy', 'Art', 'Other',
      ],
    },
    description: { type: String, maxlength: 1000 },
    publisher: { type: String, trim: true },
    publishedYear: {
      type: Number,
      min: 1000,
      max: new Date().getFullYear(),
    },
    totalCopies: {
      type: Number,
      required: [true, 'Total copies is required'],
      min: [1, 'At least 1 copy required'],
      default: 1,
    },
    availableCopies: {
      type: Number,
      min: 0,
    },
    location: { type: String, trim: true }, // Shelf/section info
    coverImage: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Set availableCopies = totalCopies on create
bookSchema.pre('save', function (next) {
  if (this.isNew) {
    this.availableCopies = this.totalCopies;
  }
  next();
});

// Text index for search
bookSchema.index({ title: 'text', author: 'text', isbn: 'text' });

module.exports = mongoose.model('Book', bookSchema);