import { apiAuth, setToken, clearToken, getToken } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface SecurityQuestion {
  question: string;
  answer: string;
}

const REMEMBER_ME_KEY = 'hp_remember_me';

export const authService = {
  async register(
    name: string,
    email: string,
    password: string,
    securityQuestions: SecurityQuestion[]
  ): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiAuth.register(name, email, password, securityQuestions);
      return { success: res.success, message: res.message };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Registration failed.' };
    }
  },

  async login(
    email: string,
    password: string,
    rememberMe: boolean
  ): Promise<{ success: boolean; user?: User; message: string }> {
    try {
      const res = await apiAuth.login(email, password);
      if (res.success && res.token && res.user) {
        setToken(res.token);
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, 'true');
        }
        return {
          success: true,
          user: {
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            avatar: res.user.avatar,
            createdAt: res.user.createdAt,
          },
          message: res.message,
        };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Login failed.' };
    }
  },

  logout() {
    clearToken();
    localStorage.removeItem(REMEMBER_ME_KEY);
  },

  async getCurrentUser(): Promise<User | null> {
    if (!getToken()) return null;
    try {
      const res = await apiAuth.me();
      if (res.success && res.user) {
        return {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          avatar: res.user.avatar,
          createdAt: res.user.createdAt,
        };
      }
      return null;
    } catch {
      return null;
    }
  },

  isRememberMe(): boolean {
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; token?: string }> {
    try {
      const res = await apiAuth.requestReset(email);
      return { success: res.success, message: res.message, token: res.token };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Request failed.' };
    }
  },

  async getSecurityQuestions(email: string): Promise<{ success: boolean; questions?: string[]; message: string }> {
    try {
      const res = await apiAuth.getSecurityQuestions(email);
      return { success: res.success, questions: res.questions, message: res.message };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Request failed.' };
    }
  },

  async verifySecurityAnswers(
    email: string,
    answers: string[]
  ): Promise<{ success: boolean; message: string; token?: string }> {
    try {
      const res = await apiAuth.verifySecurityAnswers(email, answers);
      return { success: res.success, message: res.message, token: res.token };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Verification failed.' };
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiAuth.resetPassword(token, newPassword);
      return { success: res.success, message: res.message };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Reset failed.' };
    }
  },

  async updateProfile(userId: string, updates: Partial<Pick<User, 'name'>>): Promise<{ success: boolean; message: string }> {
    try {
      if (!updates.name) {
        return { success: false, message: 'Name is required.' };
      }
      const res = await apiAuth.updateProfile(updates.name);
      return { success: res.success, message: res.message };
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : 'Update failed.' };
    }
  },
};
