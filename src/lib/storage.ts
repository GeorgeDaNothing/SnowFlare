import type {
  SavedMove,
  Session,
  RiderProfile,
  AnalysisCache,
  AnalysisCacheEntry,
} from '@/types';

const KEYS = {
  MOVES: 'hp_moves',
  SESSIONS: 'hp_sessions',
  RIDER_PROFILE: 'hp_rider_profile',
  ANALYSIS_CACHE: 'hp_analysis_cache',
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
// Sessions
// ============================================

export function getSessions(): Session[] {
  return getItem<Session[]>(KEYS.SESSIONS, []);
}

export function saveSession(session: Session): void {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  setItem(KEYS.SESSIONS, sessions);
}

export function deleteSession(id: string): void {
  const sessions = getSessions().filter((s) => s.id !== id);
  setItem(KEYS.SESSIONS, sessions);
}

export function getSessionById(id: string): Session | undefined {
  return getSessions().find((s) => s.id === id);
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
// Debug / Raw Access
// ============================================

export function getAllStorage(): Record<string, unknown> {
  return {
    [KEYS.MOVES]: getMoves(),
    [KEYS.SESSIONS]: getSessions(),
    [KEYS.RIDER_PROFILE]: getRiderProfile(),
    [KEYS.ANALYSIS_CACHE]: getAnalysisCache(),
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
    if (data[KEYS.SESSIONS]) setItem(KEYS.SESSIONS, data[KEYS.SESSIONS]);
    if (data[KEYS.RIDER_PROFILE]) setItem(KEYS.RIDER_PROFILE, data[KEYS.RIDER_PROFILE]);
    if (data[KEYS.ANALYSIS_CACHE]) setItem(KEYS.ANALYSIS_CACHE, data[KEYS.ANALYSIS_CACHE]);
    return true;
  } catch {
    return false;
  }
}
