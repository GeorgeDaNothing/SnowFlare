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
  Save,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeMoveFast } from '@/lib/openai';
import { saveTrainingLog, getPresets, getMoves } from '@/lib/storage';
import type { MoveAnalysisRequest, MoveAnalysisResponse, TrainingLog, SnowTrailPreset, PersonalPreset, BoardPreset } from '@/types';

const WEATHER_OPTIONS = ['clear', 'cloudy', 'foggy', 'snowing', 'windy'] as const;
const SNOW_QUALITY_OPTIONS = ['powder', 'packed', 'icy', 'slush', 'corduroy'] as const;

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export function Simulation() {
  const [step, setStep] = useState(1);
  const [environment, setEnvironment] = useState({
    weather: 'clear' as string,
    windSpeedKmh: 10,
    snowQuality: 'packed' as string,
    temperatureC: -5,
  });
  const [selectedTrail, setSelectedTrail] = useState<SnowTrailPreset | null>(null);
  const [selectedRider, setSelectedRider] = useState<PersonalPreset | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<BoardPreset | null>(null);
  const [plannedMoves, setPlannedMoves] = useState<MoveAnalysisRequest[]>([]);
  const [results, setResults] = useState<MoveAnalysisResponse[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [saved, setSaved] = useState(false);

  const presets = getPresets();
  const savedMoves = getMoves();

  const addMoveFromPreset = (moveId: string) => {
    const preset = savedMoves.find((m) => m.id === moveId);
    if (!preset) return;
    // Override kicker and rider with selected presets
    const req: MoveAnalysisRequest = {
      ...preset.config,
      kicker: selectedTrail
        ? {
            type: selectedTrail.kickerType,
            takeoffAngle: selectedTrail.takeoffAngle,
            landingAngle: selectedTrail.landingAngle,
            tableLength: selectedTrail.tableLength,
            verticalDrop: selectedTrail.verticalDrop,
            snowCondition: selectedTrail.snowCondition,
          }
        : preset.config.kicker,
      rider: selectedRider
        ? {
            name: selectedRider.name,
            experienceLevel: selectedRider.experienceLevel,
            yearsExperience: 2,
            heightCm: selectedRider.heightCm,
            weightKg: selectedRider.weightKg,
            stance: selectedRider.stance,
            dominantFoot: selectedRider.dominantFoot,
            preferredDiscipline: 'Freestyle',
            recentInjuries: [],
          }
        : preset.config.rider,
      context: {
        attemptNumber: 1,
        previousSuccessRate: 0.6,
        weather: environment.weather as any,
        visibility: 'good',
        temperatureC: environment.temperatureC,
        fatigueLevel: 3,
      },
    };
    setPlannedMoves((prev) => [...prev, req]);
  };

  const removePlannedMove = (idx: number) => {
    setPlannedMoves((prev) => prev.filter((_, i) => i !== idx));
  };

  const runSimulation = useCallback(async () => {
    setIsSimulating(true);
    const res = plannedMoves.map((req) => analyzeMoveFast(req));
    setResults(res);
    setIsSimulating(false);
    setStep(4);
  }, [plannedMoves]);

  const handleSaveToTrainingLog = () => {
    const log: TrainingLog = {
      id: generateId(),
      date: new Date().toISOString().slice(0, 10),
      location: selectedTrail?.name || 'Unknown Trail',
      weather: environment.weather,
      windSpeedKmh: environment.windSpeedKmh,
      snowQuality: environment.snowQuality,
      temperatureC: environment.temperatureC,
      notes: `Simulation with ${selectedBoard?.name || 'default board'}. Trail: ${selectedTrail?.name || 'unknown'}.`,
      isFavorite: false,
      videos: [],
      moves: plannedMoves.map((req, i) => ({
        moveId: generateId(),
        moveName: req.move.name,
        config: req,
        preAnalysisRiskScore: results[i]?.overallRiskScore || 50,
        landed: true,
        injuryOccurred: false,
        injuryType: null,
        fatigueLevel: 3,
        postNotes: '',
      })),
    };
    saveTrainingLog(log);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const avgRisk = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.overallRiskScore, 0) / results.length) : 0;
  const maxDanger = results.length > 0 ? results.reduce((max, r) => (r.overallRiskScore > max.overallRiskScore ? r : max), results[0]).dangerLevel : 'low';

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-12 py-8">
      <header className="mb-8">
        <span className="text-primary font-bold tracking-widest text-[10px] uppercase block mb-2">Simulation</span>
        <h1 className="text-4xl font-bold tracking-tight text-on-surface">Start Simulation</h1>
        <p className="text-on-surface-variant text-sm mt-1">Configure your environment, choose presets, plan moves, and analyze risk.</p>
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

        {/* Step 2: Choose Presets */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            {/* Snow Trail */}
            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4"><Mountain className="w-5 h-5 text-primary" /> Snow Trail</h2>
              {presets.trails.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No trails saved. <a href="#/presets" className="text-primary font-bold hover:underline">Create one in Presets</a>.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {presets.trails.map((trail) => (
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
                  {presets.personal.map((p) => (
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
                  {presets.board.map((b) => (
                    <button key={b.id} onClick={() => setSelectedBoard(b)} className={cn('px-4 py-2 rounded-lg border text-sm font-medium transition-colors', selectedBoard?.id === b.id ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-high text-on-surface border-outline-variant/10 hover:bg-surface-container-highest')}>
                      {b.name} • {b.lengthCm}cm • {b.flex}
                    </button>
                  ))}
                </div>
              )}
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

        {/* Step 3: Planned Moves */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 mb-4"><RotateCw className="w-5 h-5 text-primary" /> Planned Moves</h2>

              {savedMoves.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No saved moves. <a href="#/designer" className="text-primary font-bold hover:underline">Design one first</a>.</p>
              ) : (
                <div className="flex flex-wrap gap-2 mb-4">
                  {savedMoves.map((m) => (
                    <button key={m.id} onClick={() => addMoveFromPreset(m.id)} className="px-3 py-1.5 bg-surface-container-high rounded-lg text-xs font-medium text-on-surface hover:bg-primary hover:text-on-primary transition-colors border border-outline-variant/10">
                      + {m.name}
                    </button>
                  ))}
                </div>
              )}

              {plannedMoves.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Selected ({plannedMoves.length})</h3>
                  {plannedMoves.map((move, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-surface-container-high rounded-lg border border-outline-variant/10">
                      <div>
                        <p className="text-sm font-bold text-on-surface">{move.move.name}</p>
                        <p className="text-xs text-on-surface-variant">{move.move.rotationDegrees}° • {move.move.flipType} • {move.move.grabType || 'no grab'}</p>
                      </div>
                      <button onClick={() => removePlannedMove(idx)} className="text-xs text-error font-bold hover:underline">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-6 py-2.5 bg-surface-container-high text-on-surface font-bold rounded-lg flex items-center gap-2 hover:bg-surface-container-highest transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={runSimulation} disabled={plannedMoves.length === 0 || isSimulating} className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isSimulating ? <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                {isSimulating ? 'Simulating...' : 'Start Simulation'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Results */}
        {step === 4 && results.length > 0 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            {/* Summary */}
            <div className={cn('p-6 rounded-xl border flex items-center justify-between', maxDanger === 'extreme' || maxDanger === 'high' ? 'bg-error-container border-error/20' : 'bg-green-50 border-green-200')}>
              <div>
                <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  {maxDanger === 'extreme' || maxDanger === 'high' ? <AlertTriangle className="w-5 h-5 text-error" /> : <ShieldCheck className="w-5 h-5 text-green-600" />}
                  Simulation Complete
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  {plannedMoves.length} move{plannedMoves.length > 1 ? 's' : ''} analyzed. Average risk: {avgRisk}/100.
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-on-surface">{avgRisk}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Avg Risk</p>
              </div>
            </div>

            {/* Individual Results */}
            <div className="space-y-3">
              {results.map((res, idx) => (
                <div key={idx} className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-on-surface">{plannedMoves[idx]?.move.name}</h3>
                    <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', res.dangerLevel === 'extreme' ? 'bg-error text-on-error' : res.dangerLevel === 'high' ? 'bg-orange-100 text-orange-700' : res.dangerLevel === 'moderate' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700')}>
                      {res.dangerLevel}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <StatBadge label="Risk" value={res.overallRiskScore} />
                    <StatBadge label="Air Time" value={`${res.physics.estimatedAirTimeSec}s`} />
                    <StatBadge label="Impact" value={`${res.physics.estimatedImpactForceG}G`} />
                    <StatBadge label="Landing" value={`${res.landingConfidence}%`} />
                  </div>
                  {res.coachInsight && (
                    <p className="text-xs text-on-surface-variant bg-surface-container-high p-2 rounded-lg">{res.coachInsight}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => { setStep(1); setPlannedMoves([]); setResults([]); }} className="flex-1 py-3 bg-surface-container-high text-on-surface font-bold rounded-lg hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2">
                <RotateCw className="w-4 h-4" /> New Simulation
              </button>
              <button onClick={handleSaveToTrainingLog} className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save to Training Log</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface-container-high rounded-lg p-2 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="text-sm font-bold text-on-surface">{value}</p>
    </div>
  );
}
