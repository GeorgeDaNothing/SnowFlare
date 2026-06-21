/**
 * Server-backed storage layer.
 * All CRUD operations are now async and call the SnowFlare API.
 * Legacy localStorage keys are no longer used for app data.
 */

import {
  apiMoves,
  apiLogs,
  apiPresets,
  apiProfile,
  apiCache,
  type ApiLog,
} from './api';
import type {
  SavedMove,
  TrainingLog,
  RiderProfile,
  AnalysisCache,
  AnalysisCacheEntry,
  PresetsCollection,
  PersonalPreset,
  BoardPreset,
  SnowTrailPreset,
} from '@/types';

// ============================================
// Moves
// ============================================

export async function getMoves(): Promise<SavedMove[]> {
  const res = await apiMoves.list();
  return res.moves.map((m) => ({
    id: m.id,
    name: m.name,
    config: m.config as SavedMove['config'],
    lastAnalysis: m.lastAnalysis as SavedMove['lastAnalysis'],
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));
}

export async function saveMove(move: SavedMove): Promise<void> {
  const existing = await getMoves();
  const isUpdate = existing.some((m) => m.id === move.id);
  if (isUpdate) {
    await apiMoves.update(move.id, {
      name: move.name,
      config: move.config,
      lastAnalysis: move.lastAnalysis,
    });
  } else {
    await apiMoves.create({
      id: move.id,
      name: move.name,
      config: move.config,
      lastAnalysis: move.lastAnalysis,
    });
  }
}

export async function deleteMove(id: string): Promise<void> {
  await apiMoves.delete(id);
}

export async function getMoveById(id: string): Promise<SavedMove | undefined> {
  try {
    const res = await apiMoves.get(id);
    return {
      id: res.move.id,
      name: res.move.name,
      config: res.move.config as SavedMove['config'],
      lastAnalysis: res.move.lastAnalysis as SavedMove['lastAnalysis'],
      createdAt: res.move.createdAt,
      updatedAt: res.move.updatedAt,
    };
  } catch {
    return undefined;
  }
}

// ============================================
// Training Logs
// ============================================

function apiLogToTrainingLog(log: ApiLog): TrainingLog {
  return {
    id: log.id,
    date: log.date,
    location: log.location || '',
    weather: (log.weather as TrainingLog['weather']) || 'clear',
    windSpeedKmh: log.windSpeedKmh ?? 0,
    snowQuality: (log.snowQuality as TrainingLog['snowQuality']) || 'packed',
    temperatureC: log.temperatureC ?? 0,
    notes: '',
    moves: (log.moves as TrainingLog['moves']) || [],
    isFavorite: log.isFavorite,
    videos: Array.isArray(log.videos)
      ? log.videos.map((v) => (typeof v === 'string' ? v : (v as { data: string }).data))
      : [],
  };
}

export async function getTrainingLogs(): Promise<TrainingLog[]> {
  const res = await apiLogs.list();
  return res.logs.map(apiLogToTrainingLog);
}

export async function saveTrainingLog(log: TrainingLog): Promise<void> {
  const existing = await getTrainingLogs();
  const isUpdate = existing.some((l) => l.id === log.id);

  const payload: Omit<ApiLog, 'createdAt'> = {
    id: log.id,
    date: log.date,
    location: log.location || null,
    weather: log.weather || null,
    windSpeedKmh: log.windSpeedKmh ?? null,
    snowQuality: log.snowQuality || null,
    temperatureC: log.temperatureC ?? null,
    moves: log.moves || [],
    isFavorite: log.isFavorite,
    videos: log.videos || [],
  };

  if (isUpdate) {
    await apiLogs.update(log.id, payload);
  } else {
    await apiLogs.create(payload);
  }
}

export async function deleteTrainingLog(id: string): Promise<void> {
  await apiLogs.delete(id);
}

export async function getTrainingLogById(id: string): Promise<TrainingLog | undefined> {
  try {
    const res = await apiLogs.get(id);
    return apiLogToTrainingLog(res.log);
  } catch {
    return undefined;
  }
}

// ============================================
// Rider Profile
// ============================================

const DEFAULT_RIDER_PROFILE: RiderProfile = {
  name: '',
  experienceLevel: 'intermediate',
  yearsExperience: 2,
  heightCm: 175,
  weightKg: 70,
  stance: 'regular',
  dominantFoot: 'right',
  preferredDiscipline: 'Freestyle',
  recentInjuries: [],
};

export async function getRiderProfile(): Promise<RiderProfile> {
  try {
    const res = await apiProfile.get();
    return (res.profile as RiderProfile) || DEFAULT_RIDER_PROFILE;
  } catch {
    return DEFAULT_RIDER_PROFILE;
  }
}

export async function saveRiderProfile(profile: RiderProfile): Promise<void> {
  await apiProfile.save(profile);
}

// ============================================
// Analysis Cache
// ============================================

export async function getAnalysisCache(): Promise<AnalysisCache> {
  // Not exposed by server as a bulk endpoint; callers use getCachedAnalysis per-hash.
  return {};
}

export async function getCachedAnalysis(requestHash: string): Promise<AnalysisCacheEntry | undefined> {
  try {
    const res = await apiCache.get(requestHash);
    return res.result as AnalysisCacheEntry;
  } catch {
    return undefined;
  }
}

export async function setCachedAnalysis(requestHash: string, entry: AnalysisCacheEntry): Promise<void> {
  await apiCache.set(requestHash, entry);
}

export async function clearAnalysisCache(): Promise<void> {
  await apiCache.clear();
}

// ============================================
// Presets
// ============================================

const DEFAULT_PRESETS: PresetsCollection = {
  personal: [],
  board: [],
  trails: [],
};

export async function getPresets(): Promise<PresetsCollection> {
  try {
    const res = await apiPresets.list();
    return {
      personal: (res.presets.personal as PersonalPreset[]) || [],
      board: (res.presets.board as BoardPreset[]) || [],
      trails: (res.presets.trails as SnowTrailPreset[]) || [],
    };
  } catch {
    return DEFAULT_PRESETS;
  }
}

export async function savePresets(presets: PresetsCollection): Promise<void> {
  // Replace all presets. Since server stores individually, we upsert each.
  const current = await getPresets();

  // Personal
  for (const p of presets.personal) {
    const existing = current.personal.find((cp) => cp.id === p.id);
    const data = { ...p };
    delete (data as Record<string, unknown>).id;
    delete (data as Record<string, unknown>).name;
    delete (data as Record<string, unknown>).createdAt;
    delete (data as Record<string, unknown>).updatedAt;
    if (existing) {
      await apiPresets.update(p.id, { type: 'personal', name: p.name, data });
    } else {
      await apiPresets.create({ id: p.id, type: 'personal', name: p.name, data });
    }
  }
  for (const cp of current.personal) {
    if (!presets.personal.find((p) => p.id === cp.id)) {
      await apiPresets.delete(cp.id);
    }
  }

  // Board
  for (const p of presets.board) {
    const existing = current.board.find((cp) => cp.id === p.id);
    const data = { ...p };
    delete (data as Record<string, unknown>).id;
    delete (data as Record<string, unknown>).name;
    delete (data as Record<string, unknown>).createdAt;
    delete (data as Record<string, unknown>).updatedAt;
    if (existing) {
      await apiPresets.update(p.id, { type: 'board', name: p.name, data });
    } else {
      await apiPresets.create({ id: p.id, type: 'board', name: p.name, data });
    }
  }
  for (const cp of current.board) {
    if (!presets.board.find((p) => p.id === cp.id)) {
      await apiPresets.delete(cp.id);
    }
  }

  // Trails
  for (const p of presets.trails) {
    const existing = current.trails.find((cp) => cp.id === p.id);
    const data = { ...p };
    delete (data as Record<string, unknown>).id;
    delete (data as Record<string, unknown>).name;
    delete (data as Record<string, unknown>).createdAt;
    delete (data as Record<string, unknown>).updatedAt;
    if (existing) {
      await apiPresets.update(p.id, { type: 'trail', name: p.name, data });
    } else {
      await apiPresets.create({ id: p.id, type: 'trail', name: p.name, data });
    }
  }
  for (const cp of current.trails) {
    if (!presets.trails.find((p) => p.id === cp.id)) {
      await apiPresets.delete(cp.id);
    }
  }
}

export async function addPersonalPreset(preset: PersonalPreset): Promise<void> {
  const data = { ...preset };
  delete (data as Record<string, unknown>).id;
  delete (data as Record<string, unknown>).name;
  delete (data as Record<string, unknown>).createdAt;
  delete (data as Record<string, unknown>).updatedAt;
  await apiPresets.create({ id: preset.id, type: 'personal', name: preset.name, data });
}

export async function deletePersonalPreset(id: string): Promise<void> {
  await apiPresets.delete(id);
}

export async function addBoardPreset(preset: BoardPreset): Promise<void> {
  const data = { ...preset };
  delete (data as Record<string, unknown>).id;
  delete (data as Record<string, unknown>).name;
  delete (data as Record<string, unknown>).createdAt;
  delete (data as Record<string, unknown>).updatedAt;
  await apiPresets.create({ id: preset.id, type: 'board', name: preset.name, data });
}

export async function deleteBoardPreset(id: string): Promise<void> {
  await apiPresets.delete(id);
}

export async function addSnowTrailPreset(preset: SnowTrailPreset): Promise<void> {
  const data = { ...preset };
  delete (data as Record<string, unknown>).id;
  delete (data as Record<string, unknown>).name;
  delete (data as Record<string, unknown>).createdAt;
  delete (data as Record<string, unknown>).updatedAt;
  await apiPresets.create({ id: preset.id, type: 'trail', name: preset.name, data });
}

export async function deleteSnowTrailPreset(id: string): Promise<void> {
  await apiPresets.delete(id);
}

// ============================================
// Debug / Raw Access (legacy compat)
// ============================================

export async function getAllStorage(): Promise<Record<string, unknown>> {
  const [moves, logs, profile, presets] = await Promise.all([
    getMoves().catch(() => []),
    getTrainingLogs().catch(() => []),
    getRiderProfile().catch(() => DEFAULT_RIDER_PROFILE),
    getPresets().catch(() => DEFAULT_PRESETS),
  ]);
  return {
    moves,
    training_logs: logs,
    rider_profile: profile,
    presets,
  };
}

export function setStorageKey(_key: string, _value: unknown): boolean {
  // No-op in server mode; raw localStorage manipulation is disabled.
  return false;
}

export async function exportAllStorage(): Promise<string> {
  const data = await getAllStorage();
  return JSON.stringify(data, null, 2);
}

export async function importAllStorage(_json: string): Promise<boolean> {
  // Import via server is not supported from raw JSON for safety.
  // Use individual create endpoints instead.
  return false;
}
