import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar, Cloud, Trash2, ChevronRight, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, Star, Video, Wind, Thermometer, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTrainingLogs, saveTrainingLog, deleteTrainingLog } from '@/lib/storage';
import type { TrainingLog, TrainingLogMoveAttempt } from '@/types';

export function TrainingLogView() {
  const [logs, setLogs] = useState<TrainingLog[]>(getTrainingLogs);
  const [filter, setFilter] = useState<'all' | 'landed' | 'crashed' | 'injured' | 'favorites'>('all');
  const [viewingLog, setViewingLog] = useState<TrainingLog | null>(null);

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs;
    if (filter === 'favorites') return logs.filter((l) => l.isFavorite);
    return logs.filter((l) => {
      if (filter === 'landed') return l.moves.some((m) => m.landed);
      if (filter === 'crashed') return l.moves.some((m) => !m.landed);
      if (filter === 'injured') return l.moves.some((m) => m.injuryOccurred);
      return true;
    });
  }, [logs, filter]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const log = logs.find((l) => l.id === id);
    if (!log) return;
    const updated = { ...log, isFavorite: !log.isFavorite };
    saveTrainingLog(updated);
    setLogs(getTrainingLogs());
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this training log?')) {
      deleteTrainingLog(id);
      setLogs(getTrainingLogs());
      if (viewingLog?.id === id) setViewingLog(null);
    }
  };

  if (viewingLog) {
    return <LogDetail log={viewingLog} onBack={() => setViewingLog(null)} onDelete={() => handleDelete(viewingLog.id)} onUpdate={(l) => { saveTrainingLog(l); setLogs(getTrainingLogs()); }} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-primary font-bold tracking-widest text-[10px] uppercase block mb-2">Training History</span>
          <h1 className="text-4xl font-bold tracking-tight text-on-surface">Training Log</h1>
          <p className="text-on-surface-variant text-sm mt-1">Sessions are created automatically from simulations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-container-low rounded-lg p-1 border border-outline-variant/10">
            {(['all', 'favorites', 'landed', 'crashed', 'injured'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn('px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors', filter === f ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface')}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      {logs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLogs.map((log) => (
            <LogCard key={log.id} log={log} onClick={() => setViewingLog(log)} onDelete={() => handleDelete(log.id)} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Log Card
// ============================================

function LogCard({ log, onClick, onDelete, onToggleFavorite }: { log: TrainingLog; onClick: () => void; onDelete: () => void; onToggleFavorite: (id: string, e: React.MouseEvent) => void; key?: React.Key }) {
  const landedCount = log.moves.filter((m) => m.landed).length;
  const crashedCount = log.moves.filter((m) => !m.landed).length;
  const injured = log.moves.some((m) => m.injuryOccurred);
  const avgRisk = log.moves.length > 0 ? Math.round(log.moves.reduce((s, m) => s + m.preAnalysisRiskScore, 0) / log.moves.length) : 0;

  return (
    <motion.div layout whileHover={{ y: -2 }} className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10 cursor-pointer hover:border-primary/30 transition-colors group relative" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(log.date).toLocaleDateString()}
          </div>
          <h3 className="text-sm font-bold text-on-surface">{log.location || 'Unknown Location'}</h3>
        </div>
        <button onClick={(e) => onToggleFavorite(log.id, e)} className={cn('p-1.5 rounded-md transition-colors', log.isFavorite ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary hover:bg-primary/10')}>
          <Star className={cn('w-4 h-4', log.isFavorite && 'fill-current')} />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-3 text-xs">
        <span className="flex items-center gap-1"><Wind className="w-3 h-3" />{log.windSpeedKmh}km/h</span>
        <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" />{log.temperatureC}°C</span>
        <span className="flex items-center gap-1"><Snowflake className="w-3 h-3" />{log.snowQuality}</span>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5 text-xs"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /><span className="font-medium">{landedCount}</span></div>
        <div className="flex items-center gap-1.5 text-xs"><XCircle className="w-3.5 h-3.5 text-error" /><span className="font-medium">{crashedCount}</span></div>
        {injured && <div className="flex items-center gap-1.5 text-xs"><AlertTriangle className="w-3.5 h-3.5 text-error" /><span className="font-medium text-error">Injury</span></div>}
        {log.videos.length > 0 && <div className="flex items-center gap-1.5 text-xs"><Video className="w-3.5 h-3.5 text-on-surface-variant" /><span className="font-medium">{log.videos.length}</span></div>}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${avgRisk}%` }} />
        </div>
        <span className="text-[10px] font-bold text-on-surface-variant">Avg Risk {avgRisk}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {log.moves.slice(0, 3).map((m, i) => (
            <span key={i} className="px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-medium text-on-surface-variant border border-outline-variant/5">{m.moveName}</span>
          ))}
          {log.moves.length > 3 && <span className="px-2 py-0.5 text-[10px] text-on-surface-variant">+{log.moves.length - 3}</span>}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-on-surface-variant hover:text-error transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================
// Log Detail
// ============================================

function LogDetail({ log, onBack, onDelete, onUpdate }: { log: TrainingLog; onBack: () => void; onDelete: () => void; onUpdate: (l: TrainingLog) => void }) {
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = String(ev.target?.result || '');
      const updated = { ...log, videos: [...log.videos, dataUrl] };
      onUpdate(updated);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-12 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-primary font-medium hover:underline mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to training log
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-on-surface mb-2">{log.location || 'Training Session'}</h1>
          <div className="flex items-center gap-4 text-sm text-on-surface-variant">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(log.date).toLocaleDateString()}</span>
            <span className="flex items-center gap-1.5"><Cloud className="w-4 h-4" />{log.weather}</span>
            <span className="flex items-center gap-1.5"><Wind className="w-4 h-4" />{log.windSpeedKmh}km/h</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onUpdate({ ...log, isFavorite: !log.isFavorite })} className={cn('p-2 rounded-lg transition-colors', log.isFavorite ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:text-primary hover:bg-primary/10')}>
            <Star className={cn('w-5 h-5', log.isFavorite && 'fill-current')} />
          </button>
          <button onClick={onDelete} className="px-4 py-2 bg-error-container text-error font-bold text-sm rounded-lg hover:bg-error/10 transition-colors flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {log.notes && (
        <div className="p-4 bg-surface-container-low rounded-lg border border-outline-variant/10 mb-6">
          <p className="text-sm text-on-surface-variant italic">{log.notes}</p>
        </div>
      )}

      {/* Videos */}
      <div className="mb-8">
        <h2 className="text-sm font-black uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
          <Video className="w-4 h-4" /> Training Videos
        </h2>
        {log.videos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {log.videos.map((v, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-outline-variant/10 bg-black">
                <video src={v} controls className="w-full aspect-video" />
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          <input type="file" accept="video/*" onChange={handleVideoUpload} className="text-sm text-on-surface file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary file:text-on-primary hover:file:bg-primary/90" />
        </div>
      </div>

      {/* Moves */}
      <h2 className="text-sm font-black uppercase tracking-widest text-on-surface-variant mb-4">Moves Attempted</h2>
      <div className="space-y-3">
        {log.moves.map((move, i) => (
          <MoveAttemptRow key={i} attempt={move} index={i + 1} />
        ))}
      </div>
    </div>
  );
}

function MoveAttemptRow({ attempt, index }: { attempt: TrainingLogMoveAttempt; index: number; key?: React.Key }) {
  return (
    <div className={cn('p-4 rounded-xl border flex items-center gap-4', attempt.injuryOccurred ? 'bg-error-container border-error/20' : attempt.landed ? 'bg-green-50 border-green-200' : 'bg-surface-container-low border-outline-variant/10')}>
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0', attempt.landed ? 'bg-green-100 text-green-700' : attempt.injuryOccurred ? 'bg-error/10 text-error' : 'bg-surface-container-high text-on-surface-variant')}>
        {index}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-on-surface truncate">{attempt.moveName}</h4>
        <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-0.5">
          <span>Risk: {attempt.preAnalysisRiskScore}</span>
          <span>Fatigue: {attempt.fatigueLevel}/10</span>
          {attempt.postNotes && <span className="truncate max-w-[200px]">{attempt.postNotes}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {attempt.landed ? <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-md">Landed</span> : <span className="px-2 py-1 bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase rounded-md">Crash</span>}
        {attempt.injuryOccurred && <span className="px-2 py-1 bg-error text-on-error text-[10px] font-bold uppercase rounded-md">Injury</span>}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
        <Calendar className="w-8 h-8 text-on-surface-variant" />
      </div>
      <h3 className="text-lg font-bold text-on-surface mb-2">No training logs yet</h3>
      <p className="text-sm text-on-surface-variant max-w-md mb-6">Run a simulation to automatically create your first training log.</p>
      <a href="#/" className="px-6 py-3 bg-primary text-on-primary font-bold rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors">
        Start Simulation
      </a>
    </div>
  );
}
