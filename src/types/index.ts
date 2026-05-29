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
// Session Logging Types
// ============================================

export interface SessionMoveAttempt {
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

export interface Session {
  id: string;
  date: string;
  location: string;
  weather: string;
  notes: string;
  moves: SessionMoveAttempt[];
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
