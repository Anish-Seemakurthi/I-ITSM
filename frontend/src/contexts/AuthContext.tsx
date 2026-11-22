import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import { authApi } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('itsm_token');
    const storedUser = localStorage.getItem('itsm_user');

    if (storedToken && storedUser) {
      try {
        const payload = decodeJwtPayload(storedToken);
        // Check expiry
        if (payload && typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('itsm_token');
          localStorage.removeItem('itsm_user');
        } else {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch {
        localStorage.removeItem('itsm_token');
        localStorage.removeItem('itsm_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const { access_token, user: userData } = response;

    // Merge role from JWT if needed
    let role = userData.role;
    if (!role) {
      const payload = decodeJwtPayload(access_token);
      role = (payload?.role as UserRole) || UserRole.EMPLOYEE;
    }
    const finalUser = { ...userData, role };

    localStorage.setItem('itsm_token', access_token);
    localStorage.setItem('itsm_user', JSON.stringify(finalUser));
    setToken(access_token);
    setUser(finalUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('itsm_token');
    localStorage.removeItem('itsm_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
