import client from './client';
import type { User, ApiResponse, MemberFilters } from '../types';

export const getUsers = (filters: MemberFilters = {}) =>
  client.get<ApiResponse<User[]>>('/users', { params: filters });

export const getUser = (id: string) =>
  client.get<ApiResponse<User>>(`/users/${id}`);

export const createUser = (data: Partial<User> & { password: string }) =>
  client.post<ApiResponse<User>>('/users', data);

export const updateUser = (id: string, data: Partial<User>) =>
  client.put<ApiResponse<User>>(`/users/${id}`, data);

export const deleteUser = (id: string) =>
  client.delete<ApiResponse<void>>(`/users/${id}`);

export const getDashboardStats = () =>
  client.get<ApiResponse<Record<string, number>>>('/users/dashboard/stats');
