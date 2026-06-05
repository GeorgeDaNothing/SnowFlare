import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { generateToken as generateJwt, authMiddleware, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const SALT_ROUNDS = 12;

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateResetToken(): string {
  return Math.random().toString(36).substring(2, 18) + Date.now().toString(36);
}

// ============================================
// POST /api/auth/register
// ============================================
router.post('/register', (req, res) => {
  const { name, email, password, securityQuestions } = req.body;

  if (!name || !email || !password || !Array.isArray(securityQuestions) || securityQuestions.length === 0) {
    res.status(400).json({ success: false, message: 'Missing required fields.' });
    return;
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const trimmedName = String(name).trim();

  const existing = db.prepare('SELECT 1 FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
  const id = generateId();
  const sqJson = JSON.stringify(
    securityQuestions.map((sq: { question: string; answer: string }) => ({
      question: String(sq.question).trim(),
      answer: String(sq.answer).toLowerCase().trim(),
    }))
  );

  db.prepare(
    `INSERT INTO users (id, email, password_hash, name, security_questions_json)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, normalizedEmail, passwordHash, trimmedName, sqJson);

  res.status(201).json({ success: true, message: 'Account created successfully!' });
});

// ============================================
// POST /api/auth/login
// ============================================
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required.' });
    return;
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as
    | {
        id: string;
        email: string;
        password_hash: string;
        name: string;
        created_at: string;
        security_questions_json: string;
        reset_token: string | null;
        reset_token_expiry: string | null;
      }
    | undefined;

  if (!row) {
    res.status(401).json({ success: false, message: 'No account found with this email address.' });
    return;
  }

  if (!bcrypt.compareSync(password, row.password_hash)) {
    res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    return;
  }

  const token = generateJwt(row.id);

  res.json({
    success: true,
    message: 'Welcome back!',
    token,
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=ab3500&color=fff`,
      createdAt: row.created_at,
    },
  });
});

// ============================================
// GET /api/auth/me
// ============================================
router.get('/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  const row = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.userId!) as
    | { id: string; email: string; name: string; created_at: string }
    | undefined;

  if (!row) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  res.json({
    success: true,
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=ab3500&color=fff`,
      createdAt: row.created_at,
    },
  });
});

// ============================================
// POST /api/auth/request-reset
// ============================================
router.post('/request-reset', (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: 'Email is required.' });
    return;
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const row = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail) as { id: string } | undefined;

  if (!row) {
    res.status(404).json({ success: false, message: 'No account found with this email address.' });
    return;
  }

  const token = generateResetToken();
  const expiry = new Date(Date.now() + 3600000).toISOString();

  db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?').run(token, expiry, row.id);

  res.json({
    success: true,
    message: 'Reset link sent! Use the code below to reset your password.',
    token,
  });
});

// ============================================
// POST /api/auth/security-questions
// ============================================
router.post('/security-questions', (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: 'Email is required.' });
    return;
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const row = db.prepare('SELECT security_questions_json FROM users WHERE email = ?').get(normalizedEmail) as
    | { security_questions_json: string }
    | undefined;

  if (!row) {
    res.status(404).json({ success: false, message: 'No account found with this email address.' });
    return;
  }

  const questions = JSON.parse(row.security_questions_json).map((sq: { question: string }) => sq.question);
  res.json({ success: true, questions, message: 'Security questions retrieved.' });
});

// ============================================
// POST /api/auth/verify-security-answers
// ============================================
router.post('/verify-security-answers', (req, res) => {
  const { email, answers } = req.body;
  if (!email || !Array.isArray(answers)) {
    res.status(400).json({ success: false, message: 'Email and answers are required.' });
    return;
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const row = db.prepare('SELECT id, security_questions_json FROM users WHERE email = ?').get(normalizedEmail) as
    | { id: string; security_questions_json: string }
    | undefined;

  if (!row) {
    res.status(404).json({ success: false, message: 'No account found with this email address.' });
    return;
  }

  const stored = JSON.parse(row.security_questions_json) as { question: string; answer: string }[];
  const normalizedAnswers = answers.map((a: string) => String(a).toLowerCase().trim());
  const allCorrect = stored.every((sq, idx) => sq.answer === normalizedAnswers[idx]);

  if (!allCorrect) {
    res.status(401).json({ success: false, message: 'One or more answers are incorrect.' });
    return;
  }

  const token = generateResetToken();
  const expiry = new Date(Date.now() + 3600000).toISOString();
  db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?').run(token, expiry, row.id);

  res.json({
    success: true,
    message: 'Answers verified! You can now reset your password.',
    token,
  });
});

// ============================================
// POST /api/auth/reset-password
// ============================================
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    res.status(400).json({ success: false, message: 'Token and new password are required.' });
    return;
  }

  const row = db.prepare('SELECT id, reset_token_expiry FROM users WHERE reset_token = ?').get(token) as
    | { id: string; reset_token_expiry: string }
    | undefined;

  if (!row) {
    res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    return;
  }

  if (new Date(row.reset_token_expiry) < new Date()) {
    res.status(400).json({ success: false, message: 'Reset token has expired. Please request a new one.' });
    return;
  }

  const passwordHash = bcrypt.hashSync(newPassword, SALT_ROUNDS);
  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?').run(
    passwordHash,
    row.id
  );

  res.json({ success: true, message: 'Password reset successfully! You can now log in.' });
});

// ============================================
// PATCH /api/auth/profile
// ============================================
router.patch('/profile', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    res.status(400).json({ success: false, message: 'Name is required.' });
    return;
  }

  db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), req.userId!);

  const row = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.userId!) as {
    id: string;
    email: string;
    name: string;
    created_at: string;
  };

  res.json({
    success: true,
    message: 'Profile updated successfully.',
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=ab3500&color=fff`,
      createdAt: row.created_at,
    },
  });
});

export default router;
