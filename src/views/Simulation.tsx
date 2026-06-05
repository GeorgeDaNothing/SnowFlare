import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Wind,
  Thermometer,
  Cloud,
  Snowflake,
  Mountain,
  Layers,
  User,
  ChevronRight,
  ChevronLeft,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeMoveFast } from '@/lib/openai';
import { saveTrainingLog, getPresets, getMoves } from '@/lib/storage';
import type { MoveAnalysisRequest, MoveAnalysisResponse, TrainingLog, MoveConfig } from '@/types';

const WEATHER_OPTIONS = ['clear', 'cloudy', 'foggy', 'snowing', 'windy'] as const;
const SNOW_QUALITY_OPTIONS = ['powder', 'packed', 'icy', 'slush', 'corduroy'] as const;
const WIND_DIRECTIONS = ['tailwind', 'headwind', 'right-crosswind', 'left-crosswind'] as const;
const FLIP_TYPES = ['none', 'backflip', 'frontflip', 'rodeo', 'cork', 'double-cork', 'triple-cork'] as const;
const GRAB_TYPES = ['indy', 'melon', 'mute', 'stalefish', 'tail', 'nose', 'japan', 'method', 'seatbelt', 'truck_driver'] as const;

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export function Simulation() {
  const [step, setStep] = useState(1);
  const [environment, setEnvironment] = useState({
    weather: 'clear' as string,
    windSpeedKmh: 10,
    windDirection: 'tailwind' as string,
    snowQuality: 'packed' as string,
    temperatureC: -5,
  });
  const [moveConfig, setMoveConfig] = useState<MoveConfig>({
    name: 'Custom Move',
    rotationDegrees: 720,
    inversionDepth: 30,
    flipType: 'cork',
    direction: 'frontside',
    grabType: 'indy',
    grabDurationPct: 60,
  });
  const [selectedTrail, setSelectedTrail] = useState<any>(null);
  const [selectedRider, setSelectedRider] = useState<any>(null);
  const [selectedBoard, setSelectedBoard] = useState<any>(null);
  const [results, setResults] = useState<MoveAnalysisResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [saved, setSaved] = useState(false);

  const presets = getPresets();
  const savedMoves = getMoves();

  const updateMove = (patch: Partial<MoveConfig>) => {
    setMoveConfig((prev) => {
      const next = { ...prev, ...patch };
      if (!patch.name) {
        next.name = generateMoveName(next);
      }
      return next;
    });
  };

  const loadMovePreset = (moveId: string) => {
    const preset = savedMoves.find((m) => m.id === moveId);
    if (!preset) return;
    setMoveConfig(preset.config.move);
  };

  const runSimulation = useCallback(() => {
    if (!selectedTrail || !selectedRider) return;
    setIsSimulating(true);

    const request: MoveAnalysisRequest = {
      move: moveConfig,
      kicker: {
        type: selectedTrail.kickerType,
        takeoffAngle: selectedTrail.takeoffAngle,
        landingAngle: selectedTrail.landingAngle,
        tableLength: selectedTrail.tableLength,
        verticalDrop: selectedTrail.verticalDrop,
        snowCondition: selectedTrail.snowCondition,
      },
      rider: {
        name: selectedRider.name,
        experienceLevel: selectedRider.experienceLevel,
        yearsExperience: 2,
        heightCm: selectedRider.heightCm,
        weightKg: selectedRider.weightKg,
        stance: selectedRider.stance,
        dominantFoot: selectedRider.dominantFoot,
        preferredDiscipline: 'Freestyle',
        recentInjuries: [],
      },
      context: {
        attemptNumber: 1,
        previousSuccessRate: 0.6,
        weather: environment.weather as any,
        windDirection: environment.windDirection as any,
        visibility: 'good',
        temperatureC: environment.temperatureC,
        fatigueLevel: 3,
      },
    };

    const res = analyzeMoveFast(request);
    setResults(res);
    setIsSimulating(false);
    setStep(4);

    // Auto-save to training log
    const log: TrainingLog = {
      id: generateId(),
      date: new Date().toISOString().slice(0, 10),
      location: selectedTrail.name || 'Unknown Trail',
      weather: environment.weather,
      windSpeedKmh: environment.windSpeedKmh,
      snowQuality: environment.snowQuality,
      temperatureC: environment.temperatureC,
      notes: `Simulation with ${selectedBoard?.name || 'default board'}. Wind: ${environment.windDirection}.`,
      isFavorite: false,
      videos: [],
      moves: [{
        moveId: generateId(),
        moveName: moveConfig.name,
        config: request,
        preAnalysisRiskScore: res.overallRiskScore,
        landed: true,
        injuryOccurred: false,
        injuryType: null,
        fatigueLevel: 3,
        postNotes: '',
      }],
    };
    saveTrainingLog(log);
  }, [moveConfig, selectedTrail, selectedRider, selectedBoard, environment]);

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-12 py-8">
      <header className="mb-8">
        <span className="text-primary font-bold tracking-widest text-[10px] uppercase block mb-2">Simulation</span>
        <h1 className="text-4xl font-bold tracking-tight text-on-surface">Start Simulation</h1>
        <p className="text-on-surface-variant text-sm mt-1">Configure your environment, design your move, choose presets, and analyze risk.</p>
      </header>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors', step >= s ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant')}>
              {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            {s < 4 && <div className={cn('flex-1 h-1 rounded-full transition-colors', step > s ? 'bg-primary' : 'bg-surface-container-high')} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Environment */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 space-y-6">
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2"><Cloud className="w-5 h-5 text-primary" /> Environment</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Weather</label>
                <div className="flex flex-wrap gap-2">
                  {WEATHER_OPTIONS.map((w) => (
                    <button key={w} onClick={() => setEnvironment((prev) => ({ ...prev, weather: w }))} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-colors', environment.weather === w ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>
                      {w}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Snow Quality</label>
                <div className="flex flex-wrap gap-2">
                  {SNOW_QUALITY_OPTIONS.map((s) => (
                    <button key={s} onClick={() => setEnvironment((prev) => ({ ...prev, snowQuality: s }))} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-colors', environment.snowQuality === s ? 'bg-tertiary text-on-tertiary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Wind Direction</label>
              <div className="grid grid-cols-4 gap-2">
                {WIND_DIRECTIONS.map((d) => (
                  <button key={d} onClick={() => setEnvironment((prev) => ({ ...prev, windDirection: d }))} className={cn('px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-colors border', environment.windDirection === d ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container text-on-surface-variant border-outline-variant/10 hover:bg-surface-container-high')}>
                    {d.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Wind Speed</label>
                <div className="flex items-center gap-3">
                  <Wind className="w-4 h-4 text-on-surface-variant" />
                  <input type="range" min={0} max={80} value={environment.windSpeedKmh} onChange={(e) => setEnvironment((prev) => ({ ...prev, windSpeedKmh: parseInt(e.target.value) }))} className="flex-1 h-2 bg-surface-container rounded-full appearance-none cursor-pointer accent-primary" />
                  <span className="text-xs font-bold text-primary w-12 text-right">{environment.windSpeedKmh} km/h</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Temperature</label>
                <div className="flex items-center gap-3">
                  <Thermometer className="w-4 h-4 text-on-surface-variant" />
                  <input type="range" min={-25} max={15} value={environment.temperatureC} onChange={(e) => setEnvironment((prev) => ({ ...prev, temperatureC: parseInt(e.target.value) }))} className="flex-1 h-2 bg-surface-container rounded-full appearance-none cursor-pointer accent-primary" />
                  <span className="text-xs font-bold text-primary w-12 text-right">{environment.temperatureC}°C</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setStep(2)} className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Configure Move */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4"><RotateCcw className="w-5 h-5 text-primary" /> Configure Your Move</h2>

              {savedMoves.length > 0 && (
                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Load from Preset</label>
                  <div className="flex flex-wrap gap-2">
                    {savedMoves.map((m) => (
                      <button key={m.id} onClick={() => loadMovePreset(m.id)} className="px-3 py-1.5 bg-surface-container-high rounded-lg text-xs font-medium text-on-surface hover:bg-primary hover:text-on-primary transition-colors border border-outline-variant/10">
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Move Name</label>
                  <input type="text" value={moveConfig.name} onChange={(e) => updateMove({ name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Direction</label>
                    <div className="flex rounded-lg overflow-hidden border border-outline-variant/20">
                      {(['frontside', 'backside'] as const).map((d) => (
                        <button key={d} onClick={() => updateMove({ direction: d })} className={cn('flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors', moveConfig.direction === d ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Flip Type</label>
                    <select value={moveConfig.flipType} onChange={(e) => updateMove({ flipType: e.target.value as any })} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary transition-colors">
                      {FLIP_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
                <SliderControl label="Rotation" value={moveConfig.rotationDegrees} min={0} max={1440} step={180} unit="°" onChange={(v) => updateMove({ rotationDegrees: v })} />
                <SliderControl label="Inversion Depth" value={moveConfig.inversionDepth} min={0} max={100} unit="%" onChange={(v) => updateMove({ inversionDepth: v })} />
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Grab</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    <button onClick={() => updateMove({ grabType: null })} className={cn('py-2 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-colors', moveConfig.grabType === null ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>None</button>
                    {GRAB_TYPES.map((g) => (
                      <button key={g} onClick={() => updateMove({ grabType: g })} className={cn('py-2 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-colors', moveConfig.grabType === g ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                {moveConfig.grabType && (
                  <SliderControl label="Grab Duration" value={moveConfig.grabDurationPct} min={0} max={100} unit="%" onChange={(v) => updateMove({ grabDurationPct: v })} />
                )}
              </div>


            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-6 py-2.5 bg-surface-container-high text-on-surface font-bold rounded-lg flex items-center gap-2 hover:bg-surface-container-highest transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep(3)} className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Choose Presets */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            {/* Snow Trail */}
            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4"><Mountain className="w-5 h-5 text-primary" /> Snow Trail</h2>
              {presets.trails.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No trails saved. <a href="#/presets" className="text-primary font-bold hover:underline">Create one in Presets</a>.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {presets.trails.map((trail: any) => (
                    <button key={trail.id} onClick={() => setSelectedTrail(trail)} className={cn('p-4 rounded-lg border text-left transition-colors', selectedTrail?.id === trail.id ? 'bg-primary/5 border-primary' : 'bg-surface-container-high border-outline-variant/10 hover:bg-surface-container-highest')}>
                      <h3 className="text-sm font-bold text-on-surface">{trail.name}</h3>
                      <p className="text-xs text-on-surface-variant">{trail.difficulty} • {trail.kickerType}</p>
                      <p className="text-xs text-on-surface-variant mt-1">{trail.verticalDrop}m drop • {trail.snowCondition}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Rider */}
            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4"><User className="w-5 h-5 text-primary" /> Rider</h2>
              {presets.personal.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No rider profiles saved. <a href="#/presets" className="text-primary font-bold hover:underline">Create one in Presets</a>.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {presets.personal.map((p: any) => (
                    <button key={p.id} onClick={() => setSelectedRider(p)} className={cn('px-4 py-2 rounded-lg border text-sm font-medium transition-colors', selectedRider?.id === p.id ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-high text-on-surface border-outline-variant/10 hover:bg-surface-container-highest')}>
                      {p.name} • {p.weightKg}kg • {p.experienceLevel}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Board */}
            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4"><Layers className="w-5 h-5 text-primary" /> Board</h2>
              {presets.board.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No boards saved. <a href="#/presets" className="text-primary font-bold hover:underline">Create one in Presets</a>.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {presets.board.map((b: any) => (
                    <button key={b.id} onClick={() => setSelectedBoard(b)} className={cn('px-4 py-2 rounded-lg border text-sm font-medium transition-colors', selectedBoard?.id === b.id ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-high text-on-surface border-outline-variant/10 hover:bg-surface-container-highest')}>
                      {b.name} • {b.lengthCm}cm • {b.flex}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Review */}
            <div className="bg-surface-container-high rounded-xl p-5 border border-outline-variant/10">
              <h3 className="text-sm font-bold text-on-surface mb-3">Simulation Summary</h3>
              <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant">
                <span>Move: <span className="font-bold text-on-surface">{moveConfig.name}</span></span>
                <span>Trail: <span className="font-bold text-on-surface">{selectedTrail?.name || '—'}</span></span>
                <span>Rider: <span className="font-bold text-on-surface">{selectedRider?.name || '—'}</span></span>
                <span>Board: <span className="font-bold text-on-surface">{selectedBoard?.name || '—'}</span></span>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-6 py-2.5 bg-surface-container-high text-on-surface font-bold rounded-lg flex items-center gap-2 hover:bg-surface-container-highest transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={runSimulation} disabled={isSimulating || !selectedTrail || !selectedRider} className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isSimulating ? <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                {isSimulating ? 'Simulating...' : 'Run Simulation'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Results */}
        {step === 4 && results && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            {/* Summary */}
            <div className={cn('p-6 rounded-xl border flex items-center justify-between', results.dangerLevel === 'extreme' || results.dangerLevel === 'high' ? 'bg-error-container border-error/20' : 'bg-green-50 border-green-200')}>
              <div>
                <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  {results.dangerLevel === 'extreme' || results.dangerLevel === 'high' ? <AlertTriangle className="w-5 h-5 text-error" /> : <ShieldCheck className="w-5 h-5 text-green-600" />}
                  Simulation Complete
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">Move: {moveConfig.name} • Auto-saved to Training Log</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-on-surface">{results.overallRiskScore}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Risk Score</p>
              </div>
            </div>

            {/* Physics */}
            <div className="grid grid-cols-4 gap-3">
              <StatBadge label="Air Time" value={`${results.physics.estimatedAirTimeSec}s`} />
              <StatBadge label="Max Height" value={`${results.physics.estimatedMaxHeightM}m`} />
              <StatBadge label="Impact" value={`${results.physics.estimatedImpactForceG}G`} warn={results.physics.estimatedImpactForceG > 5} />
              <StatBadge label="Landing Speed" value={`${results.physics.estimatedLandingVelocityMs}m/s`} />
            </div>

            {/* Risk Factors */}
            {results.riskFactors.length > 0 && (
              <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 space-y-3">
                <h3 className="text-sm font-black uppercase tracking-widest text-on-surface-variant">Risk Factors</h3>
                {results.riskFactors.map((rf, i) => (
                  <div key={i} className={cn('p-3 rounded-lg border text-xs', rf.severity === 'critical' ? 'bg-error-container border-error/20' : rf.severity === 'warning' ? 'bg-orange-50 border-orange-200' : 'bg-surface-container-high border-outline-variant/10')}>
                    <div className="flex items-center gap-2 mb-1">
                      {rf.severity === 'critical' ? <AlertTriangle className="w-3.5 h-3.5 text-error" /> : <Activity className="w-3.5 h-3.5 text-on-surface-variant" />}
                      <span className={cn('font-bold', rf.severity === 'critical' ? 'text-error' : 'text-on-surface')}>{rf.title}</span>
                    </div>
                    <p className="text-on-surface-variant mb-1">{rf.description}</p>
                    <p className="text-primary font-medium">{rf.recommendation}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Coach Insight */}
            {results.coachInsight && (
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-sm text-on-surface leading-relaxed">{results.coachInsight}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => { setStep(1); setResults(null); }} className="flex-1 py-3 bg-surface-container-high text-on-surface font-bold rounded-lg hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2">
                <RotateCw className="w-4 h-4" /> New Simulation
              </button>
              <a href="/training-log" className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-center">
                View Training Log <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function SliderControl({ label, value, min, max, step = 1, unit, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (val: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</label>
        <span className="text-xs font-bold text-primary">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full h-2 bg-surface-container rounded-full appearance-none cursor-pointer accent-primary" />
    </div>
  );
}

function StatBadge({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="bg-surface-container-high rounded-lg p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className={cn('text-lg font-bold text-on-surface', warn && 'text-error')}>{value}</p>
    </div>
  );
}

function generateMoveName(move: MoveConfig): string {
  const dir = move.direction === 'frontside' ? 'fs' : 'bs';
  const rot = move.rotationDegrees >= 1080 ? `${move.rotationDegrees}` : move.rotationDegrees >= 720 ? `${move.rotationDegrees}` : move.rotationDegrees >= 540 ? `${move.rotationDegrees}` : move.rotationDegrees >= 360 ? '360' : move.rotationDegrees >= 180 ? '180' : 'straight';
  const flip = move.flipType === 'none' ? '' : move.flipType === 'cork' ? '_cork' : move.flipType === 'double-cork' ? '_dblcork' : move.flipType === 'triple-cork' ? '_tricork' : `_${move.flipType}`;
  const grab = move.grabType ? `_${move.grabType}` : '';
  return `${dir}${flip}_${rot}${grab}`;
}
