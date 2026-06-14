/**
 * Horizon Pulse API client.
 * All endpoints require Bearer token (except auth register/login/reset flows).
 */

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE) ?? '/api';

const TOKEN_KEY = 'hp_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const message = typeof data.message === 'string' ? data.message : `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

// ============================================
// Auth
// ============================================

export interface ApiAuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    createdAt: string;
  };
  questions?: string[];
}

export const apiAuth = {
  register(name: string, email: string, password: string, securityQuestions: { question: string; answer: string }[]) {
    return apiFetch<ApiAuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, securityQuestions }),
    });
  },

  login(email: string, password: string) {
    return apiFetch<ApiAuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  me() {
    return apiFetch<ApiAuthResponse>('/auth/me');
  },

  requestReset(email: string) {
    return apiFetch<ApiAuthResponse>('/auth/request-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  getSecurityQuestions(email: string) {
    return apiFetch<ApiAuthResponse>('/auth/security-questions', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifySecurityAnswers(email: string, answers: string[]) {
    return apiFetch<ApiAuthResponse>('/auth/verify-security-answers', {
      method: 'POST',
      body: JSON.stringify({ email, answers }),
    });
  },

  resetPassword(token: string, newPassword: string) {
    return apiFetch<ApiAuthResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  updateProfile(name: string) {
    return apiFetch<ApiAuthResponse>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },
};

// ============================================
// Moves
// ============================================

export interface ApiMovesResponse {
  success: boolean;
  moves: Array<{
    id: string;
    name: string;
    config: unknown;
    lastAnalysis: unknown | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface ApiMoveResponse {
  success: boolean;
  move: ApiMovesResponse['moves'][number];
}

export const apiMoves = {
  list() {
    return apiFetch<ApiMovesResponse>('/moves');
  },

  get(id: string) {
    return apiFetch<ApiMoveResponse>(`/moves/${id}`);
  },

  create(move: { id?: string; name: string; config: unknown; lastAnalysis?: unknown | null }) {
    return apiFetch<{ success: boolean; message: string; id: string }>('/moves', {
      method: 'POST',
      body: JSON.stringify(move),
    });
  },

  update(id: string, move: { name: string; config: unknown; lastAnalysis?: unknown | null }) {
    return apiFetch<{ success: boolean; message: string }>(`/moves/${id}`, {
      method: 'PUT',
      body: JSON.stringify(move),
    });
  },

  delete(id: string) {
    return apiFetch<{ success: boolean; message: string }>(`/moves/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// Training Logs
// ============================================

export interface ApiLog {
  id: string;
  date: string;
  location: string | null;
  weather: unknown | null;
  windSpeedKmh: number | null;
  snowQuality: string | null;
  temperatureC: number | null;
  moves: unknown[];
  isFavorite: boolean;
  videos: string[] | { id: string; data: string }[];
  createdAt: string;
}

export interface ApiLogsResponse {
  success: boolean;
  logs: ApiLog[];
}

export interface ApiLogResponse {
  success: boolean;
  log: ApiLog;
}

export const apiLogs = {
  list() {
    return apiFetch<ApiLogsResponse>('/logs');
  },

  get(id: string) {
    return apiFetch<ApiLogResponse>(`/logs/${id}`);
  },

  create(log: Omit<ApiLog, 'createdAt'>) {
    return apiFetch<{ success: boolean; message: string; id: string }>('/logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  },

  update(id: string, log: Partial<ApiLog>) {
    return apiFetch<{ success: boolean; message: string }>(`/logs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(log),
    });
  },

  delete(id: string) {
    return apiFetch<{ success: boolean; message: string }>(`/logs/${id}`, {
      method: 'DELETE',
    });
  },

  addVideo(logId: string, data: string) {
    return apiFetch<{ success: boolean; message: string; id: string }>(`/logs/${logId}/videos`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  },

  deleteVideo(logId: string, videoId: string) {
    return apiFetch<{ success: boolean; message: string }>(`/logs/${logId}/videos/${videoId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// Presets
// ============================================

export interface ApiPresetsResponse {
  success: boolean;
  presets: {
    personal: unknown[];
    board: unknown[];
    trails: unknown[];
  };
}

export const apiPresets = {
  list() {
    return apiFetch<ApiPresetsResponse>('/presets');
  },

  create(preset: { id?: string; type: 'personal' | 'board' | 'trail'; name: string; data: unknown }) {
    return apiFetch<{ success: boolean; message: string; id: string }>('/presets', {
      method: 'POST',
      body: JSON.stringify(preset),
    });
  },

  update(id: string, preset: { type: 'personal' | 'board' | 'trail'; name: string; data: unknown }) {
    return apiFetch<{ success: boolean; message: string }>(`/presets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(preset),
    });
  },

  delete(id: string) {
    return apiFetch<{ success: boolean; message: string }>(`/presets/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// Rider Profile
// ============================================

export const apiProfile = {
  get() {
    return apiFetch<{ success: boolean; profile: unknown }>('/profile');
  },

  save(profile: unknown) {
    return apiFetch<{ success: boolean; message: string }>('/profile', {
      method: 'PUT',
      body: JSON.stringify({ profile }),
    });
  },

  delete() {
    return apiFetch<{ success: boolean; message: string }>('/profile', {
      method: 'DELETE',
    });
  },
};

// ============================================
// Analysis Cache
// ============================================

export const apiCache = {
  get(hash: string) {
    return apiFetch<{ success: boolean; result: unknown }>(`/cache/${hash}`);
  },

  set(hash: string, result: unknown) {
    return apiFetch<{ success: boolean; message: string }>('/cache', {
      method: 'POST',
      body: JSON.stringify({ hash, result }),
    });
  },

  clear() {
    return apiFetch<{ success: boolean; message: string }>('/cache', {
      method: 'DELETE',
    });
  },
};

// ============================================
// MuJoCo Simulation
// ============================================

export const apiSimulation = {
  run(request: unknown) {
    return apiFetch<{ success: boolean; replay?: import('@/types').ReplayData; message?: string }>('/simulation/run', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },
};
