export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'librarian' | 'member';
  membershipId?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  description?: string;
  totalCopies: number;
  availableCopies: number;
  publishedYear?: number;
  publisher?: string;
  language?: string;
  coverImage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Borrow {
  _id: string;
  book: Book | string;
  member: User | string;
  issuedBy?: User | string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'returned' | 'overdue';
  notes?: string;
  fine: {
    amount: number;
    paid: boolean;
    paidDate?: string;
    paidBy?: string | { _id: string; name: string };
  };
  renewalCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Fine {
  _id: string;
  borrow: Borrow | string;
  member: User | string;
  amount: number;
  paid: boolean;
  paidDate?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalBooks: number;
  totalMembers: number;
  issuedBooks: number;
  overdueBooks: number;
  totalFines: number;
  collectedFines: number;
  availableBooks: number;
  newMembersThisMonth: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  token?: string;
  user?: User;
  total?: number;
  page?: number;
  pages?: number;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export interface BookFilters {
  search?: string;
  genre?: string;
  available?: boolean;
  page?: number;
  limit?: number;
}

export interface MemberFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface BorrowFilters {
  status?: string;
  member?: string;
  page?: number;
  limit?: number;
}
