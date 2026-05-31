# Horizon Pulse — Implementation Checklist

> Snowboarding move simulation and danger identification platform.
> Approach: **Rule-Based Core + AI Enhancement**

---

## New User Workflow

### Simulation (`/` — replaces Home/Dashboard)
Multi-step wizard that replaces the static home page:

**Step 1 — Environment**
- [ ] Weather (clear, cloudy, foggy, snowing, windy)
- [ ] Wind speed (km/h)
- [ ] Snow quality (powder, packed, icy, slush, corduroy)
- [ ] Temperature (°C)

**Step 2 — Choose Presets**
- [ ] Select snow trail (from saved presets)
- [ ] Select rider profile (weight, height, experience, stance)
- [ ] Select board (from saved presets)

**Step 3 — Planned Moves**
- [ ] Select from saved move presets
- [ ] Or configure a new move on the spot
- [ ] Review all selected moves

**Step 4 — Start Simulation**
- [ ] Run analysis on all planned moves
- [ ] Display combined risk assessment
- [ ] Show physics preview
- [ ] Show risk factors and recommendations

**Step 5 — Results & Auto-Save**
- [ ] Review simulation results
- [ ] Auto-save to Training Log
- [ ] Option to re-run or start over

### Training Log (`/training-log` — was `/sessions`)
- [ ] Rename from "Session Log" / "Sessions"
- [ ] List view with filters (all / landed / crashed / injured / favorites)
- [ ] Favorite toggle on each training log
- [ ] Attach training videos to each log (file upload)
- [ ] Detail view with full attempt history + videos
- [ ] Create form with environment, presets, moves, outcomes

### Presets (`/presets` — was `/gear`)
- [ ] Personal Info: weight, height, experience level, stance, dominant foot
- [ ] Board Info: brand, model, length, flex, shape
- [ ] Snow Trails: name, difficulty, kicker config, landing config, snow condition
- [ ] Save/load/manage presets

---

## Data Model Changes

### TrainingLog (replaces Session)
```typescript
interface TrainingLog {
  id: string;
  date: string;
  location: string;
  weather: string;
  windSpeedKmh: number;
  snowQuality: string;
  temperatureC: number;
  notes: string;
  isFavorite: boolean;
  videos: string[]; // base64 data URLs or blob URLs
  moves: TrainingLogMoveAttempt[];
}
```

### Presets
```typescript
interface PersonalPreset {
  name: string;
  weightKg: number;
  heightCm: number;
  experienceLevel: string;
  stance: string;
  dominantFoot: string;
}

interface BoardPreset {
  name: string;
  brand: string;
  model: string;
  lengthCm: number;
  flex: string;
  shape: string;
}

interface SnowTrailPreset {
  id: string;
  name: string;
  difficulty: string;
  kickerType: string;
  takeoffAngle: number;
  landingAngle: number;
  tableLength: number;
  verticalDrop: number;
  snowCondition: string;
}
```

### Storage Keys
- `hp_training_logs` — TrainingLog[]
- `hp_presets` — { personal: PersonalPreset[], board: BoardPreset[], trails: SnowTrailPreset[] }
- `hp_moves` — SavedMove[]
- `hp_analysis_cache` — AnalysisCache

---

## Implementation Checklist

### Phase A — Rename & Refactor
- [ ] Rename `Session` → `TrainingLog` in types, storage, views
- [ ] Rename `hp_sessions` → `hp_training_logs` in storage
- [ ] Rename `/sessions` route → `/training-log`
- [ ] Rename "Session Log" sidebar → "Training Log"
- [ ] Rename "Gear Lab" sidebar → "Presets"
- [ ] Update Dashboard to link to new routes

### Phase B — Simulation View (`/`)
- [ ] Create `src/views/Simulation.tsx` multi-step wizard
- [ ] Step 1: Environment form (weather, wind, snow, temp)
- [ ] Step 2: Preset picker (trail, rider, board)
- [ ] Step 3: Move selector (saved presets + quick config)
- [ ] Step 4: Run analysis on all moves
- [ ] Step 5: Results view with auto-save to Training Log
- [ ] Wire `/` route to Simulation

### Phase C — Presets View (`/presets`)
- [ ] Create `src/views/Presets.tsx`
- [ ] Personal info form + list
- [ ] Board info form + list
- [ ] Snow trail form + list (with kicker config)
- [ ] Storage service for presets

### Phase D — Training Log Enhancements
- [ ] Add `isFavorite` flag to TrainingLog
- [ ] Add `videos` array to TrainingLog
- [ ] Favorite toggle in list and detail views
- [ ] Video upload (file input → base64 or object URL)
- [ ] Video player in detail view
- [ ] Filter by favorites

### Phase E — Sidebar & Navigation
- [ ] Update nav items: Simulation, Training Log, Technique Library, Presets
- [ ] Update TopNav links
- [ ] Ensure all routes are protected

---

## Completed Earlier Phases

### Phase 1 — Data Layer & Schemas ✅
- [x] Define all TypeScript interfaces in `src/types/`
- [x] Create `src/lib/storage.ts` — localStorage CRUD service
- [x] Create `src/lib/hash.ts` — deterministic hash for cache keys
- [x] Create `src/components/DebugPanel.tsx`

### Phase 2 — Rule-Based Analysis Engine ✅
- [x] Create `src/lib/physics.ts`
- [x] Create `src/lib/riskEngine.ts`
- [x] Create `src/lib/promptBuilder.ts`

### Phase 3 — AI Integration (OpenAI) ✅
- [x] Create `src/lib/openai.ts` — wrapper around OpenAI SDK
- [x] Implement `analyzeMoveWithAI(request)`
- [x] Implement `analyzeSessionTrends(sessions)`
- [x] Cache successful AI responses

### Phase 4 — Move Designer ✅
- [x] Full move config controls
- [x] Analysis results panel
- [x] Save preset button

### Phase 5 — Sessions (old) ✅
- [x] List, detail, create form

### Phase 6 — Dashboard (old) ✅
- [x] Dynamic stats from storage
