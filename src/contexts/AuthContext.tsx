import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, type User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => { success: boolean; message: string };
  register: (
    name: string,
    email: string,
    password: string,
    securityQuestions: { question: string; answer: string }[]
  ) => { success: boolean; message: string };
  logout: () => void;
  requestPasswordReset: (email: string) => { success: boolean; message: string; token?: string };
  getSecurityQuestions: (email: string) => { success: boolean; questions?: string[]; message: string };
  verifySecurityAnswers: (email: string, answers: string[]) => { success: boolean; message: string; token?: string };
  resetPassword: (token: string, newPassword: string) => { success: boolean; message: string };
  updateProfile: (userId: string, updates: Partial<Pick<User, 'name'>>) => { success: boolean; message: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = useCallback((email: string, password: string, rememberMe: boolean) => {
    const result = authService.login(email, password, rememberMe);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const register = useCallback(
    (name: string, email: string, password: string, securityQuestions: { question: string; answer: string }[]) => {
      return authService.register(name, email, password, securityQuestions);
    },
    []
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const requestPasswordReset = useCallback((email: string) => {
    return authService.requestPasswordReset(email);
  }, []);

  const getSecurityQuestions = useCallback((email: string) => {
    return authService.getSecurityQuestions(email);
  }, []);

  const verifySecurityAnswers = useCallback((email: string, answers: string[]) => {
    return authService.verifySecurityAnswers(email, answers);
  }, []);

  const resetPassword = useCallback((token: string, newPassword: string) => {
    return authService.resetPassword(token, newPassword);
  }, []);

  const updateProfile = useCallback((userId: string, updates: Partial<Pick<User, 'name'>>) => {
    const result = authService.updateProfile(userId, updates);
    if (result.success) {
      const current = authService.getCurrentUser();
      setUser(current);
    }
    return result;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        requestPasswordReset,
        getSecurityQuestions,
        verifySecurityAnswers,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
