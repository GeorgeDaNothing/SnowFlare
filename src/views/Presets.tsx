import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Layers, Mountain, Plus, Trash2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPresets, savePresets, addPersonalPreset, addBoardPreset, addSnowTrailPreset, deletePersonalPreset, deleteBoardPreset, deleteSnowTrailPreset } from '@/lib/storage';
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
  const [foot, setFoot] = useState('right');

  const handleSave = () => {
    addPersonalPreset({ id: generateId(), name: name || 'Unnamed', weightKg: weight, heightCm: height, experienceLevel: experience as any, stance: stance as any, dominantFoot: foot as any });
    onSave();
  };

  return (
    <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 space-y-4">
      <h3 className="text-sm font-bold text-on-surface">New Rider Profile</h3>
      <div className="grid grid-cols-2 gap-4">
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        <input type="number" placeholder="Weight (kg)" value={weight} onChange={(e) => setWeight(parseInt(e.target.value) || 0)} className="px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        <input type="number" placeholder="Height (cm)" value={height} onChange={(e) => setHeight(parseInt(e.target.value) || 0)} className="px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        <select value={experience} onChange={(e) => setExperience(e.target.value)} className="px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary">
          {['beginner', 'intermediate', 'advanced', 'expert', 'pro'].map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-lg hover:bg-surface-container-highest">Cancel</button>
        <button onClick={handleSave} className="flex-1 py-2 bg-primary text-on-primary font-bold text-xs rounded-lg hover:bg-primary/90">Save</button>
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
      <h3 className="text-sm font-bold text-on-surface mb-2">{preset.name}</h3>
      <div className="space-y-1 text-xs text-on-surface-variant">
        <p>{preset.weightKg}kg • {preset.heightCm}cm</p>
        <p>{preset.experienceLevel} • {preset.stance} • {preset.dominantFoot} foot</p>
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
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        <input placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} className="px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        <input placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} className="px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        <input type="number" placeholder="Length (cm)" value={length} onChange={(e) => setLength(parseInt(e.target.value) || 0)} className="px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        <input placeholder="Flex" value={flex} onChange={(e) => setFlex(e.target.value)} className="px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        <input placeholder="Shape" value={shape} onChange={(e) => setShape(e.target.value)} className="px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-lg hover:bg-surface-container-highest">Cancel</button>
        <button onClick={handleSave} className="flex-1 py-2 bg-primary text-on-primary font-bold text-xs rounded-lg hover:bg-primary/90">Save</button>
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
      <h3 className="text-sm font-bold text-on-surface mb-2">{preset.name}</h3>
      <div className="space-y-1 text-xs text-on-surface-variant">
        <p>{preset.brand} {preset.model}</p>
        <p>{preset.lengthCm}cm • {preset.flex} flex • {preset.shape}</p>
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
        <input placeholder="Trail Name" value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        <input placeholder="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        <select value={kickerType} onChange={(e) => setKickerType(e.target.value)} className="px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary">
          {['big-air', 'slopestyle', 'halfpipe', 'rail', 'kicker'].map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <select value={snow} onChange={(e) => setSnow(e.target.value)} className="px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary">
          {['powder', 'packed', 'icy', 'slush', 'corduroy'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="number" placeholder="Takeoff Angle" value={takeoff} onChange={(e) => setTakeoff(parseInt(e.target.value) || 0)} className="px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        <input type="number" placeholder="Landing Angle" value={landing} onChange={(e) => setLanding(parseInt(e.target.value) || 0)} className="px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
        <input type="number" placeholder="Vertical Drop (m)" value={drop} onChange={(e) => setDrop(parseFloat(e.target.value) || 0)} className="px-3 py-2 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/20 focus:border-primary" />
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2 bg-surface-container-high text-on-surface font-bold text-xs rounded-lg hover:bg-surface-container-highest">Cancel</button>
        <button onClick={handleSave} className="flex-1 py-2 bg-primary text-on-primary font-bold text-xs rounded-lg hover:bg-primary/90">Save</button>
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
      <h3 className="text-sm font-bold text-on-surface mb-2">{preset.name}</h3>
      <div className="space-y-1 text-xs text-on-surface-variant">
        <p>{preset.difficulty} • {preset.kickerType}</p>
        <p>{preset.verticalDrop}m drop • {preset.snowCondition}</p>
        <p>Takeoff {preset.takeoffAngle}° • Landing {preset.landingAngle}°</p>
      </div>
    </div>
  );
}
