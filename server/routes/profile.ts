import { Router } from 'express';
import { db } from '../db';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ============================================
// GET /api/profile
// ============================================
router.get('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const row = db.prepare('SELECT profile_json FROM rider_profiles WHERE user_id = ?').get(req.userId!) as
    | { profile_json: string }
    | undefined;

  if (!row) {
    res.status(404).json({ success: false, message: 'Profile not found.' });
    return;
  }

  res.json({ success: true, profile: JSON.parse(row.profile_json) });
});

// ============================================
// PUT /api/profile
// ============================================
router.put('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { profile } = req.body;

  if (!profile || typeof profile !== 'object') {
    res.status(400).json({ success: false, message: 'Profile object is required.' });
    return;
  }

  const existing = db.prepare('SELECT 1 FROM rider_profiles WHERE user_id = ?').get(req.userId!);
  const now = new Date().toISOString();

  if (existing) {
    db.prepare('UPDATE rider_profiles SET profile_json = ?, updated_at = ? WHERE user_id = ?').run(
      JSON.stringify(profile),
      now,
      req.userId!
    );
  } else {
    db.prepare(
      `INSERT INTO rider_profiles (id, user_id, profile_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(generateId(), req.userId!, JSON.stringify(profile), now, now);
  }

  res.json({ success: true, message: 'Profile saved.' });
});

// ============================================
// DELETE /api/profile
// ============================================
router.delete('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  db.prepare('DELETE FROM rider_profiles WHERE user_id = ?').run(req.userId!);
  res.json({ success: true, message: 'Profile deleted.' });
});

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default router;
