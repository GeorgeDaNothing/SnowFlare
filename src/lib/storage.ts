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

const KEYS = {
  MOVES: 'hp_moves',
  TRAINING_LOGS: 'hp_training_logs',
  RIDER_PROFILE: 'hp_rider_profile',
  ANALYSIS_CACHE: 'hp_analysis_cache',
  PRESETS: 'hp_presets',
  // Legacy migration keys
  LEGACY_SESSIONS: 'hp_sessions',
} as const;

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ============================================
// Migration: hp_sessions → hp_training_logs
// ============================================

(function migrateSessionsToTrainingLogs() {
  const legacy = localStorage.getItem(KEYS.LEGACY_SESSIONS);
  if (legacy) {
    try {
      const oldSessions = JSON.parse(legacy);
      if (Array.isArray(oldSessions) && oldSessions.length > 0) {
        const migrated: TrainingLog[] = oldSessions.map((s: Record<string, unknown>) => ({
          ...(s as unknown as TrainingLog),
          windSpeedKmh: 0,
          snowQuality: 'packed',
          isFavorite: false,
          videos: [],
        }));
        setItem(KEYS.TRAINING_LOGS, migrated);
      }
      localStorage.removeItem(KEYS.LEGACY_SESSIONS);
    } catch {
      localStorage.removeItem(KEYS.LEGACY_SESSIONS);
    }
  }
})();

// ============================================
// Moves
// ============================================

export function getMoves(): SavedMove[] {
  return getItem<SavedMove[]>(KEYS.MOVES, []);
}

export function saveMove(move: SavedMove): void {
  const moves = getMoves();
  const idx = moves.findIndex((m) => m.id === move.id);
  if (idx >= 0) {
    moves[idx] = move;
  } else {
    moves.push(move);
  }
  setItem(KEYS.MOVES, moves);
}

export function deleteMove(id: string): void {
  const moves = getMoves().filter((m) => m.id !== id);
  setItem(KEYS.MOVES, moves);
}

export function getMoveById(id: string): SavedMove | undefined {
  return getMoves().find((m) => m.id === id);
}

// ============================================
// Training Logs
// ============================================

export function getTrainingLogs(): TrainingLog[] {
  return getItem<TrainingLog[]>(KEYS.TRAINING_LOGS, []);
}

export function saveTrainingLog(log: TrainingLog): void {
  const logs = getTrainingLogs();
  const idx = logs.findIndex((l) => l.id === log.id);
  if (idx >= 0) {
    logs[idx] = log;
  } else {
    logs.push(log);
  }
  setItem(KEYS.TRAINING_LOGS, logs);
}

export function deleteTrainingLog(id: string): void {
  const logs = getTrainingLogs().filter((l) => l.id !== id);
  setItem(KEYS.TRAINING_LOGS, logs);
}

export function getTrainingLogById(id: string): TrainingLog | undefined {
  return getTrainingLogs().find((l) => l.id === id);
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

export function getRiderProfile(): RiderProfile {
  return getItem<RiderProfile>(KEYS.RIDER_PROFILE, DEFAULT_RIDER_PROFILE);
}

export function saveRiderProfile(profile: RiderProfile): void {
  setItem(KEYS.RIDER_PROFILE, profile);
}

// ============================================
// Analysis Cache
// ============================================

export function getAnalysisCache(): AnalysisCache {
  return getItem<AnalysisCache>(KEYS.ANALYSIS_CACHE, {});
}

export function getCachedAnalysis(requestHash: string): AnalysisCacheEntry | undefined {
  return getAnalysisCache()[requestHash];
}

export function setCachedAnalysis(requestHash: string, entry: AnalysisCacheEntry): void {
  const cache = getAnalysisCache();
  cache[requestHash] = entry;
  setItem(KEYS.ANALYSIS_CACHE, cache);
}

export function clearAnalysisCache(): void {
  setItem(KEYS.ANALYSIS_CACHE, {});
}

// ============================================
// Presets
// ============================================

const DEFAULT_PRESETS: PresetsCollection = {
  personal: [],
  board: [],
  trails: [],
};

export function getPresets(): PresetsCollection {
  return getItem<PresetsCollection>(KEYS.PRESETS, DEFAULT_PRESETS);
}

export function savePresets(presets: PresetsCollection): void {
  setItem(KEYS.PRESETS, presets);
}

export function addPersonalPreset(preset: PersonalPreset): void {
  const presets = getPresets();
  const idx = presets.personal.findIndex((p) => p.id === preset.id);
  if (idx >= 0) {
    // Merge to preserve any legacy dominantFoot data during transition
    presets.personal[idx] = { ...presets.personal[idx], ...preset };
  } else {
    presets.personal.push(preset);
  }
  savePresets(presets);
}

export function deletePersonalPreset(id: string): void {
  const presets = getPresets();
  presets.personal = presets.personal.filter((p) => p.id !== id);
  savePresets(presets);
}

export function addBoardPreset(preset: BoardPreset): void {
  const presets = getPresets();
  const idx = presets.board.findIndex((p) => p.id === preset.id);
  if (idx >= 0) presets.board[idx] = preset;
  else presets.board.push(preset);
  savePresets(presets);
}

export function deleteBoardPreset(id: string): void {
  const presets = getPresets();
  presets.board = presets.board.filter((p) => p.id !== id);
  savePresets(presets);
}

export function addSnowTrailPreset(preset: SnowTrailPreset): void {
  const presets = getPresets();
  const idx = presets.trails.findIndex((p) => p.id === preset.id);
  if (idx >= 0) presets.trails[idx] = preset;
  else presets.trails.push(preset);
  savePresets(presets);
}

export function deleteSnowTrailPreset(id: string): void {
  const presets = getPresets();
  presets.trails = presets.trails.filter((p) => p.id !== id);
  savePresets(presets);
}

// ============================================
// Debug / Raw Access
// ============================================

export function getAllStorage(): Record<string, unknown> {
  return {
    [KEYS.MOVES]: getMoves(),
    [KEYS.TRAINING_LOGS]: getTrainingLogs(),
    [KEYS.RIDER_PROFILE]: getRiderProfile(),
    [KEYS.ANALYSIS_CACHE]: getAnalysisCache(),
    [KEYS.PRESETS]: getPresets(),
  };
}

export function setStorageKey(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function exportAllStorage(): string {
  return JSON.stringify(getAllStorage(), null, 2);
}

export function importAllStorage(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data[KEYS.MOVES]) setItem(KEYS.MOVES, data[KEYS.MOVES]);
    if (data[KEYS.TRAINING_LOGS]) setItem(KEYS.TRAINING_LOGS, data[KEYS.TRAINING_LOGS]);
    if (data[KEYS.RIDER_PROFILE]) setItem(KEYS.RIDER_PROFILE, data[KEYS.RIDER_PROFILE]);
    if (data[KEYS.ANALYSIS_CACHE]) setItem(KEYS.ANALYSIS_CACHE, data[KEYS.ANALYSIS_CACHE]);
    if (data[KEYS.PRESETS]) setItem(KEYS.PRESETS, data[KEYS.PRESETS]);
    return true;
  } catch {
    return false;
  }
}
