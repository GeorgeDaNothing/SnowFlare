import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Layers, Mountain, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPresets, addPersonalPreset, addBoardPreset, addSnowTrailPreset, deletePersonalPreset, deleteBoardPreset, deleteSnowTrailPreset } from '@/lib/storage';
import type { PersonalPreset, BoardPreset, SnowTrailPreset } from '@/types';

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

type Tab = 'personal' | 'board' | 'trails';

export function Presets() {
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [isCreating, setIsCreating] = useState(false);
  const presets = getPresets();

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-12 py-8">
      <header className="mb-8">
        <span className="text-primary font-bold tracking-widest text-[10px] uppercase block mb-2">Configuration</span>
        <h1 className="text-4xl font-bold tracking-tight text-on-surface">Presets</h1>
        <p className="text-on-surface-variant text-sm mt-1">Manage your rider profiles, boards, and snow trails.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-surface-container-low p-1 rounded-xl border border-outline-variant/10">
        {([
          { key: 'personal', label: 'Personal', icon: User },
          { key: 'board', label: 'Board', icon: Layers },
          { key: 'trails', label: 'Snow Trails', icon: Mountain },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); setIsCreating(false); }} className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors', activeTab === t.key ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface')}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Create Button */}
      {!isCreating && (
        <button onClick={() => setIsCreating(true)} className="mb-4 px-4 py-2.5 bg-primary text-on-primary font-bold text-sm rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add {activeTab === 'personal' ? 'Rider Profile' : activeTab === 'board' ? 'Board' : 'Snow Trail'}
        </button>
      )}

      {/* Create Forms */}
      <AnimatePresence>
        {isCreating && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
            {activeTab === 'personal' && <PersonalForm onSave={() => setIsCreating(false)} onCancel={() => setIsCreating(false)} />}
            {activeTab === 'board' && <BoardForm onSave={() => setIsCreating(false)} onCancel={() => setIsCreating(false)} />}
            {activeTab === 'trails' && <TrailForm onSave={() => setIsCreating(false)} onCancel={() => setIsCreating(false)} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTab === 'personal' && presets.personal.map((p) => <PersonalCard key={p.id} preset={p} />)}
        {activeTab === 'board' && presets.board.map((b) => <BoardCard key={b.id} preset={b} />)}
        {activeTab === 'trails' && presets.trails.map((t) => <TrailCard key={t.id} preset={t} />)}
      </div>

      {((activeTab === 'personal' && presets.personal.length === 0) ||
        (activeTab === 'board' && presets.board.length === 0) ||
        (activeTab === 'trails' && presets.trails.length === 0)) && !isCreating && (
        <div className="text-center py-12">
          <p className="text-sm text-on-surface-variant">No {activeTab} presets yet. Click "Add" to create one.</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Personal Form & Card
// ============================================

function PersonalForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [experience, setExperience] = useState('intermediate');
  const [stance, setStance] = useState('regular');

  const handleSave = () => {
    addPersonalPreset({ id: generateId(), name: name || 'Unnamed', weightKg: weight, heightCm: height, experienceLevel: experience as any, stance: stance as any });
    onSave();
  };

  return (
    <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 space-y-4">
      <h3 className="text-sm font-bold text-on-surface">New Rider Profile</h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Profile Name">
          <input placeholder="e.g. My Profile" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        </Field>
        <Field label="Weight">
          <div className="flex items-center gap-2">
            <input type="number" placeholder="70" value={weight} onChange={(e) => setWeight(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
            <span className="text-xs text-on-surface-variant shrink-0">kg</span>
          </div>
        </Field>
        <Field label="Height">
          <div className="flex items-center gap-2">
            <input type="number" placeholder="175" value={height} onChange={(e) => setHeight(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
            <span className="text-xs text-on-surface-variant shrink-0">cm</span>
          </div>
        </Field>
        <Field label="Experience Level">
          <select value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary">
            {['beginner', 'intermediate', 'advanced', 'expert', 'pro'].map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </Field>
        <Field label="Stance">
          <select value={stance} onChange={(e) => setStance(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary">
            {['regular', 'goofy'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 py-2.5 bg-surface-container-high text-on-surface font-bold text-xs rounded-lg hover:bg-surface-container-highest">Cancel</button>
        <button onClick={handleSave} className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-lg hover:bg-primary/90">Save Profile</button>
      </div>
    </div>
  );
}

function PersonalCard({ preset }: { preset: PersonalPreset; key?: React.Key }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 relative group">
      <button onClick={() => deletePersonalPreset(preset.id)} className="absolute top-3 right-3 p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container rounded-md transition-colors opacity-0 group-hover:opacity-100">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <h3 className="text-sm font-bold text-on-surface mb-3">{preset.name}</h3>
      <div className="space-y-2 text-xs text-on-surface-variant">
        <div className="flex justify-between"><span className="text-on-surface-variant/60">Weight</span><span className="font-medium text-on-surface">{preset.weightKg} kg</span></div>
        <div className="flex justify-between"><span className="text-on-surface-variant/60">Height</span><span className="font-medium text-on-surface">{preset.heightCm} cm</span></div>
        <div className="flex justify-between"><span className="text-on-surface-variant/60">Experience</span><span className="font-medium text-on-surface capitalize">{preset.experienceLevel}</span></div>
        <div className="flex justify-between"><span className="text-on-surface-variant/60">Stance</span><span className="font-medium text-on-surface capitalize">{preset.stance}</span></div>
      </div>
    </div>
  );
}

// ============================================
// Board Form & Card
// ============================================

function BoardForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [length, setLength] = useState(155);
  const [flex, setFlex] = useState('medium');
  const [shape, setShape] = useState('directional');

  const handleSave = () => {
    addBoardPreset({ id: generateId(), name: name || 'Unnamed', brand, model, lengthCm: length, flex, shape });
    onSave();
  };

  return (
    <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 space-y-4">
      <h3 className="text-sm font-bold text-on-surface">New Board</h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Board Name">
          <input placeholder="e.g. Daily Driver" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        </Field>
        <Field label="Brand">
          <input placeholder="e.g. Burton" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        </Field>
        <Field label="Model">
          <input placeholder="e.g. Custom X" value={model} onChange={(e) => setModel(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        </Field>
        <Field label="Length">
          <div className="flex items-center gap-2">
            <input type="number" placeholder="155" value={length} onChange={(e) => setLength(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
            <span className="text-xs text-on-surface-variant shrink-0">cm</span>
          </div>
        </Field>
        <Field label="Flex Rating">
          <input placeholder="e.g. medium, stiff, soft" value={flex} onChange={(e) => setFlex(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        </Field>
        <Field label="Shape">
          <input placeholder="e.g. directional, twin, directional-twin" value={shape} onChange={(e) => setShape(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        </Field>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 py-2.5 bg-surface-container-high text-on-surface font-bold text-xs rounded-lg hover:bg-surface-container-highest">Cancel</button>
        <button onClick={handleSave} className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-lg hover:bg-primary/90">Save Board</button>
      </div>
    </div>
  );
}

function BoardCard({ preset }: { preset: BoardPreset; key?: React.Key }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 relative group">
      <button onClick={() => deleteBoardPreset(preset.id)} className="absolute top-3 right-3 p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container rounded-md transition-colors opacity-0 group-hover:opacity-100">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <h3 className="text-sm font-bold text-on-surface mb-3">{preset.name}</h3>
      <div className="space-y-2 text-xs text-on-surface-variant">
        <div className="flex justify-between"><span className="text-on-surface-variant/60">Brand</span><span className="font-medium text-on-surface">{preset.brand}</span></div>
        <div className="flex justify-between"><span className="text-on-surface-variant/60">Model</span><span className="font-medium text-on-surface">{preset.model}</span></div>
        <div className="flex justify-between"><span className="text-on-surface-variant/60">Length</span><span className="font-medium text-on-surface">{preset.lengthCm} cm</span></div>
        <div className="flex justify-between"><span className="text-on-surface-variant/60">Flex</span><span className="font-medium text-on-surface capitalize">{preset.flex}</span></div>
        <div className="flex justify-between"><span className="text-on-surface-variant/60">Shape</span><span className="font-medium text-on-surface capitalize">{preset.shape}</span></div>
      </div>
    </div>
  );
}

// ============================================
// Trail Form & Card
// ============================================

function TrailForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [kickerType, setKickerType] = useState('slopestyle');
  const [takeoff, setTakeoff] = useState(25);
  const [landing, setLanding] = useState(30);
  const [drop, setDrop] = useState(4);
  const [snow, setSnow] = useState('packed');

  const handleSave = () => {
    addSnowTrailPreset({ id: generateId(), name: name || 'Unnamed Trail', difficulty, kickerType: kickerType as any, takeoffAngle: takeoff, landingAngle: landing, tableLength: 8, verticalDrop: drop, snowCondition: snow as any });
    onSave();
  };

  return (
    <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 space-y-4">
      <h3 className="text-sm font-bold text-on-surface">New Snow Trail</h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Trail Name">
          <input placeholder="e.g. Main Park Kicker" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        </Field>
        <Field label="Difficulty">
          <input placeholder="e.g. intermediate, advanced, pro" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        </Field>
        <Field label="Kicker Type">
          <select value={kickerType} onChange={(e) => setKickerType(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary">
            {['big-air', 'slopestyle', 'halfpipe', 'rail', 'kicker'].map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
        <Field label="Snow Condition">
          <select value={snow} onChange={(e) => setSnow(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary">
            {['powder', 'packed', 'icy', 'slush', 'corduroy'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Takeoff Angle">
          <div className="flex items-center gap-2">
            <input type="number" placeholder="25" value={takeoff} onChange={(e) => setTakeoff(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
            <span className="text-xs text-on-surface-variant shrink-0">°</span>
          </div>
        </Field>
        <Field label="Landing Angle">
          <div className="flex items-center gap-2">
            <input type="number" placeholder="30" value={landing} onChange={(e) => setLanding(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
            <span className="text-xs text-on-surface-variant shrink-0">°</span>
          </div>
        </Field>
        <Field label="Vertical Drop">
          <div className="flex items-center gap-2">
            <input type="number" placeholder="4" value={drop} onChange={(e) => setDrop(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
            <span className="text-xs text-on-surface-variant shrink-0">m</span>
          </div>
        </Field>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 py-2.5 bg-surface-container-high text-on-surface font-bold text-xs rounded-lg hover:bg-surface-container-highest">Cancel</button>
        <button onClick={handleSave} className="flex-1 py-2.5 bg-primary text-on-primary font-bold text-xs rounded-lg hover:bg-primary/90">Save Trail</button>
      </div>
    </div>
  );
}

function TrailCard({ preset }: { preset: SnowTrailPreset; key?: React.Key }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 relative group">
      <button onClick={() => deleteSnowTrailPreset(preset.id)} className="absolute top-3 right-3 p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container rounded-md transition-colors opacity-0 group-hover:opacity-100">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <h3 className="text-sm font-bold text-on-surface mb-3">{preset.name}</h3>
      <div className="space-y-2 text-xs text-on-surface-variant">
        <div className="flex justify-between"><span className="text-on-surface-variant/60">Difficulty</span><span className="font-medium text-on-surface capitalize">{preset.difficulty}</span></div>
        <div className="flex justify-between"><span className="text-on-surface-variant/60">Kicker Type</span><span className="font-medium text-on-surface capitalize">{preset.kickerType}</span></div>
        <div className="flex justify-between"><span className="text-on-surface-variant/60">Snow Condition</span><span className="font-medium text-on-surface capitalize">{preset.snowCondition}</span></div>
        <div className="flex justify-between"><span className="text-on-surface-variant/60">Vertical Drop</span><span className="font-medium text-on-surface">{preset.verticalDrop} m</span></div>
        <div className="flex justify-between"><span className="text-on-surface-variant/60">Takeoff Angle</span><span className="font-medium text-on-surface">{preset.takeoffAngle}°</span></div>
        <div className="flex justify-between"><span className="text-on-surface-variant/60">Landing Angle</span><span className="font-medium text-on-surface">{preset.landingAngle}°</span></div>
      </div>
    </div>
  );
}

// ============================================
// Shared Field Component
// ============================================

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</label>
      {children}
    </div>
  );
}
