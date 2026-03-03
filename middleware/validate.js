const Joi = require('joi');

// Generic validator factory
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => d.message.replace(/"/g, "'"));
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
  next();
};

// ── Auth Schemas ────────────────────────────────────────────────
const registerSchema = Joi.object({
  name:     Joi.string().min(2).max(100).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone:    Joi.string().optional().allow(''),
  address:  Joi.string().optional().allow(''),
  role:     Joi.string().valid('member', 'librarian', 'admin').default('member'),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

// ── Book Schemas ────────────────────────────────────────────────
const bookSchema = Joi.object({
  title:         Joi.string().max(200).required(),
  author:        Joi.string().required(),
  isbn:          Joi.string().required(),
  genre: Joi.string().valid(
    'Fiction', 'Non-Fiction', 'Science', 'Technology', 'History',
    'Biography', 'Children', 'Fantasy', 'Mystery', 'Romance',
    'Self-Help', 'Philosophy', 'Art', 'Other'
  ).required(),
  description:   Joi.string().max(1000).optional().allow(''),
  publisher:     Joi.string().optional().allow(''),
  publishedYear: Joi.number().min(1000).max(new Date().getFullYear()).optional(),
  totalCopies:   Joi.number().min(1).default(1),
  location:      Joi.string().optional().allow(''),
  coverImage:    Joi.string().uri().optional().allow(''),
});

const updateBookSchema = bookSchema.fork(
  ['title', 'author', 'isbn', 'genre'],
  (field) => field.optional()
);

// ── Borrow Schemas ──────────────────────────────────────────────
const borrowSchema = Joi.object({
  bookId:  Joi.string().hex().length(24).required(),
  userId:  Joi.string().hex().length(24).optional(), // librarian can specify
  dueDate: Joi.date().greater('now').required(),
  notes:   Joi.string().max(500).optional().allow(''),
});

const returnSchema = Joi.object({
  notes: Joi.string().max(500).optional().allow(''),
});

// ── User Update Schema ──────────────────────────────────────────
const updateUserSchema = Joi.object({
  name:    Joi.string().min(2).max(100).optional(),
  phone:   Joi.string().optional().allow(''),
  address: Joi.string().optional().allow(''),
});

module.exports = {
  validate,
  schemas: {
    register: registerSchema,
    login: loginSchema,
    book: bookSchema,
    updateBook: updateBookSchema,
    borrow: borrowSchema,
    return: returnSchema,
    updateUser: updateUserSchema,
  },
};