import { Router } from 'express';
import { db } from '../db';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ============================================
// GET /api/presets
// ============================================
router.get('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const rows = db.prepare('SELECT * FROM presets WHERE user_id = ? ORDER BY updated_at DESC').all(req.userId!) as Array<{
    id: string;
    type: 'personal' | 'board' | 'trail';
    name: string;
    data_json: string;
    created_at: string;
    updated_at: string;
  }>;

  const personal: unknown[] = [];
  const board: unknown[] = [];
  const trails: unknown[] = [];

  for (const r of rows) {
    const item = { id: r.id, name: r.name, ...JSON.parse(r.data_json), createdAt: r.created_at, updatedAt: r.updated_at };
    if (r.type === 'personal') personal.push(item);
    else if (r.type === 'board') board.push(item);
    else if (r.type === 'trail') trails.push(item);
  }

  res.json({
    success: true,
    presets: { personal, board, trails },
  });
});

// ============================================
// POST /api/presets
// ============================================
router.post('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { id, type, name, data } = req.body;

  if (!type || !name || !data || !['personal', 'board', 'trail'].includes(type)) {
    res.status(400).json({ success: false, message: 'Type, name, and data are required. Type must be personal, board, or trail.' });
    return;
  }

  const presetId = id || generateId();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO presets (id, user_id, type, name, data_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(presetId, req.userId!, type, String(name).trim(), JSON.stringify(data), now, now);

  res.status(201).json({ success: true, message: 'Preset saved.', id: presetId });
});

// ============================================
// PUT /api/presets/:id
// ============================================
router.put('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { type, name, data } = req.body;

  if (!type || !name || !data || !['personal', 'board', 'trail'].includes(type)) {
    res.status(400).json({ success: false, message: 'Type, name, and data are required.' });
    return;
  }

  const existing = db.prepare('SELECT 1 FROM presets WHERE id = ? AND user_id = ?').get(req.params.id, req.userId!);
  if (!existing) {
    res.status(404).json({ success: false, message: 'Preset not found.' });
    return;
  }

  db.prepare(
    `UPDATE presets SET type = ?, name = ?, data_json = ?, updated_at = ? WHERE id = ? AND user_id = ?`
  ).run(type, String(name).trim(), JSON.stringify(data), new Date().toISOString(), req.params.id, req.userId!);

  res.json({ success: true, message: 'Preset updated.' });
});

// ============================================
// DELETE /api/presets/:id
// ============================================
router.delete('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const result = db.prepare('DELETE FROM presets WHERE id = ? AND user_id = ?').run(req.params.id, req.userId!);

  if (result.changes === 0) {
    res.status(404).json({ success: false, message: 'Preset not found.' });
    return;
  }

  res.json({ success: true, message: 'Preset deleted.' });
});

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default router;
