import { Router } from 'express';
import { db } from '../db';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ============================================
// GET /api/logs
// ============================================
router.get('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const rows = db.prepare('SELECT * FROM training_logs WHERE user_id = ? ORDER BY date DESC').all(req.userId!) as Array<{
    id: string;
    date: string;
    location: string | null;
    weather_json: string | null;
    wind_speed_kmh: number | null;
    snow_quality: string | null;
    temperature_c: number | null;
    moves_json: string;
    is_favorite: number;
    created_at: string;
  }>;

  const logs = rows.map((r) => ({
    id: r.id,
    date: r.date,
    location: r.location,
    weather: r.weather_json ? JSON.parse(r.weather_json) : null,
    windSpeedKmh: r.wind_speed_kmh,
    snowQuality: r.snow_quality,
    temperatureC: r.temperature_c,
    moves: JSON.parse(r.moves_json),
    isFavorite: !!r.is_favorite,
    videos: [] as string[],
    createdAt: r.created_at,
  }));

  // Fetch videos for each log
  for (const log of logs) {
    const videos = db.prepare('SELECT data FROM log_videos WHERE log_id = ?').all(log.id) as Array<{ data: string }>;
    log.videos = videos.map((v) => v.data);
  }

  res.json({ success: true, logs });
});

// ============================================
// GET /api/logs/:id
// ============================================
router.get('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const row = db.prepare('SELECT * FROM training_logs WHERE id = ? AND user_id = ?').get(req.params.id, req.userId!) as
    | {
        id: string;
        date: string;
        location: string | null;
        weather_json: string | null;
        wind_speed_kmh: number | null;
        snow_quality: string | null;
        temperature_c: number | null;
        moves_json: string;
        is_favorite: number;
        created_at: string;
      }
    | undefined;

  if (!row) {
    res.status(404).json({ success: false, message: 'Log not found.' });
    return;
  }

  const videos = db.prepare('SELECT id, data FROM log_videos WHERE log_id = ?').all(row.id) as Array<{
    id: string;
    data: string;
  }>;

  res.json({
    success: true,
    log: {
      id: row.id,
      date: row.date,
      location: row.location,
      weather: row.weather_json ? JSON.parse(row.weather_json) : null,
      windSpeedKmh: row.wind_speed_kmh,
      snowQuality: row.snow_quality,
      temperatureC: row.temperature_c,
      moves: JSON.parse(row.moves_json),
      isFavorite: !!row.is_favorite,
      videos: videos.map((v) => ({ id: v.id, data: v.data })),
      createdAt: row.created_at,
    },
  });
});

// ============================================
// POST /api/logs
// ============================================
router.post('/', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { id, date, location, weather, windSpeedKmh, snowQuality, temperatureC, moves, isFavorite, videos } = req.body;

  if (!date) {
    res.status(400).json({ success: false, message: 'Date is required.' });
    return;
  }

  const logId = id || generateId();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO training_logs
     (id, user_id, date, location, weather_json, wind_speed_kmh, snow_quality, temperature_c, moves_json, is_favorite, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    logId,
    req.userId!,
    date,
    location || null,
    weather ? JSON.stringify(weather) : null,
    windSpeedKmh ?? null,
    snowQuality || null,
    temperatureC ?? null,
    JSON.stringify(moves || []),
    isFavorite ? 1 : 0,
    now
  );

  // Insert videos
  if (Array.isArray(videos) && videos.length > 0) {
    const insertVideo = db.prepare('INSERT INTO log_videos (id, log_id, data) VALUES (?, ?, ?)');
    for (const data of videos) {
      insertVideo.run(generateId(), logId, String(data));
    }
  }

  res.status(201).json({ success: true, message: 'Log saved.', id: logId });
});

// ============================================
// PUT /api/logs/:id
// ============================================
router.put('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { date, location, weather, windSpeedKmh, snowQuality, temperatureC, moves, isFavorite } = req.body;

  const existing = db.prepare('SELECT 1 FROM training_logs WHERE id = ? AND user_id = ?').get(req.params.id, req.userId!);
  if (!existing) {
    res.status(404).json({ success: false, message: 'Log not found.' });
    return;
  }

  db.prepare(
    `UPDATE training_logs
     SET date = ?, location = ?, weather_json = ?, wind_speed_kmh = ?, snow_quality = ?, temperature_c = ?, moves_json = ?, is_favorite = ?
     WHERE id = ? AND user_id = ?`
  ).run(
    date,
    location || null,
    weather ? JSON.stringify(weather) : null,
    windSpeedKmh ?? null,
    snowQuality || null,
    temperatureC ?? null,
    JSON.stringify(moves || []),
    isFavorite ? 1 : 0,
    req.params.id,
    req.userId!
  );

  res.json({ success: true, message: 'Log updated.' });
});

// ============================================
// DELETE /api/logs/:id
// ============================================
router.delete('/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
  const result = db.prepare('DELETE FROM training_logs WHERE id = ? AND user_id = ?').run(req.params.id, req.userId!);

  if (result.changes === 0) {
    res.status(404).json({ success: false, message: 'Log not found.' });
    return;
  }

  res.json({ success: true, message: 'Log deleted.' });
});

// ============================================
// POST /api/logs/:id/videos
// ============================================
router.post('/:id/videos', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { data } = req.body;
  if (!data) {
    res.status(400).json({ success: false, message: 'Video data is required.' });
    return;
  }

  const log = db.prepare('SELECT 1 FROM training_logs WHERE id = ? AND user_id = ?').get(req.params.id, req.userId!);
  if (!log) {
    res.status(404).json({ success: false, message: 'Log not found.' });
    return;
  }

  const videoId = generateId();
  db.prepare('INSERT INTO log_videos (id, log_id, data) VALUES (?, ?, ?)').run(videoId, req.params.id, String(data));

  res.status(201).json({ success: true, message: 'Video added.', id: videoId });
});

// ============================================
// DELETE /api/logs/:logId/videos/:videoId
// ============================================
router.delete('/:logId/videos/:videoId', authMiddleware, (req: AuthenticatedRequest, res) => {
  const result = db
    .prepare(
      `DELETE FROM log_videos WHERE id = ? AND log_id = ? AND log_id IN
       (SELECT id FROM training_logs WHERE id = ? AND user_id = ?)`
    )
    .run(req.params.videoId, req.params.logId, req.params.logId, req.userId!);

  if (result.changes === 0) {
    res.status(404).json({ success: false, message: 'Video not found.' });
    return;
  }

  res.json({ success: true, message: 'Video deleted.' });
});

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export default router;
