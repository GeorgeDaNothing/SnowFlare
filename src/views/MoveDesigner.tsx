import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCw,
  Play,
  Bolt,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  Save,
  ClipboardList,
  TrendingUp,
  Wind,
  User,
  Mountain,
  Snowflake,
  Eye,
  Thermometer,
  Activity,
  CheckCircle2,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyzeMoveFast, analyzeMoveWithAI, isAIAvailable } from '@/lib/gemini';
import { saveMove, getRiderProfile, saveRiderProfile } from '@/lib/storage';
import type { MoveAnalysisRequest, MoveAnalysisResponse, DangerLevel } from '@/types';

const FLIP_TYPES = ['none', 'backflip', 'frontflip', 'rodeo', 'cork', 'double-cork', 'triple-cork'] as const;
const GRAB_TYPES = ['indy', 'melon', 'mute', 'stalefish', 'tail', 'nose', 'japan', 'method', 'seatbelt', 'truck_driver'] as const;
const KICKER_TYPES = ['big-air', 'slopestyle', 'halfpipe', 'rail', 'kicker'] as const;
const SNOW_CONDITIONS = ['powder', 'packed', 'icy', 'slush', 'corduroy'] as const;
const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert', 'pro'] as const;
const WEATHER = ['clear', 'cloudy', 'foggy', 'snowing', 'windy'] as const;
const VISIBILITY = ['excellent', 'good', 'fair', 'poor'] as const;

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function getDefaultRequest(): MoveAnalysisRequest {
  const rider = getRiderProfile();
  return {
    move: {
      name: 'Custom Move',
      rotationDegrees: 720,
      inversionDepth: 30,
      flipType: 'cork',
      direction: 'frontside',
      grabType: 'indy',
      grabDurationPct: 60,
    },
    kicker: {
      type: 'slopestyle',
      takeoffAngle: 25,
      landingAngle: 30,
      tableLength: 8,
      verticalDrop: 4,
      snowCondition: 'packed',
    },
    rider,
    context: {
      attemptNumber: 1,
      previousSuccessRate: 0.6,
      weather: 'clear',
      visibility: 'good',
      temperatureC: -5,
      fatigueLevel: 3,
    },
  };
}

const DANGER_COLORS: Record<DangerLevel, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  moderate: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  extreme: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export function MoveDesigner() {
  const [request, setRequest] = useState<MoveAnalysisRequest>(getDefaultRequest);
  const [analysis, setAnalysis] = useState<MoveAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const updateMove = useCallback((patch: Partial<MoveAnalysisRequest['move']>) => {
    setRequest((prev) => {
      const next = { ...prev, move: { ...prev.move, ...patch } };
      // Auto-update name
      if (!patch.name && (patch.rotationDegrees || patch.flipType || patch.direction || patch.grabType)) {
        next.move.name = generateMoveName(next.move);
      }
      return next;
    });
    setAnalysis(null);
  }, []);

  const updateKicker = useCallback((patch: Partial<MoveAnalysisRequest['kicker']>) => {
    setRequest((prev) => ({ ...prev, kicker: { ...prev.kicker, ...patch } }));
    setAnalysis(null);
  }, []);

  const updateRider = useCallback((patch: Partial<MoveAnalysisRequest['rider']>) => {
    setRequest((prev) => {
      const next = { ...prev, rider: { ...prev.rider, ...patch } };
      saveRiderProfile(next.rider);
      return next;
    });
    setAnalysis(null);
  }, []);

  const updateContext = useCallback((patch: Partial<MoveAnalysisRequest['context']>) => {
    setRequest((prev) => ({ ...prev, context: { ...prev.context, ...patch } }));
    setAnalysis(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    // Quick rule-based preview first
    const fast = analyzeMoveFast(request);
    setAnalysis(fast);

    // Then try AI-enhanced
    if (isAIAvailable()) {
      try {
        const aiResult = await analyzeMoveWithAI(request);
        setAnalysis(aiResult);
      } catch {
        // keep rule-based result
      }
    }
    setIsAnalyzing(false);
  }, [request]);

  const handleSavePreset = useCallback(() => {
    const preset = {
      id: generateId(),
      name: request.move.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: request,
      lastAnalysis: analysis,
    };
    saveMove(preset);
    setSaveMessage('Preset saved!');
    setTimeout(() => setSaveMessage(''), 2000);
  }, [request, analysis]);

  const physics = analysis?.physics;

  return (
    <div className="flex-1 flex p-8 gap-8 overflow-hidden h-[calc(100vh-64px)]">
      {/* Left: Viewport + Results */}
      <div className="flex-1 relative rounded-xl bg-surface-container-low overflow-hidden group border border-outline-variant/10 shadow-inner flex flex-col">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-container-lowest to-surface-dim">
          <img
            alt="Snowboard Simulation"
            className="w-full h-full object-cover opacity-60"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-oLf3VAjIHwULJSoM44PQSfUhPHEbdVnUxRVsff0bJzBzBPjFo4u5VhE4zT7HihvYnGgyE2dj6XHRUrOt7z3yfZZRa4uxF2fAElqZfE9RS8Fq6cKxlRX_fNeib9ih1TZazp6mOlQjqhntI5ExogTyYn_jO2y5ml9kIV3jZsbRWueD6XeXCzTIbUDUTmpgDrYFweBqJT9uNOJSYHGvpgf6035MVRgHvlnjXoZX9HoxSuvGU37_w6du9HD2dGxSWVMH7w7JwMSu_1U"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* HUD Overlays */}
        <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
          <div className="px-3 py-1 bg-white/60 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest text-primary uppercase border border-white/40">
            {isAnalyzing ? 'Analyzing...' : analysis ? 'Analysis Complete' : 'Configure Move'}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-on-surface drop-shadow-sm">
            {request.move.name}
          </h1>
        </div>

        {/* Physics HUD */}
        {physics && (
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-10">
            <div className="flex gap-3">
              <PhysicsCard label="Air Time" value={`${physics.estimatedAirTimeSec}`} unit="sec" />
              <PhysicsCard label="Max Height" value={`${physics.estimatedMaxHeightM}`} unit="m" />
              <PhysicsCard label="Impact Force" value={`${physics.estimatedImpactForceG}`} unit="G" warn={physics.estimatedImpactForceG > 5} />
              <PhysicsCard label="Landing Speed" value={`${physics.estimatedLandingVelocityMs}`} unit="m/s" />
            </div>
            <div className="flex gap-2">
              <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white/90 text-on-surface hover:bg-primary hover:text-on-primary transition-all duration-300 shadow-md">
                <RotateCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-6 py-3 flex items-center gap-2 rounded-full bg-primary text-on-primary font-bold shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-60"
              >
                <Play className="w-4 h-4 fill-current" />
                {isAnalyzing ? 'Analyzing...' : 'Analyze Move'}
              </button>
            </div>
          </div>
        )}

        {!physics && (
          <div className="absolute bottom-6 left-6 right-6 flex justify-end z-10">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-6 py-3 flex items-center gap-2 rounded-full bg-primary text-on-primary font-bold shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-60"
            >
              <Play className="w-4 h-4 fill-current" />
              {isAnalyzing ? 'Analyzing...' : 'Analyze Move'}
            </button>
          </div>
        )}

        {/* Analysis Results Overlay */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="absolute top-24 left-6 w-80 max-h-[calc(100%-140px)] overflow-y-auto bg-surface-container-lowest/95 backdrop-blur-xl rounded-xl border border-outline-variant/20 shadow-2xl p-5 space-y-4 z-20"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest text-on-surface">Analysis Result</h2>
                <button onClick={() => setAnalysis(null)} className="p-1 hover:bg-surface-container-high rounded-md transition-colors">
                  <X className="w-4 h-4 text-on-surface-variant" />
                </button>
              </div>

              {/* Risk Score */}
              <div className={cn('p-4 rounded-xl border', DANGER_COLORS[analysis.dangerLevel].bg, DANGER_COLORS[analysis.dangerLevel].border)}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('text-xs font-bold uppercase tracking-wider', DANGER_COLORS[analysis.dangerLevel].text)}>Risk Score</span>
                  <span className={cn('text-xs font-bold', DANGER_COLORS[analysis.dangerLevel].text)}>{analysis.dangerLevel}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={cn('text-4xl font-black', DANGER_COLORS[analysis.dangerLevel].text)}>{analysis.overallRiskScore}</span>
                  <span className="text-xs text-on-surface-variant">/ 100</span>
                </div>
                <div className="mt-2 h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.overallRiskScore}%` }}
                    className={cn('h-full rounded-full', analysis.dangerLevel === 'low' ? 'bg-green-500' : analysis.dangerLevel === 'moderate' ? 'bg-yellow-500' : analysis.dangerLevel === 'high' ? 'bg-orange-500' : 'bg-red-500')}
                  />
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-on-surface-variant">
                  <ShieldCheck className="w-3 h-3" />
                  Landing confidence: {analysis.landingConfidence}%
                </div>
              </div>

              {/* Coach Insight */}
              {analysis.coachInsight && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Bolt className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Coach Insight</span>
                  </div>
                  <p className="text-xs text-on-surface leading-relaxed">{analysis.coachInsight}</p>
                </div>
              )}

              {/* Risk Factors */}
              {analysis.riskFactors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Risk Factors</h3>
                  {analysis.riskFactors.map((rf, i) => (
                    <div key={i} className={cn('p-3 rounded-lg border text-xs', rf.severity === 'critical' ? 'bg-error-container border-error/20' : rf.severity === 'warning' ? 'bg-orange-50 border-orange-200' : 'bg-surface-container-low border-outline-variant/10')}>
                      <div className="flex items-center gap-2 mb-1">
                        {rf.severity === 'critical' ? <AlertTriangle className="w-3.5 h-3.5 text-error" /> : <TrendingUp className="w-3.5 h-3.5 text-on-surface-variant" />}
                        <span className={cn('font-bold', rf.severity === 'critical' ? 'text-error' : 'text-on-surface')}>{rf.title}</span>
                      </div>
                      <p className="text-on-surface-variant mb-1">{rf.description}</p>
                      <p className="text-primary font-medium">{rf.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Improvements */}
              {analysis.improvements.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Suggested Improvements</h3>
                  {analysis.improvements.map((imp, i) => (
                    <div key={i} className="p-3 bg-tertiary/5 rounded-lg border border-tertiary/10 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-on-surface">{imp.area}</span>
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold', imp.difficultyToImplement === 'easy' ? 'bg-green-100 text-green-700' : imp.difficultyToImplement === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700')}>
                          {imp.difficultyToImplement}
                        </span>
                      </div>
                      <p className="text-on-surface-variant">{imp.currentValue} → <span className="text-tertiary font-semibold">{imp.suggestedValue}</span></p>
                      <p className="text-on-surface-variant mt-1">{imp.expectedBenefit}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Prerequisites */}
              {analysis.prerequisiteMoves.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Prerequisites</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.prerequisiteMoves.map((pm, i) => (
                      <span key={i} className="px-2 py-1 bg-surface-container-high rounded-md text-[10px] font-medium text-on-surface-variant border border-outline-variant/10">
                        {pm}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button onClick={handleSavePreset} className="flex-1 py-2.5 bg-surface-container-high text-on-surface font-bold rounded-lg text-xs hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-1.5">
                  <Save className="w-3.5 h-3.5" />
                  Save Preset
                </button>
              </div>
              {saveMessage && <p className="text-xs text-primary text-center">{saveMessage}</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Controls */}
      <div className="w-96 flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
        {/* Move Configuration */}
        <ControlSection title="Move Configuration" icon={<Activity className="w-4 h-4" />} isOpen={activeSection === 'move'} onToggle={() => setActiveSection(activeSection === 'move' ? null : 'move')}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Move Name</label>
              <input
                type="text"
                value={request.move.name}
                onChange={(e) => updateMove({ name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Direction</label>
                <div className="flex rounded-lg overflow-hidden border border-outline-variant/20">
                  {(['frontside', 'backside'] as const).map((d) => (
                    <button key={d} onClick={() => updateMove({ direction: d })} className={cn('flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors', request.move.direction === d ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Flip Type</label>
                <select
                  value={request.move.flipType}
                  onChange={(e) => updateMove({ flipType: e.target.value as typeof request.move.flipType })}
                  className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary transition-colors"
                >
                  {FLIP_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <SliderControl label="Rotation" value={request.move.rotationDegrees} min={0} max={1440} step={180} unit="°" onChange={(v) => updateMove({ rotationDegrees: v })} />
            <SliderControl label="Inversion Depth" value={request.move.inversionDepth} min={0} max={100} unit="%" onChange={(v) => updateMove({ inversionDepth: v })} />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Grab</label>
              <div className="grid grid-cols-5 gap-1.5">
                <button onClick={() => updateMove({ grabType: null })} className={cn('py-2 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-colors', request.move.grabType === null ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>None</button>
                {GRAB_TYPES.map((g) => (
                  <button key={g} onClick={() => updateMove({ grabType: g })} className={cn('py-2 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-colors', request.move.grabType === g ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {request.move.grabType && (
              <SliderControl label="Grab Duration" value={request.move.grabDurationPct} min={0} max={100} unit="%" onChange={(v) => updateMove({ grabDurationPct: v })} />
            )}
          </div>
        </ControlSection>

        {/* Kicker Setup */}
        <ControlSection title="Kicker Setup" icon={<Mountain className="w-4 h-4" />} isOpen={activeSection === 'kicker'} onToggle={() => setActiveSection(activeSection === 'kicker' ? null : 'kicker')}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Kicker Type</label>
              <div className="flex flex-wrap gap-1.5">
                {KICKER_TYPES.map((k) => (
                  <button key={k} onClick={() => updateKicker({ type: k })} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-colors', request.kicker.type === k ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <SliderControl label="Takeoff Angle" value={request.kicker.takeoffAngle} min={10} max={50} unit="°" onChange={(v) => updateKicker({ takeoffAngle: v })} />
            <SliderControl label="Landing Angle" value={request.kicker.landingAngle} min={20} max={60} unit="°" onChange={(v) => updateKicker({ landingAngle: v })} />
            <SliderControl label="Vertical Drop" value={request.kicker.verticalDrop} min={1} max={15} step={0.5} unit="m" onChange={(v) => updateKicker({ verticalDrop: v })} />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Snow Condition</label>
              <div className="flex flex-wrap gap-1.5">
                {SNOW_CONDITIONS.map((s) => (
                  <button key={s} onClick={() => updateKicker({ snowCondition: s })} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-colors', request.kicker.snowCondition === s ? 'bg-tertiary text-on-tertiary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ControlSection>

        {/* Rider Profile */}
        <ControlSection title="Rider Profile" icon={<User className="w-4 h-4" />} isOpen={activeSection === 'rider'} onToggle={() => setActiveSection(activeSection === 'rider' ? null : 'rider')}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Experience</label>
              <div className="flex flex-wrap gap-1.5">
                {EXPERIENCE_LEVELS.map((e) => (
                  <button key={e} onClick={() => updateRider({ experienceLevel: e })} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-colors', request.rider.experienceLevel === e ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SliderControl label="Height" value={request.rider.heightCm} min={140} max={210} unit="cm" onChange={(v) => updateRider({ heightCm: v })} />
              <SliderControl label="Weight" value={request.rider.weightKg} min={40} max={120} unit="kg" onChange={(v) => updateRider({ weightKg: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Stance</label>
                <div className="flex rounded-lg overflow-hidden border border-outline-variant/20">
                  {(['regular', 'goofy'] as const).map((s) => (
                    <button key={s} onClick={() => updateRider({ stance: s })} className={cn('flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors', request.rider.stance === s ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Years Riding</label>
                <input type="number" min={0} max={50} value={request.rider.yearsExperience} onChange={(e) => updateRider({ yearsExperience: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary transition-colors" />
              </div>
            </div>
          </div>
        </ControlSection>

        {/* Session Context */}
        <ControlSection title="Session Context" icon={<ClipboardList className="w-4 h-4" />} isOpen={activeSection === 'context'} onToggle={() => setActiveSection(activeSection === 'context' ? null : 'context')}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Attempt #</label>
                <input type="number" min={1} max={100} value={request.context.attemptNumber} onChange={(e) => updateContext({ attemptNumber: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary transition-colors" />
              </div>
              <SliderControl label="Fatigue" value={request.context.fatigueLevel} min={0} max={10} unit="/10" onChange={(v) => updateContext({ fatigueLevel: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Weather</label>
                <div className="flex flex-wrap gap-1">
                  {WEATHER.map((w) => (
                    <button key={w} onClick={() => updateContext({ weather: w })} className={cn('px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter transition-colors', request.context.weather === w ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>
                      {w}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">Visibility</label>
                <div className="flex flex-wrap gap-1">
                  {VISIBILITY.map((v) => (
                    <button key={v} onClick={() => updateContext({ visibility: v })} className={cn('px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter transition-colors', request.context.visibility === v ? 'bg-secondary text-on-secondary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <SliderControl label="Temperature" value={request.context.temperatureC} min={-25} max={15} unit="°C" onChange={(v) => updateContext({ temperatureC: v })} />
          </div>
        </ControlSection>

        {/* Bottom Actions */}
        <div className="mt-auto pt-4 flex gap-3">
          <button onClick={handleSavePreset} className="flex-1 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-xs font-bold text-on-surface-variant uppercase tracking-widest hover:bg-white transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Save
          </button>
          <button onClick={handleAnalyze} disabled={isAnalyzing} className="flex-[2] py-3 bg-primary text-on-primary font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
            {isAnalyzing ? <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> : <Bolt className="w-4 h-4" />}
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {saveMessage && <p className="text-xs text-primary text-center">{saveMessage}</p>}
      </div>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function ControlSection({ title, icon, isOpen, onToggle, children }: { title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <section className="bg-surface-container-high rounded-xl border border-outline-variant/10 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface-container-highest transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant">{icon}</span>
          <h3 className="text-xs font-black uppercase tracking-widest text-on-surface">{title}</h3>
        </div>
        <ChevronRight className={cn('w-4 h-4 text-on-surface-variant transition-transform', isOpen && 'rotate-90')} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function SliderControl({ label, value, min, max, step = 1, unit, onChange }: { label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (val: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</label>
        <span className="text-xs font-bold text-primary">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-surface-container rounded-full appearance-none cursor-pointer accent-primary"
      />
    </div>
  );
}

function PhysicsCard({ label, value, unit, warn }: { label: string; value: string; unit: string; warn?: boolean }) {
  return (
    <div className="px-4 py-3 bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 shadow-lg shadow-stone-200/50">
      <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant font-bold mb-1">{label}</p>
      <p className={cn('text-xl font-black text-on-surface', warn && 'text-error')}>
        {value} <span className="text-xs font-normal text-on-surface-variant">{unit}</span>
      </p>
    </div>
  );
}

function generateMoveName(move: MoveAnalysisRequest['move']): string {
  const dir = move.direction === 'frontside' ? 'fs' : 'bs';
  const rot = move.rotationDegrees >= 1080 ? `${move.rotationDegrees}` : move.rotationDegrees >= 720 ? `${move.rotationDegrees}` : move.rotationDegrees >= 540 ? `${move.rotationDegrees}` : move.rotationDegrees >= 360 ? '360' : move.rotationDegrees >= 180 ? '180' : 'straight';
  const flip = move.flipType === 'none' ? '' : move.flipType === 'cork' ? '_cork' : move.flipType === 'double-cork' ? '_dblcork' : move.flipType === 'triple-cork' ? '_tricork' : `_${move.flipType}`;
  const grab = move.grabType ? `_${move.grabType}` : '';
  return `${dir}${flip}_${rot}${grab}`;
}
