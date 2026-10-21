/**
 * eSomero – Database Seed Script
 * --------------------------------
 * Usage:  node scripts/seed.js
 *
 * Creates:
 *   • 1 admin account
 *   • 1 librarian account
 *   • 3 member accounts
 *   • 20 sample books across 5 categories
 *   • 6 borrow records (mix of active / returned / overdue)
 *
 * ⚠️  This script DROPS all existing data. Run only on a fresh database.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Borrow = require('../models/Borrow');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/esomero';

// ─── Seed data ────────────────────────────────────────────────────────────────

const users = [
  {
    name: 'Admin User',
    email: 'admin@esomero.com',
    password: 'Admin@123',
    role: 'admin',
    phone: '+254 700 000 001',
  },
  {
    name: 'Jane Librarian',
    email: 'librarian@esomero.com',
    password: 'Lib@123',
    role: 'librarian',
    phone: '+254 700 000 002',
  },
  {
    name: 'Alice Kamau',
    email: 'alice@example.com',
    password: 'Member@123',
    role: 'member',
    phone: '+254 712 345 678',
    address: '12 Westlands Ave, Nairobi',
  },
  {
    name: 'Brian Ochieng',
    email: 'brian@example.com',
    password: 'Member@123',
    role: 'member',
    phone: '+254 723 456 789',
    address: '8 Mombasa Road, Nairobi',
  },
  {
    name: 'Carol Wanjiku',
    email: 'carol@example.com',
    password: 'Member@123',
    role: 'member',
    phone: '+254 734 567 890',
    address: '5 Ngong Road, Nairobi',
  },
];

const books = [
  // Fiction
  { title: 'Things Fall Apart', author: 'Chinua Achebe', isbn: '978-0385474542', category: 'Fiction', publisher: 'Anchor Books', publishYear: 1958, totalCopies: 5, description: 'A classic Nigerian novel about the life of Okonkwo, a leader in the Igbo community.' },
  { title: 'Half of a Yellow Sun', author: 'Chimamanda Ngozi Adichie', isbn: '978-1400044163', category: 'Fiction', publisher: 'Knopf', publishYear: 2006, totalCopies: 4, description: 'A powerful novel set during the Biafran war in Nigeria.' },
  { title: 'Weep Not, Child', author: 'Ngũgĩ wa Thiongʼo', isbn: '978-0143106692', category: 'Fiction', publisher: 'Penguin', publishYear: 1964, totalCopies: 3 },
  { title: 'The River Between', author: 'Ngũgĩ wa Thiongʼo', isbn: '978-0435908188', category: 'Fiction', publisher: 'Heinemann', publishYear: 1965, totalCopies: 3 },
  { title: 'A Grain of Wheat', author: 'Ngũgĩ wa Thiongʼo', isbn: '978-0143105244', category: 'Fiction', publisher: 'Penguin', publishYear: 1967, totalCopies: 2 },
  // Science
  { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '978-0553380163', category: 'Science', publisher: 'Bantam Books', publishYear: 1988, totalCopies: 4 },
  { title: 'The Selfish Gene', author: 'Richard Dawkins', isbn: '978-0198788607', category: 'Science', publisher: 'Oxford University Press', publishYear: 1976, totalCopies: 3 },
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '978-0062316097', category: 'History', publisher: 'Harper', publishYear: 2011, totalCopies: 5 },
  // Technology
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0132350884', category: 'Technology', publisher: 'Prentice Hall', publishYear: 2008, totalCopies: 4 },
  { title: 'The Pragmatic Programmer', author: 'David Thomas & Andrew Hunt', isbn: '978-0135957059', category: 'Technology', publisher: 'Addison-Wesley', publishYear: 2019, totalCopies: 3 },
  { title: 'Design Patterns', author: 'Gang of Four', isbn: '978-0201633610', category: 'Technology', publisher: 'Addison-Wesley', publishYear: 1994, totalCopies: 2 },
  // Business
  { title: 'Rich Dad Poor Dad', author: 'Robert T. Kiyosaki', isbn: '978-1612680194', category: 'Business', publisher: 'Plata Publishing', publishYear: 1997, totalCopies: 6 },
  { title: 'The Lean Startup', author: 'Eric Ries', isbn: '978-0307887894', category: 'Business', publisher: 'Crown Business', publishYear: 2011, totalCopies: 4 },
  { title: 'Zero to One', author: 'Peter Thiel', isbn: '978-0804139021', category: 'Business', publisher: 'Crown Business', publishYear: 2014, totalCopies: 3 },
  { title: 'Good to Great', author: 'Jim Collins', isbn: '978-0066620992', category: 'Business', publisher: 'Harper Business', publishYear: 2001, totalCopies: 3 },
  // Self-help
  { title: 'Atomic Habits', author: 'James Clear', isbn: '978-0735211292', category: 'Self-Help', publisher: 'Avery', publishYear: 2018, totalCopies: 7 },
  { title: 'The Power of Now', author: 'Eckhart Tolle', isbn: '978-1577314806', category: 'Self-Help', publisher: 'New World Library', publishYear: 1997, totalCopies: 4 },
  { title: 'Man\'s Search for Meaning', author: 'Viktor E. Frankl', isbn: '978-0807014271', category: 'Self-Help', publisher: 'Beacon Press', publishYear: 1946, totalCopies: 3 },
  { title: 'Think and Grow Rich', author: 'Napoleon Hill', isbn: '978-1585424337', category: 'Self-Help', publisher: 'Tarcher', publishYear: 1937, totalCopies: 4 },
  { title: '7 Habits of Highly Effective People', author: 'Stephen R. Covey', isbn: '978-0743269513', category: 'Self-Help', publisher: 'Free Press', publishYear: 1989, totalCopies: 5 },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  try {
    console.log('🔗  Connecting to MongoDB…');
    await mongoose.connect(MONGO_URI);
    console.log('✅  Connected');

    // Clear existing data
    console.log('🗑️   Clearing existing data…');
    await Promise.all([
      User.deleteMany({}),
      Book.deleteMany({}),
      Borrow.deleteMany({}),
      mongoose.connection.collection('counters').deleteMany({}),
    ]);

    // Create users
    console.log('👤  Creating users…');
    const createdUsers = await User.create(users);
    const admin     = createdUsers.find(u => u.role === 'admin');
    const librarian = createdUsers.find(u => u.role === 'librarian');
    const members   = createdUsers.filter(u => u.role === 'member');

    // Create books
    console.log('📚  Creating books…');
    const createdBooks = await Book.create(books);

    // Create borrow records
    console.log('📖  Creating borrow records…');
    const now = new Date();
    const daysAgo = (n) => new Date(now.getTime() - n * 86400000);
    const daysFromNow = (n) => new Date(now.getTime() + n * 86400000);

    const borrows = [
      // Active borrow – due in 10 days
      {
        book: createdBooks[0]._id,
        member: members[0]._id,
        issuedBy: librarian._id,
        borrowDate: daysAgo(4),
        dueDate: daysFromNow(10),
        status: 'borrowed',
      },
      // Active borrow – due in 2 days (due soon)
      {
        book: createdBooks[7]._id,
        member: members[0]._id,
        issuedBy: librarian._id,
        borrowDate: daysAgo(12),
        dueDate: daysFromNow(2),
        status: 'borrowed',
      },
      // Overdue borrow – 5 days overdue, fine not paid
      {
        book: createdBooks[15]._id,
        member: members[1]._id,
        issuedBy: librarian._id,
        borrowDate: daysAgo(19),
        dueDate: daysAgo(5),
        status: 'overdue',
        fine: { amount: 5 * 0.5, paid: false },
      },
      // Returned – no fine
      {
        book: createdBooks[9]._id,
        member: members[1]._id,
        issuedBy: admin._id,
        borrowDate: daysAgo(20),
        dueDate: daysAgo(6),
        returnDate: daysAgo(7),
        status: 'returned',
        fine: { amount: 0, paid: true },
      },
      // Returned – fine paid
      {
        book: createdBooks[11]._id,
        member: members[2]._id,
        issuedBy: librarian._id,
        borrowDate: daysAgo(30),
        dueDate: daysAgo(16),
        returnDate: daysAgo(10),
        status: 'returned',
        fine: { amount: 6 * 0.5, paid: true, paidDate: daysAgo(10), paidBy: librarian._id },
      },
      // Active borrow – due in 5 days
      {
        book: createdBooks[16]._id,
        member: members[2]._id,
        issuedBy: librarian._id,
        borrowDate: daysAgo(9),
        dueDate: daysFromNow(5),
        status: 'borrowed',
      },
    ];

    await Borrow.create(borrows);

    // Adjust book availability
    await Book.findByIdAndUpdate(createdBooks[0]._id, { $inc: { availableCopies: -1 } });
    await Book.findByIdAndUpdate(createdBooks[7]._id, { $inc: { availableCopies: -1 } });
    await Book.findByIdAndUpdate(createdBooks[15]._id, { $inc: { availableCopies: -1 } });
    await Book.findByIdAndUpdate(createdBooks[16]._id, { $inc: { availableCopies: -1 } });

    console.log('\n✅  Seed complete!\n');
    console.log('─────────────────────────────────────────');
    console.log('  🔐 Login credentials');
    console.log('─────────────────────────────────────────');
    console.log('  Admin     admin@esomero.com   / Admin@123');
    console.log('  Librarian librarian@esomero.com / Lib@123');
    console.log('  Member    alice@example.com  / Member@123');
    console.log('  Member    brian@example.com  / Member@123');
    console.log('  Member    carol@example.com  / Member@123');
    console.log('─────────────────────────────────────────\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌  Seed failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();
