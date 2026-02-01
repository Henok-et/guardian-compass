import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'officer';
}

const AUTH_KEY = 'au_verification_auth';

// Mock admin credentials
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@au.int': {
    password: 'admin123',
    user: {
      id: 'user-001',
      email: 'admin@au.int',
      name: 'AU Administrator',
      role: 'admin',
    },
  },
  'officer@au.int': {
    password: 'officer123',
    user: {
      id: 'user-002',
      email: 'officer@au.int',
      name: 'Verification Officer',
      role: 'officer',
    },
  },
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const mockUser = MOCK_USERS[email.toLowerCase()];
    if (mockUser && mockUser.password === password) {
      setUser(mockUser.user);
      localStorage.setItem(AUTH_KEY, JSON.stringify(mockUser.user));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
