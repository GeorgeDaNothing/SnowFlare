import { Router } from 'express';
import { db } from '../db';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ============================================
// GET /api/moves
// ============================================
router.get('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const rows = db.prepare('SELECT * FROM moves WHERE user_id = ? ORDER BY updated_at DESC').all(req.userId!) as Array<{
    id: string;
    name: string;
    config_json: string;
    last_analysis_json: string | null;
    created_at: string;
    updated_at: string;
  }>;

  res.json({
    success: true,
    moves: rows.map((r) => ({
      id: r.id,
      name: r.name,
      config: JSON.parse(r.config_json),
      lastAnalysis: r.last_analysis_json ? JSON.parse(r.last_analysis_json) : null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  });
});

// ============================================
// GET /api/moves/:id
// ============================================
router.get('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const row = db.prepare('SELECT * FROM moves WHERE id = ? AND user_id = ?').get(req.params.id, req.userId!) as
    | {
        id: string;
        name: string;
        config_json: string;
        last_analysis_json: string | null;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  if (!row) {
    res.status(404).json({ success: false, message: 'Move not found.' });
    return;
  }

  res.json({
    success: true,
    move: {
      id: row.id,
      name: row.name,
      config: JSON.parse(row.config_json),
      lastAnalysis: row.last_analysis_json ? JSON.parse(row.last_analysis_json) : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  });
});

// ============================================
// POST /api/moves
// ============================================
router.post('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { id, name, config, lastAnalysis } = req.body;

  if (!name || !config) {
    res.status(400).json({ success: false, message: 'Name and config are required.' });
    return;
  }

  const moveId = id || generateId();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO moves (id, user_id, name, config_json, last_analysis_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    moveId,
    req.userId!,
    String(name).trim(),
    JSON.stringify(config),
    lastAnalysis ? JSON.stringify(lastAnalysis) : null,
    now,
    now
  );

  res.status(201).json({ success: true, message: 'Move saved.', id: moveId });
});

// ============================================
// PUT /api/moves/:id
// ============================================
router.put('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { name, config, lastAnalysis } = req.body;

  if (!name || !config) {
    res.status(400).json({ success: false, message: 'Name and config are required.' });
    return;
  }

  const existing = db.prepare('SELECT 1 FROM moves WHERE id = ? AND user_id = ?').get(req.params.id, req.userId!);
  if (!existing) {
    res.status(404).json({ success: false, message: 'Move not found.' });
    return;
  }

  db.prepare(
    `UPDATE moves
     SET name = ?, config_json = ?, last_analysis_json = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    String(name).trim(),
    JSON.stringify(config),
    lastAnalysis ? JSON.stringify(lastAnalysis) : null,
    new Date().toISOString(),
    req.params.id,
    req.userId!
  );

  res.json({ success: true, message: 'Move updated.' });
});

// ============================================
// DELETE /api/moves/:id
// ============================================
router.delete('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const result = db.prepare('DELETE FROM moves WHERE id = ? AND user_id = ?').run(req.params.id, req.userId!);

  if (result.changes === 0) {
    res.status(404).json({ success: false, message: 'Move not found.' });
    return;
  }

  res.json({ success: true, message: 'Move deleted.' });
});

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default router;
