import { Router } from 'express';
import { db } from '../db';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ============================================
// GET /api/cache/:hash
// ============================================
router.get('/:hash', authMiddleware, (req: AuthenticatedRequest, res) => {
  const row = db
    .prepare('SELECT result_json FROM analysis_cache WHERE user_id = ? AND request_hash = ?')
    .get(req.userId!, req.params.hash) as { result_json: string } | undefined;

  if (!row) {
    res.status(404).json({ success: false, message: 'Cache miss.' });
    return;
  }

  res.json({ success: true, result: JSON.parse(row.result_json) });
});

// ============================================
// POST /api/cache
// ============================================
router.post('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { hash, result } = req.body;

  if (!hash || !result) {
    res.status(400).json({ success: false, message: 'Hash and result are required.' });
    return;
  }

  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO analysis_cache (id, user_id, request_hash, result_json, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, request_hash) DO UPDATE SET result_json = excluded.result_json, created_at = excluded.created_at`
  ).run(generateId(), req.userId!, String(hash), JSON.stringify(result), now);

  res.status(201).json({ success: true, message: 'Cached.' });
});

// ============================================
// DELETE /api/cache
// ============================================
router.delete('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  db.prepare('DELETE FROM analysis_cache WHERE user_id = ?').run(req.userId!);
  res.json({ success: true, message: 'Cache cleared.' });
});

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default router;
