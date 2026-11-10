import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, getAuthToken, setAuthToken, clearAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('aurelia_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      if (storedToken) {
        try {
          const profile = await api.getCurrentUser();
          setUser(profile);
          localStorage.setItem('aurelia_user', JSON.stringify(profile));
        } catch {
          clearAuthToken();
          setUser(null);
          setTokenState(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setAuthToken(res.access_token);
    setTokenState(res.access_token);
    setUser(res.user);
    localStorage.setItem('aurelia_user', JSON.stringify(res.user));
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    setTokenState(null);
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    if (user.role === 'PLATFORM_ADMIN') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
