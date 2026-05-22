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

export interface StoredUser extends User {
  password: string;
  securityQuestions: SecurityQuestion[];
  resetToken?: string;
  resetTokenExpiry?: string;
}

const USERS_KEY = 'hp_users';
const CURRENT_USER_KEY = 'hp_current_user';
const REMEMBER_ME_KEY = 'hp_remember_me';

function getUsers(): StoredUser[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateToken(): string {
  return Math.random().toString(36).substring(2, 18) + Date.now().toString(36);
}

export const authService = {
  register(
    name: string,
    email: string,
    password: string,
    securityQuestions: SecurityQuestion[]
  ): { success: boolean; message: string } {
    const users = getUsers();
    const normalizedEmail = email.toLowerCase().trim();

    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newUser: StoredUser = {
      id: generateId(),
      name: name.trim(),
      email: normalizedEmail,
      password,
      securityQuestions: securityQuestions.map((sq) => ({
        question: sq.question,
        answer: sq.answer.toLowerCase().trim(),
      })),
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    return { success: true, message: 'Account created successfully!' };
  },

  login(email: string, password: string, rememberMe: boolean): { success: boolean; user?: User; message: string } {
    const users = getUsers();
    const normalizedEmail = email.toLowerCase().trim();
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return { success: false, message: 'No account found with this email address.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    const { password: _, resetToken, resetTokenExpiry, securityQuestions, ...safeUser } = user;

    const sessionUser = {
      ...safeUser,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(safeUser.name)}&background=ab3500&color=fff`,
    };

    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));

    return { success: true, user: sessionUser, message: 'Welcome back!' };
  },

  logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
  },

  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  isRememberMe(): boolean {
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  },

  requestPasswordReset(email: string): { success: boolean; message: string; token?: string } {
    const users = getUsers();
    const normalizedEmail = email.toLowerCase().trim();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);

    if (userIndex === -1) {
      return { success: false, message: 'No account found with this email address.' };
    }

    const token = generateToken();
    users[userIndex].resetToken = token;
    users[userIndex].resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour
    saveUsers(users);

    return {
      success: true,
      message: 'Reset link sent! Use the code below to reset your password.',
      token,
    };
  },

  getSecurityQuestions(email: string): { success: boolean; questions?: string[]; message: string } {
    const users = getUsers();
    const normalizedEmail = email.toLowerCase().trim();
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      return { success: false, message: 'No account found with this email address.' };
    }

    return {
      success: true,
      questions: user.securityQuestions.map((sq) => sq.question),
      message: 'Security questions retrieved.',
    };
  },

  verifySecurityAnswers(email: string, answers: string[]): { success: boolean; message: string; token?: string } {
    const users = getUsers();
    const normalizedEmail = email.toLowerCase().trim();
    const userIndex = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);

    if (userIndex === -1) {
      return { success: false, message: 'No account found with this email address.' };
    }

    const user = users[userIndex];
    const normalizedAnswers = answers.map((a) => a.toLowerCase().trim());

    const allCorrect = user.securityQuestions.every((sq, idx) => sq.answer === normalizedAnswers[idx]);

    if (!allCorrect) {
      return { success: false, message: 'One or more answers are incorrect.' };
    }

    const token = generateToken();
    users[userIndex].resetToken = token;
    users[userIndex].resetTokenExpiry = new Date(Date.now() + 3600000).toISOString();
    saveUsers(users);

    return {
      success: true,
      message: 'Answers verified! You can now reset your password.',
      token,
    };
  },

  resetPassword(token: string, newPassword: string): { success: boolean; message: string } {
    const users = getUsers();
    const userIndex = users.findIndex((u) => u.resetToken === token);

    if (userIndex === -1) {
      return { success: false, message: 'Invalid or expired reset token.' };
    }

    const expiry = new Date(users[userIndex].resetTokenExpiry!);
    if (expiry < new Date()) {
      return { success: false, message: 'Reset token has expired. Please request a new one.' };
    }

    users[userIndex].password = newPassword;
    users[userIndex].resetToken = undefined;
    users[userIndex].resetTokenExpiry = undefined;
    saveUsers(users);

    return { success: true, message: 'Password reset successfully! You can now log in.' };
  },

  updateProfile(userId: string, updates: Partial<Pick<User, 'name'>>): { success: boolean; message: string } {
    const users = getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      return { success: false, message: 'User not found.' };
    }

    if (updates.name) {
      users[userIndex].name = updates.name.trim();
    }

    saveUsers(users);

    // Update current session
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      const updated = { ...current, ...updates };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
    }

    return { success: true, message: 'Profile updated successfully.' };
  },
};
