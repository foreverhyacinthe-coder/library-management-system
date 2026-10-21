import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import * as authApi from '../api/authApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isLibrarian: boolean;
  isMember: boolean;
  canManage: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function normalizeUser(u: User): User {
  return { ...u, _id: u._id || (u as unknown as { id?: string }).id || '' };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('esomero_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authApi.getMe()
        .then(res => {
          const data = res.data;
          const u = data.data || data.user;
          if (u) setUser(normalizeUser(u));
        })
        .catch(() => {
          localStorage.removeItem('esomero_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const data = res.data;
    const tok = data.token!;
    const u = normalizeUser((data.data || data.user)!);
    localStorage.setItem('esomero_token', tok);
    setToken(tok);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('esomero_token');
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isLibrarian = user?.role === 'librarian';
  const isMember = user?.role === 'member';
  const canManage = isAdmin || isLibrarian;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isLibrarian, isMember, canManage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
