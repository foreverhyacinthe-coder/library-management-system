import client from './client';
import type { User, ApiResponse } from '../types';

export const register = (name: string, email: string, password: string) =>
  client.post<ApiResponse<User>>('/auth/register', { name, email, password });

export const login = (email: string, password: string) =>
  client.post<ApiResponse<User>>('/auth/login', { email, password });

export const getMe = () =>
  client.get<ApiResponse<User>>('/auth/me');

export const changePassword = (currentPassword: string, newPassword: string) =>
  client.put('/auth/change-password', { currentPassword, newPassword });
