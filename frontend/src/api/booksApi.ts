import client from './client';
import type { Book, ApiResponse, BookFilters } from '../types';

export const getBooks = (filters: BookFilters = {}) =>
  client.get<ApiResponse<Book[]>>('/books', { params: filters });

export const getBook = (id: string) =>
  client.get<ApiResponse<Book>>(`/books/${id}`);

export const createBook = (data: Partial<Book>) =>
  client.post<ApiResponse<Book>>('/books', data);

export const updateBook = (id: string, data: Partial<Book>) =>
  client.put<ApiResponse<Book>>(`/books/${id}`, data);

export const deleteBook = (id: string) =>
  client.delete<ApiResponse<void>>(`/books/${id}`);

export const searchBooks = (query: string) =>
  client.get<ApiResponse<Book[]>>('/books/search', { params: { q: query } });
