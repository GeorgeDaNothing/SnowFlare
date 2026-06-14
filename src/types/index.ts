// ============================================
// Move Configuration & Analysis Types
// ============================================

export type FlipType = 'none' | 'backflip' | 'frontflip' | 'rodeo' | 'cork' | 'double-cork' | 'triple-cork';
export type Direction = 'frontside' | 'backside';
export type GrabType = 'indy' | 'melon' | 'mute' | 'stalefish' | 'tail' | 'nose' | 'japan' | 'method' | 'seatbelt' | 'truck_driver' | null;
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'pro';
export type Stance = 'regular' | 'goofy';
export type KickerType = 'big-air' | 'slopestyle' | 'halfpipe' | 'rail' | 'kicker';
export type SnowCondition = 'powder' | 'packed' | 'icy' | 'slush' | 'corduroy';
export type Weather = 'clear' | 'cloudy' | 'foggy' | 'snowing' | 'windy';
export type WindDirection = 'tailwind' | 'headwind' | 'right-crosswind' | 'left-crosswind';
export type Visibility = 'excellent' | 'good' | 'fair' | 'poor';
export type DangerLevel = 'low' | 'moderate' | 'high' | 'extreme';
export type Severity = 'info' | 'warning' | 'critical';

export interface MoveConfig {
  name: string;
  rotationDegrees: number;
  inversionDepth: number;
  flipType: FlipType;
  direction: Direction;
  grabType: GrabType;
  grabDurationPct: number;
}

export interface KickerConfig {
  type: KickerType;
  takeoffAngle: number;
  landingAngle: number;
  tableLength: number;
  verticalDrop: number;
  snowCondition: SnowCondition;
}

export interface RiderProfile {
  name: string;
  experienceLevel: ExperienceLevel;
  yearsExperience: number;
  heightCm: number;
  weightKg: number;
  stance: Stance;
  dominantFoot: 'left' | 'right';
  preferredDiscipline: string;
  recentInjuries: string[];
}

export interface SessionContext {
  attemptNumber: number;
  previousSuccessRate: number;
  weather: Weather;
  windDirection: WindDirection;
  visibility: Visibility;
  temperatureC: number;
  fatigueLevel: number;
}

export interface MoveAnalysisRequest {
  move: MoveConfig;
  kicker: KickerConfig;
  rider: RiderProfile;
  context: SessionContext;
}

// ============================================
// Physics Estimates
// ============================================

export interface PhysicsEstimate {
  estimatedAirTimeSec: number;
  estimatedMaxHeightM: number;
  estimatedLandingVelocityMs: number;
  estimatedImpactForceG: number;
  requiredApproachSpeedKmh: number;
  rotationSpeedRequiredDs: number;
}

// ============================================
// Analysis Response
// ============================================

export interface RiskFactor {
  category: 'rotation' | 'inversion' | 'landing' | 'speed' | 'environment' | 'fatigue' | 'experience-match' | 'grab-timing';
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
}

export interface ImprovementSuggestion {
  area: string;
  currentValue: string;
  suggestedValue: string;
  expectedBenefit: string;
  difficultyToImplement: 'easy' | 'medium' | 'hard';
}

export interface MoveAnalysisResponse {
  overallRiskScore: number;
  dangerLevel: DangerLevel;
  landingConfidence: number;
  physics: PhysicsEstimate;
  riskFactors: RiskFactor[];
  improvements: ImprovementSuggestion[];
  coachInsight: string;
  prerequisiteMoves: string[];
  nextProgressionMoves: string[];
  analysisConfidence: number;
  source: 'rule' | 'ai' | 'hybrid';
  generatedAt: string;
}

// ============================================
// Preset Types
// ============================================

export interface PersonalPreset {
  id: string;
  name: string;
  weightKg: number;
  heightCm: number;
  experienceLevel: ExperienceLevel;
  stance: Stance;
}

export interface BoardPreset {
  id: string;
  name: string;
  brand: string;
  model: string;
  lengthCm: number;
  flex: string;
  shape: string;
}

export interface SnowTrailPreset {
  id: string;
  name: string;
  difficulty: string;
  kickerType: KickerType;
  takeoffAngle: number;
  landingAngle: number;
  tableLength: number;
  verticalDrop: number;
  snowCondition: SnowCondition;
}

export interface PresetsCollection {
  personal: PersonalPreset[];
  board: BoardPreset[];
  trails: SnowTrailPreset[];
}

// ============================================
// Training Log Types (replaces Session)
// ============================================

export interface TrainingLogMoveAttempt {
  moveId: string;
  moveName: string;
  config: MoveAnalysisRequest;
  preAnalysisRiskScore: number;
  landed: boolean;
  injuryOccurred: boolean;
  injuryType: string | null;
  fatigueLevel: number;
  postNotes: string;
}

export interface TrainingLog {
  id: string;
  date: string;
  location: string;
  weather: string;
  windSpeedKmh: number;
  snowQuality: string;
  temperatureC: number;
  notes: string;
  isFavorite: boolean;
  videos: string[];
  moves: TrainingLogMoveAttempt[];
}

// ============================================
// Storage Types
// ============================================

export interface SavedMove {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  config: MoveAnalysisRequest;
  lastAnalysis: MoveAnalysisResponse | null;
}

export interface AnalysisCacheEntry {
  response: MoveAnalysisResponse;
  cachedAt: string;
}

export interface AnalysisCache {
  [requestHash: string]: AnalysisCacheEntry;
}

// ============================================
// Session Trend Analysis Types
// ============================================

export interface SessionTrendAnalysisRequest {
  rider: {
    experienceLevel: string;
    yearsExperience: number;
  };
  sessions: Array<{
    date: string;
    movesAttempted: Array<{
      moveName: string;
      riskScore: number;
      landed: boolean;
      injuryOccurred: boolean;
      injuryType: string | null;
      fatigueLevel: number;
      weather: string;
    }>;
  }>;
}

export interface PatternInsight {
  pattern: string;
  evidence: string;
  severity: 'insight' | 'warning' | 'alert';
}

export interface DangerFactorTrend {
  factor: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface SessionTrendAnalysisResponse {
  patternInsights: PatternInsight[];
  personalizedRecommendations: string[];
  riskTrend: 'improving' | 'stable' | 'worsening';
  dangerFactorsOverTime: DangerFactorTrend[];
}

// ============================================
// MuJoCo Simulation Replay Types
// ============================================

export interface ReplayFrame {
  time: number;
  phase: string;
  body_control: { compression: number; forward_lean: number };
  position: [number, number, number];
  quaternion: [number, number, number, number]; // x, y, z, w (Three.js order)
  velocity: [number, number, number];
  angular_velocity: [number, number, number];
}

export interface ReplayMetadata {
  schema_version: number;
  duration: number;
  simulation_timestep: number;
  frame_stride: number;
  coordinate_system: string;
}

export interface ReplayConfigPoint {
  label: string;
  position: [number, number, number];
}

export interface ReplayData {
  metadata: ReplayMetadata;
  config_points: ReplayConfigPoint[];
  profile_vertices: Array<[number, number, number]>;
  profile_faces: Array<[number, number, number]>;
  frames: ReplayFrame[];
}

export interface SimulationRunResponse {
  success: boolean;
  replay?: ReplayData;
  message?: string;
}
