import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, RotateCcw, Save, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getMoves, saveMove, deleteMove } from '@/lib/storage';
import type { MoveConfig } from '@/types';

const FLIP_TYPES = ['none', 'backflip', 'frontflip', 'rodeo', 'cork', 'double-cork', 'triple-cork'] as const;
const GRAB_TYPES = ['indy', 'melon', 'mute', 'stalefish', 'tail', 'nose', 'japan', 'method', 'seatbelt', 'truck_driver'] as const;

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export function TechniqueLibrary() {
  const [moves, setMoves] = useState(getMoves);
  const [isCreating, setIsCreating] = useState(false);

  const handleDelete = (id: string) => {
    if (confirm('Delete this move preset?')) {
      deleteMove(id);
      setMoves(getMoves());
    }
  };

  const handleSave = (config: MoveConfig) => {
    const preset = {
      id: generateId(),
      name: config.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: {
        move: config,
        kicker: { type: 'slopestyle' as const, takeoffAngle: 25, landingAngle: 30, tableLength: 8, verticalDrop: 4, snowCondition: 'packed' as const },
        rider: { name: 'Default', experienceLevel: 'intermediate' as const, yearsExperience: 2, heightCm: 175, weightKg: 70, stance: 'regular' as const, dominantFoot: 'right' as const, preferredDiscipline: 'Freestyle', recentInjuries: [] },
        context: { attemptNumber: 1, previousSuccessRate: 0.6, weather: 'clear' as const, windDirection: 'tailwind' as const, visibility: 'good' as const, temperatureC: -5, fatigueLevel: 3 },
      },
      lastAnalysis: null,
    };
    saveMove(preset);
    setMoves(getMoves());
    setIsCreating(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-12 py-8">
      <header className="mb-8">
        <span className="text-primary font-bold tracking-widest text-[10px] uppercase block mb-2">Moves</span>
        <h1 className="text-4xl font-bold tracking-tight text-on-surface">Technique Library</h1>
        <p className="text-on-surface-variant text-sm mt-1">Save and manage your move presets for simulation.</p>
      </header>

      {!isCreating && (
        <button onClick={() => setIsCreating(true)} className="mb-6 px-4 py-2.5 bg-primary text-on-primary font-bold text-sm rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Create Move Preset
        </button>
      )}

      <AnimatePresence>
        {isCreating && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            <MoveConfigForm onSave={handleSave} onCancel={() => setIsCreating(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {moves.length === 0 ? (
        <div className="text-center py-16">
          <RotateCcw className="w-10 h-10 text-on-surface-variant mx-auto mb-3" />
          <h3 className="text-lg font-bold text-on-surface mb-1">No move presets yet</h3>
          <p className="text-sm text-on-surface-variant">Create your first move preset to use in simulations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {moves.map((move) => (
            <div key={move.id} className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 relative group">
              <button onClick={() => handleDelete(move.id)} className="absolute top-3 right-3 p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container rounded-md transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <h3 className="text-sm font-bold text-on-surface mb-3">{move.name}</h3>
              <div className="space-y-2 text-xs text-on-surface-variant">
                <div className="flex justify-between"><span className="text-on-surface-variant/60">Direction</span><span className="font-medium text-on-surface capitalize">{move.config.move.direction}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant/60">Rotation</span><span className="font-medium text-on-surface">{move.config.move.rotationDegrees}°</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant/60">Flip</span><span className="font-medium text-on-surface capitalize">{move.config.move.flipType}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant/60">Inversion</span><span className="font-medium text-on-surface">{move.config.move.inversionDepth}%</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant/60">Grab</span><span className="font-medium text-on-surface capitalize">{move.config.move.grabType || 'None'}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Move Config Form (same experience as Sim Step 2)
// ============================================

function MoveConfigForm({ onSave, onCancel }: { onSave: (config: MoveConfig) => void; onCancel: () => void }) {
  const [config, setConfig] = useState<MoveConfig>({
    name: 'Custom Move',
    rotationDegrees: 720,
    inversionDepth: 30,
    flipType: 'cork',
    direction: 'frontside',
    grabType: 'indy',
    grabDurationPct: 60,
  });

  const update = (patch: Partial<MoveConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      if (!patch.name) next.name = generateMoveName(next);
      return next;
    });
  };

  return (
    <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 space-y-5">
      <h3 className="text-sm font-bold text-on-surface">New Move Preset</h3>

      <Field label="Move Name">
        <input type="text" value={config.name} onChange={(e) => update({ name: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary transition-colors" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Direction">
          <div className="flex rounded-lg overflow-hidden border border-outline-variant/20">
            {(['frontside', 'backside'] as const).map((d) => (
              <button key={d} onClick={() => update({ direction: d })} className={cn('flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors', config.direction === d ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>
                {d}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Flip Type">
          <select value={config.flipType} onChange={(e) => update({ flipType: e.target.value as any })} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary transition-colors">
            {FLIP_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
      </div>

      <SliderControl label="Rotation" value={config.rotationDegrees} min={0} max={1440} step={180} unit="°" onChange={(v) => update({ rotationDegrees: v })} />
      <SliderControl label="Inversion Depth" value={config.inversionDepth} min={0} max={100} unit="%" onChange={(v) => update({ inversionDepth: v })} />

      <Field label="Grab">
        <div className="grid grid-cols-5 gap-1.5">
          <button onClick={() => update({ grabType: null })} className={cn('py-2 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-colors', config.grabType === null ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>None</button>
          {GRAB_TYPES.map((g) => (
            <button key={g} onClick={() => update({ grabType: g })} className={cn('py-2 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-colors', config.grabType === g ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high')}>
              {g}
            </button>
          ))}
        </div>
      </Field>

      {config.grabType && (
        <SliderControl label="Grab Duration" value={config.grabDurationPct} min={0} max={100} unit="%" onChange={(v) => update({ grabDurationPct: v })} />
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 py-2.5 bg-surface-container-high text-on-surface font-bold text-xs rounded-lg hover:bg-surface-container-highest transition-colors">Cancel</button>
        <button onClick={() => onSave(config)} className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
          <Save className="w-3.5 h-3.5" /> Save Move Preset
        </button>
      </div>
    </div>
  );
}

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</label>
      {children}
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
