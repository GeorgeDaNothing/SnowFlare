# Horizon Pulse — Implementation Checklist

> Snowboarding move simulation and danger identification platform.
> Approach: **Rule-Based Core + AI Enhancement**

---

## Phase 1 — Data Layer & Schemas ✅

- [x] Define all TypeScript interfaces in `src/types/` (move, session, rider, analysis)
- [x] Create `src/lib/storage.ts` — localStorage CRUD service for all JSON stores
- [x] Create `src/lib/hash.ts` — deterministic hash for analysis cache keys
- [x] Create `src/components/DebugPanel.tsx` — collapsible raw JSON viewer/editor for development
- [x] Wire DebugPanel into Layout (visible in dev mode)

**Storage Keys:**
- `hp_moves` — saved move presets
- `hp_sessions` — logged practice sessions
- `hp_rider_profile` — persistent rider info
- `hp_analysis_cache` — cached AI responses

---

## Phase 2 — Rule-Based Analysis Engine ✅

- [x] Create `src/lib/physics.ts` — deterministic physics calculations (airtime, velocity, impact force)
- [x] Create `src/lib/riskEngine.ts` — rule-based risk scoring system
  - [x] Rotation risk matrix (degrees × experience level)
  - [x] Inversion risk matrix (depth × flip type)
  - [x] Landing risk formula (speed, angle, snow condition, kicker geometry)
  - [x] Fatigue multiplier
  - [x] Environment multipliers
- [x] Create `src/lib/promptBuilder.ts` — builds Gemini prompts from `MoveAnalysisRequest`

---

## Phase 3 — AI Integration (Gemini) ✅

- [x] Create `src/lib/gemini.ts` — wrapper around `@google/genai`
  - [x] Handles API key from env
  - [x] Rate limiting / debouncing
  - [x] Error handling (network, quota, malformed response)
  - [x] Fallback to rule-based-only when AI unavailable
- [x] Implement `analyzeMoveWithAI(request)` → `MoveAnalysisResponse`
  - [x] Send structured prompt with JSON schema
  - [x] Parse JSON response with validation
  - [x] Merge AI output with rule-based physics (AI language + rule numbers)
- [x] Implement `analyzeSessionTrends(sessions)` → `SessionTrendAnalysisResponse`
- [x] Cache successful AI responses in `hp_analysis_cache`

---

## Phase 4 — Move Designer Enhancement ✅

- [x] Expand MoveDesigner controls:
  - [x] Flip type selector (none, backflip, frontflip, cork, double-cork, triple-cork, rodeo)
  - [x] Direction toggle (frontside/backside)
  - [x] Grab type expanded to full list + grab duration slider
  - [x] Kicker config editor (type, angles, dimensions)
  - [x] Rider quick-stats panel (editable if logged in)
  - [x] Session context (attempt number, weather, visibility, temperature, fatigue)
- [x] Add "Analyze Move" button that triggers analysis
- [x] Add analysis results panel (risk score meter, physics preview, risk factors list)
- [x] Add "Save Preset" button → stores to `hp_moves`
- [x] Add prerequisite moves checklist based on analysis output

---

## Phase 5 — Session Logger View (`/sessions`) ✅

- [x] Create `src/views/Sessions.tsx` — new route `/sessions`
- [x] Session list view with filtering (date, move, landed, injury)
- [x] Session detail view with pre/post analysis comparison
- [x] New session form (date, location, weather, moves attempted with outcomes)
- [x] "Add Move to Session" picker that loads from saved presets
- [x] Outcome logging: landed (yes/no), injury (type/severity), fatigue, notes
- [x] Update Sidebar `/sessions` link to real route

---

## Phase 6 — Dashboard with Real Data ✅

- [x] Replace static Dashboard with dynamic content from storage
- [x] Display recent sessions list from `hp_sessions`
- [x] Show risk trend comparison (recent 3 vs previous 3 sessions)
- [x] Show personal stats: total attempts, landing rate, injury rate, most practiced move
- [x] Use authenticated user's name instead of hardcoded "Marcus"
- [x] Add "Quick Analyze" card that jumps to MoveDesigner
- [x] Empty state for first-time users

---

## Phase 7 — Analysis Studio (Video Upload) ⏳

- [ ] Implement actual file drop + video element playback
- [ ] Extract key frames from video (client-side canvas)
- [ ] Send frames to Gemini for pose estimation (if API supports)
- [ ] Display frame-by-frame pose overlay on video
- [ ] Compare detected pose to ideal form from move config
- [ ] Mark as "Phase 2" — implement after core move analysis is solid

---

## Phase 8 — Polish & Integration ⏳

- [ ] Wire "Start Simulation" buttons across app to launch MoveDesigner
- [ ] Add loading states for AI analysis (skeleton UI, progress indicators)
- [ ] Add error states when AI fails (show rule-based results + retry button)
- [ ] Ensure all new views are behind `ProtectedRoute`
- [ ] Update Sidebar navigation to match implemented routes
- [ ] Add empty states for first-time users on all views
- [ ] Responsive design pass on all new components
- [ ] Remove remaining static/hardcoded data from VideoAnalysis view
- [ ] Remove remaining static/hardcoded data from AnalysisStudio view

---

## AI Input / Output Schemas

### Move Analysis Request → AI

```typescript
interface MoveAnalysisRequest {
  move: {
    name: string;
    rotationDegrees: number;         // 0 – 1440
    inversionDepth: number;          // 0 – 100
    flipType: 'none' | 'backflip' | 'frontflip' | 'rodeo' | 'cork' | 'double-cork' | 'triple-cork';
    direction: 'frontside' | 'backside';
    grabType: 'indy' | 'melon' | 'mute' | 'stalefish' | 'tail' | 'nose' | 'japan' | 'method' | 'seatbelt' | 'truck_driver' | null;
    grabDurationPct: number;         // 0-100
  };
  kicker: {
    type: 'big-air' | 'slopestyle' | 'halfpipe' | 'rail' | 'kicker';
    takeoffAngle: number;
    landingAngle: number;
    tableLength: number;
    verticalDrop: number;
    snowCondition: 'powder' | 'packed' | 'icy' | 'slush' | 'corduroy';
  };
  rider: {
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'pro';
    heightCm: number;
    weightKg: number;
    stance: 'regular' | 'goofy';
    dominantFoot: 'left' | 'right';
    yearsExperience: number;
    recentInjuries: string[];
  };
  context: {
    attemptNumber: number;
    previousSuccessRate: number;
    weather: 'clear' | 'cloudy' | 'foggy' | 'snowing' | 'windy';
    visibility: 'excellent' | 'good' | 'fair' | 'poor';
    temperatureC: number;
    fatigueLevel: number;            // 0-10
  };
}
```

### Move Analysis Response

```typescript
interface MoveAnalysisResponse {
  overallRiskScore: number;          // 0-100
  dangerLevel: 'low' | 'moderate' | 'high' | 'extreme';
  landingConfidence: number;         // 0-100
  physics: {
    estimatedAirTimeSec: number;
    estimatedMaxHeightM: number;
    estimatedLandingVelocityMs: number;
    estimatedImpactForceG: number;
    requiredApproachSpeedKmh: number;
    rotationSpeedRequiredDs: number;
  };
  riskFactors: Array<{
    category: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    description: string;
    recommendation: string;
  }>;
  improvements: Array<{
    area: string;
    currentValue: string;
    suggestedValue: string;
    expectedBenefit: string;
    difficultyToImplement: 'easy' | 'medium' | 'hard';
  }>;
  coachInsight: string;
  prerequisiteMoves: string[];
  nextProgressionMoves: string[];
  analysisConfidence: number;
  source: 'rule' | 'ai' | 'hybrid';
}
```

### Session Trend Analysis

```typescript
interface SessionTrendAnalysisRequest {
  rider: { experienceLevel: string; yearsExperience: number };
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

interface SessionTrendAnalysisResponse {
  patternInsights: Array<{ pattern: string; evidence: string; severity: 'insight' | 'warning' | 'alert' }>;
  personalizedRecommendations: string[];
  riskTrend: 'improving' | 'stable' | 'worsening';
  dangerFactorsOverTime: Array<{ factor: string; trend: 'increasing' | 'decreasing' | 'stable' }>;
}
```

---

## Architecture

```
React SPA
├── Views
│   ├── MoveDesigner        → move config + analysis results
│   ├── Sessions            → log/list/view sessions
│   ├── Dashboard           → stats + insights
│   ├── VideoAnalysis       → static UI (Phase 7)
│   ├── AnalysisStudio      → upload UI (Phase 7)
│   └── Auth pages          → login/register/forgot/reset
│
├── Services
│   ├── riskEngine.ts       → rule-based scoring (offline, instant)
│   ├── physics.ts          → projectile motion calculations
│   ├── gemini.ts           → AI wrapper with fallback
│   ├── promptBuilder.ts    → structured prompt generation
│   ├── storage.ts          → localStorage CRUD
│   └── hash.ts             → deterministic cache keys
│
└── Storage (localStorage)
    ├── hp_moves            → SavedMove[]
    ├── hp_sessions         → Session[]
    ├── hp_rider_profile    → RiderProfile
    └── hp_analysis_cache   → AnalysisCache
```
