import { apiAuth, setToken } from './api';
import {
  saveMove,
  saveTrainingLog,
  saveRiderProfile,
  setCachedAnalysis,
  addPersonalPreset,
  addBoardPreset,
  addSnowTrailPreset,
} from './storage';
import type { SavedMove, TrainingLog, RiderProfile, AnalysisCache, PersonalPreset, BoardPreset, SnowTrailPreset } from '@/types';

const MIGRATION_KEY = 'hp_migrated_to_server_v1';

interface LegacyUser {
  id: string;
  name: string;
  email: string;
  password: string;
  securityQuestions: { question: string; answer: string }[];
  createdAt: string;
}

interface LegacyCurrentUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface MigrationProgress {
  phase: 'checking' | 'auth' | 'profile' | 'moves' | 'logs' | 'presets' | 'cache' | 'complete' | 'error';
  message: string;
  total: number;
  current: number;
}

export function hasLegacyData(): boolean {
  const keys = [
    'hp_users',
    'hp_current_user',
    'hp_moves',
    'hp_training_logs',
    'hp_presets',
    'hp_rider_profile',
    'hp_analysis_cache',
  ];
  return keys.some((k) => localStorage.getItem(k) !== null);
}

export function isMigrationComplete(): boolean {
  return localStorage.getItem(MIGRATION_KEY) === 'true';
}

export function markMigrationComplete(): void {
  localStorage.setItem(MIGRATION_KEY, 'true');
}

export function clearLegacyData(): void {
  const keys = [
    'hp_users',
    'hp_current_user',
    'hp_moves',
    'hp_training_logs',
    'hp_presets',
    'hp_rider_profile',
    'hp_analysis_cache',
    'hp_sessions',
  ];
  keys.forEach((k) => localStorage.removeItem(k));
}

function getLegacyUsers(): LegacyUser[] {
  try {
    const raw = localStorage.getItem('hp_users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLegacyCurrentUser(): LegacyCurrentUser | null {
  try {
    const raw = localStorage.getItem('hp_current_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getLegacyMoves(): SavedMove[] {
  try {
    const raw = localStorage.getItem('hp_moves');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLegacyLogs(): TrainingLog[] {
  try {
    const raw = localStorage.getItem('hp_training_logs');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLegacyPresets(): { personal: PersonalPreset[]; board: BoardPreset[]; trails: SnowTrailPreset[] } {
  try {
    const raw = localStorage.getItem('hp_presets');
    return raw ? JSON.parse(raw) : { personal: [], board: [], trails: [] };
  } catch {
    return { personal: [], board: [], trails: [] };
  }
}

function getLegacyProfile(): RiderProfile | null {
  try {
    const raw = localStorage.getItem('hp_rider_profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getLegacyCache(): AnalysisCache {
  try {
    const raw = localStorage.getItem('hp_analysis_cache');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function* runMigration(): AsyncGenerator<MigrationProgress, void, unknown> {
  yield { phase: 'checking', message: 'Checking for legacy data...', total: 0, current: 0 };

  if (!hasLegacyData()) {
    markMigrationComplete();
    yield { phase: 'complete', message: 'No legacy data found. Ready to go!', total: 0, current: 0 };
    return;
  }

  const currentUser = getLegacyCurrentUser();
  const users = getLegacyUsers();

  // ============================================
  // Authenticate
  // ============================================
  yield { phase: 'auth', message: 'Migrating account to server...', total: 0, current: 0 };

  if (currentUser) {
    const fullUser = users.find((u) => u.email.toLowerCase() === currentUser.email.toLowerCase());

    if (fullUser) {
      let token: string | undefined;
      let errorMessage = '';

      try {
        // Try register first
        const res = await apiAuth.register(
          fullUser.name,
          fullUser.email,
          fullUser.password,
          fullUser.securityQuestions
        );
        if (res.success && res.token) {
          token = res.token;
        } else if (res.message) {
          errorMessage = res.message;
        }
      } catch (err: any) {
        // Registration failed (e.g. email already exists). Try logging in next.
        errorMessage = err?.message || 'Registration failed';
      }

      if (!token && errorMessage.toLowerCase().includes('already exists')) {
        try {
          const res = await apiAuth.login(fullUser.email, fullUser.password);
          if (res.success && res.token) {
            token = res.token;
          } else if (res.message) {
            errorMessage = res.message;
          }
        } catch (err: any) {
          errorMessage = err?.message || 'Login failed';
        }
      }

      if (token) {
        setToken(token);
      } else {
        yield {
          phase: 'error',
          message: `Could not migrate account: ${errorMessage || 'Unknown error'}. Please register manually.`,
          total: 0,
          current: 0,
        };
        return;
      }
    }
  }

  // ============================================
  // Profile
  // ============================================
  yield { phase: 'profile', message: 'Migrating rider profile...', total: 0, current: 0 };
  const profile = getLegacyProfile();
  if (profile) {
    try {
      await saveRiderProfile(profile);
    } catch {
      // ignore individual failures
    }
  }

  // ============================================
  // Moves
  // ============================================
  const moves = getLegacyMoves();
  if (moves.length > 0) {
    yield { phase: 'moves', message: `Migrating ${moves.length} move presets...`, total: moves.length, current: 0 };
    for (let i = 0; i < moves.length; i++) {
      try {
        await saveMove(moves[i]);
      } catch {
        // ignore individual failures
      }
      yield { phase: 'moves', message: `Migrating ${moves.length} move presets...`, total: moves.length, current: i + 1 };
    }
  }

  // ============================================
  // Logs
  // ============================================
  const logs = getLegacyLogs();
  if (logs.length > 0) {
    yield { phase: 'logs', message: `Migrating ${logs.length} training logs...`, total: logs.length, current: 0 };
    for (let i = 0; i < logs.length; i++) {
      try {
        await saveTrainingLog(logs[i]);
      } catch {
        // ignore individual failures
      }
      yield { phase: 'logs', message: `Migrating ${logs.length} training logs...`, total: logs.length, current: i + 1 };
    }
  }

  // ============================================
  // Presets
  // ============================================
  const presets = getLegacyPresets();
  const allPresets = [...presets.personal, ...presets.board, ...presets.trails];
  if (allPresets.length > 0) {
    yield { phase: 'presets', message: `Migrating ${allPresets.length} presets...`, total: allPresets.length, current: 0 };
    let current = 0;
    for (const p of presets.personal) {
      try {
        await addPersonalPreset(p);
      } catch {
        // ignore
      }
      current++;
      yield { phase: 'presets', message: `Migrating ${allPresets.length} presets...`, total: allPresets.length, current };
    }
    for (const p of presets.board) {
      try {
        await addBoardPreset(p);
      } catch {
        // ignore
      }
      current++;
      yield { phase: 'presets', message: `Migrating ${allPresets.length} presets...`, total: allPresets.length, current };
    }
    for (const p of presets.trails) {
      try {
        await addSnowTrailPreset(p);
      } catch {
        // ignore
      }
      current++;
      yield { phase: 'presets', message: `Migrating ${allPresets.length} presets...`, total: allPresets.length, current };
    }
  }

  // ============================================
  // Cache
  // ============================================
  const cache = getLegacyCache();
  const cacheEntries = Object.entries(cache);
  if (cacheEntries.length > 0) {
    yield { phase: 'cache', message: `Migrating ${cacheEntries.length} cached analyses...`, total: cacheEntries.length, current: 0 };
    for (let i = 0; i < cacheEntries.length; i++) {
      try {
        const [hash, entry] = cacheEntries[i];
        await setCachedAnalysis(hash, entry);
      } catch {
        // ignore
      }
      yield { phase: 'cache', message: `Migrating ${cacheEntries.length} cached analyses...`, total: cacheEntries.length, current: i + 1 };
    }
  }

  // ============================================
  // Done
  // ============================================
  clearLegacyData();
  markMigrationComplete();
  yield { phase: 'complete', message: 'Migration complete! Your data is now on the server.', total: 0, current: 0 };
}
