import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSummary, AuthResponse, ForgotPasswordResponse, ResetPasswordResponse } from '@vulnsight/shared-types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserSummary | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string, name?: string) => Promise<AuthResponse>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<ForgotPasswordResponse>;
  resetPassword: (token: string, newPassword: string) => Promise<ResetPasswordResponse>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('qyberveil_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('qyberveil_token');
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await api.auth.getMe();
      setUser(currentUser);
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      localStorage.removeItem('qyberveil_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.auth.login({ email, password });
    localStorage.setItem('qyberveil_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const register = async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    const res = await api.auth.register({ email, password, name });
    localStorage.setItem('qyberveil_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('qyberveil_token');
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (email: string): Promise<ForgotPasswordResponse> => {
    return await api.auth.forgotPassword({ email });
  };

  const resetPassword = async (token: string, newPassword: string): Promise<ResetPasswordResponse> => {
    return await api.auth.resetPassword({ token, newPassword });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
