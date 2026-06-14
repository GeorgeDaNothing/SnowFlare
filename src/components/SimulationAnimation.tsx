import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReplayData } from '@/types';

interface SimulationAnimationProps {
  replay: ReplayData;
  className?: string;
}

export function SimulationAnimation({ replay, className }: SimulationAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(true);
  const [replayTime, setReplayTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);

  const frames = replay.frames;

  useEffect(() => {
    if (frames.length > 0) {
      setDuration(frames[frames.length - 1].time);
      setReplayTime(frames[0].time);
    }
  }, [frames]);

  const sampleFrame = useCallback(
    (time: number): { a: (typeof frames)[0]; b: (typeof frames)[0]; alpha: number } => {
      if (time <= frames[0].time) return { a: frames[0], b: frames[0], alpha: 0 };
      for (let i = 0; i < frames.length - 1; i++) {
        const a = frames[i];
        const b = frames[i + 1];
        if (a.time <= time && time <= b.time) {
          const span = Math.max(b.time - a.time, 0.000001);
          return { a, b, alpha: (time - a.time) / span };
        }
      }
      const last = frames[frames.length - 1];
      return { a: last, b: last, alpha: 0 };
    },
    [frames]
  );

  const project = useCallback(
    (canvas: HTMLCanvasElement, minX: number, maxX: number, minZ: number, maxZ: number) => {
      const padding = { left: 28, right: 28, top: 32, bottom: 56 };
      const xRange = maxX - minX || 1;
      const zRange = maxZ - minZ || 1;

      return {
        sx: (x: number) =>
          padding.left + ((x - minX) / xRange) * (canvas.width - padding.left - padding.right),
        sz: (z: number) =>
          canvas.height - padding.bottom - ((z - minZ) / zRange) * (canvas.height - padding.top - padding.bottom),
        padding,
      };
    },
    []
  );

  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const xs = replay.config_points.map((p) => p.position[0]);
      const zs = replay.config_points.map((p) => p.position[2]);
      const fxs = frames.map((f) => f.position[0]);
      const fzs = frames.map((f) => f.position[2]);
      const minX = Math.min(...xs, ...fxs);
      const maxX = Math.max(...xs, ...fxs);
      const minZ = Math.min(...zs, ...fzs) - 1;
      const maxZ = Math.max(...zs, ...fzs) + 4;
      const { sx, sz } = project(canvas, minX, maxX, minZ, maxZ);

      // Background
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 4; i++) {
        const y = 32 + (i * (height - 88)) / 4;
        ctx.moveTo(48, y);
        ctx.lineTo(width - 48, y);
      }
      ctx.stroke();

      // Kicker profile
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      replay.config_points.forEach((point, index) => {
        const px = sx(point.position[0]);
        const pz = sz(point.position[2]);
        if (index === 0) ctx.moveTo(px, pz);
        else ctx.lineTo(px, pz);
      });
      ctx.stroke();

      // Kicker fill
      ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.lineTo(sx(replay.config_points[replay.config_points.length - 1].position[0]), height - 56);
      ctx.lineTo(sx(replay.config_points[0].position[0]), height - 56);
      ctx.closePath();
      ctx.fill();

      // Point markers & labels
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      for (const point of replay.config_points) {
        const px = sx(point.position[0]);
        const pz = sz(point.position[2]);
        ctx.beginPath();
        ctx.arc(px, pz, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.fillStyle = '#64748b';
        ctx.fillText(point.label, px, pz - 8);
      }

      // Trajectory trail
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      frames.forEach((frame, index) => {
        const px = sx(frame.position[0]);
        const pz = sz(frame.position[2]);
        if (index === 0) ctx.moveTo(px, pz);
        else ctx.lineTo(px, pz);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Current frame
      const { a, b, alpha } = sampleFrame(time);
      const x = a.position[0] + (b.position[0] - a.position[0]) * alpha;
      const y = a.position[1] + (b.position[1] - a.position[1]) * alpha;
      const z = a.position[2] + (b.position[2] - a.position[2]) * alpha;
      const bodyControl = {
        compression:
          (a.body_control?.compression ?? 0) +
          ((b.body_control?.compression ?? 0) - (a.body_control?.compression ?? 0)) * alpha,
        forward_lean:
          (a.body_control?.forward_lean ?? 0) +
          ((b.body_control?.forward_lean ?? 0) - (a.body_control?.forward_lean ?? 0)) * alpha,
      };

      const boardX = sx(x);
      const boardZ = sz(z) - y * 8; // exaggerate lateral offset slightly

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.beginPath();
      ctx.ellipse(boardX, sz(minZ) + 4, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Snowboarder group
      ctx.save();
      ctx.translate(boardX, boardZ);
      ctx.rotate(-0.15 - bodyControl.forward_lean * 0.5);

      // Board
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-18, -3, 36, 6);

      // Rider torso
      const torsoHeight = 22 - bodyControl.compression * 10;
      const torsoTop = -28 + bodyControl.compression * 10;
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(-6, torsoTop, 12, torsoHeight);

      // Head
      ctx.fillStyle = '#f0b56d';
      ctx.beginPath();
      ctx.arc(0, torsoTop - 7, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Phase badge
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.textAlign = 'left';
      const phase = a.phase || 'inrun';
      const phaseLabel = phase.charAt(0).toUpperCase() + phase.slice(1);
      ctx.fillText(`Phase: ${phaseLabel}`, 16, 24);

      // Height readout
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText(`Height: ${z.toFixed(2)}m`, 16, 42);
    },
    [frames, project, replay.config_points, sampleFrame]
  );

  useEffect(() => {
    let mounted = true;

    const loop = (timestamp: number) => {
      if (!mounted) return;
      if (!lastTsRef.current) lastTsRef.current = timestamp;
      const delta = (timestamp - lastTsRef.current) / 1000;
      lastTsRef.current = timestamp;

      setReplayTime((prev) => {
        const next = playing ? (prev + delta) % duration : prev;
        draw(next);
        return next;
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    if (duration > 0) {
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [duration, playing, draw]);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaying(false);
    const next = (Number(e.target.value) / 1000) * duration;
    setReplayTime(next);
    draw(next);
  };

  const togglePlay = () => setPlaying((p) => !p);

  const toggleExpand = () => {
    setExpanded((prev) => {
      const next = !prev;
      // Redraw after the layout change so the canvas resizes correctly.
      requestAnimationFrame(() => draw(replayTime));
      return next;
    });
  };

  const reset = () => {
    setReplayTime(0);
    draw(0);
    setPlaying(true);
  };

  const card = (
    <div className={cn('bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden flex flex-col', className)}>
      <div ref={containerRef} className={cn('relative w-full', expanded ? 'flex-1 min-h-0' : 'h-72 md:h-80 lg:h-96')}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>

      <div className="flex items-center gap-3 px-4 py-3 bg-surface-container-high border-t border-outline-variant/10 shrink-0">
        <button
          onClick={togglePlay}
          className="p-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          onClick={reset}
          className="p-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-highest transition-colors"
          aria-label="Replay"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={toggleExpand}
          className="p-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-highest transition-colors"
          aria-label={expanded ? 'Collapse' : 'Expand'}
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        <input
          type="range"
          min={0}
          max={1000}
          value={duration > 0 ? (replayTime / duration) * 1000 : 0}
          onChange={handleScrub}
          className="flex-1 h-2 bg-surface-container rounded-full appearance-none cursor-pointer accent-primary"
        />
        <span className="text-xs font-mono text-on-surface-variant w-16 text-right">
          {replayTime.toFixed(2)}s
        </span>
      </div>
    </div>
  );

  if (expanded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 md:p-8">
        <div className="w-full h-full max-w-7xl flex flex-col">
          <div className="flex-1 min-h-0">{card}</div>
        </div>
      </div>
    );
  }

  return card;
}
