import client from './client';
import type { Borrow, ApiResponse, BorrowFilters } from '../types';

export const getBorrows = (filters: BorrowFilters = {}) =>
  client.get<ApiResponse<Borrow[]>>('/borrows', { params: filters });

export const getMyBorrows = () =>
  client.get<ApiResponse<Borrow[]>>('/borrows/my');

export const issueBorrow = (bookId: string, memberId: string, dueDate?: string) =>
  client.post<ApiResponse<Borrow>>('/borrows', { book: bookId, member: memberId, dueDate });

export const returnBorrow = (id: string, notes?: string) =>
  client.put<ApiResponse<Borrow>>(`/borrows/${id}/return`, { notes });

export const payFine = (id: string) =>
  client.put<ApiResponse<Borrow>>(`/borrows/${id}/pay-fine`);

export const getBorrow = (id: string) =>
  client.get<ApiResponse<Borrow>>(`/borrows/${id}`);

export const getOverdue = () =>
  client.get<ApiResponse<Borrow[]>>('/borrows/overdue');
