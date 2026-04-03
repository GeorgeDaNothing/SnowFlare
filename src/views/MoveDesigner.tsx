import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  RotateCw, 
  Play, 
  Bolt, 
  ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MoveDesigner() {
  const [rotationX, setRotationX] = useState(1440);
  const [inversionY, setInversionY] = useState(82);
  const [selectedGrab, setSelectedGrab] = useState('Indy Grab');

  return (
    <div className="flex-1 flex p-8 gap-8 overflow-hidden h-[calc(100vh-64px)]">
      {/* 3D Viewport Canvas */}
      <div className="flex-1 relative rounded-xl bg-surface-container-low overflow-hidden group border border-outline-variant/10 shadow-inner">
        {/* Background Simulation Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-container-lowest to-surface-dim">
          <img 
            alt="Snowboard Simulation" 
            className="w-full h-full object-cover opacity-80" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-oLf3VAjIHwULJSoM44PQSfUhPHEbdVnUxRVsff0bJzBzBPjFo4u5VhE4zT7HihvYnGgyE2dj6XHRUrOt7z3yfZZRa4uxF2fAElqZfE9RS8Fq6cKxlRX_fNeib9ih1TZazp6mOlQjqhntI5ExogTyYn_jO2y5ml9kIV3jZsbRWueD6XeXCzTIbUDUTmpgDrYFweBqJT9uNOJSYHGvpgf6035MVRgHvlnjXoZX9HoxSuvGU37_w6du9HD2dGxSWVMH7w7JwMSu_1U"
            referrerPolicy="no-referrer"
          />
        </div>
        
        {/* HUD Overlays */}
        <div className="absolute top-6 left-6 flex flex-col gap-2">
          <div className="px-3 py-1 bg-white/60 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest text-primary uppercase border border-white/40">
            Active Simulation
          </div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-on-surface">fs_triple_cork_1440</h1>
        </div>

        {/* Bottom Metrics */}
        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
          <div className="flex gap-4">
            <div className="px-6 py-4 bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 shadow-lg shadow-stone-200/50">
              <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant font-bold mb-1">Air Time</p>
              <p className="text-2xl font-black text-on-surface">2.4 <span className="text-sm font-normal text-on-surface-variant">sec</span></p>
            </div>
            <div className="px-6 py-4 bg-white/80 backdrop-blur-xl rounded-lg border border-white/20 shadow-lg shadow-stone-200/50">
              <p className="text-[10px] uppercase tracking-tighter text-on-surface-variant font-bold mb-1">Landing Probability</p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-black text-on-surface">88%</p>
                <div className="w-16 h-1.5 bg-secondary-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '88%' }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white/90 text-on-surface hover:bg-primary hover:text-on-primary transition-all duration-300 shadow-md">
              <RotateCw className="w-5 h-5" />
            </button>
            <button className="px-6 py-3 flex items-center gap-2 rounded-full bg-primary text-on-primary font-bold shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
              <Play className="w-4 h-4 fill-current" />
              Render Sequence
            </button>
          </div>
        </div>
      </div>

      {/* Controls Sidebar */}
      <div className="w-80 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
        {/* Axis Control Card */}
        <section className="p-6 bg-surface-container-high rounded-xl space-y-6 border border-outline-variant/10">
          <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20 pb-2">Movement Axis</h3>
          
          {/* Axis Rotation X */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-on-surface">Axis Rotation (X)</label>
              <span className="text-xs font-bold text-primary">{rotationX}°</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="1440" 
              value={rotationX} 
              onChange={(e) => setRotationX(parseInt(e.target.value))}
              className="w-full h-2 bg-surface-container rounded-full appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Inversion Depth Y */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-on-surface">Inversion Depth (Y)</label>
              <span className="text-xs font-bold text-primary">{inversionY}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={inversionY} 
              onChange={(e) => setInversionY(parseInt(e.target.value))}
              className="w-full h-2 bg-surface-container rounded-full appearance-none cursor-pointer accent-primary"
            />
          </div>
        </section>

        {/* Grab Signatures Card */}
        <section className="p-6 bg-surface-container-high rounded-xl space-y-4 border border-outline-variant/10">
          <h3 className="text-xs font-black uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20 pb-2">Grab Signatures</h3>
          <div className="grid grid-cols-2 gap-2">
            {['Indy Grab', 'Melon', 'Mute', 'Stalefish'].map((grab) => (
              <button 
                key={grab}
                onClick={() => setSelectedGrab(grab)}
                className={cn(
                  "py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-all",
                  selectedGrab === grab 
                    ? "bg-primary text-on-primary shadow-md" 
                    : "bg-surface-container-lowest text-on-surface-variant hover:bg-secondary-container/50"
                )}
              >
                {grab}
              </button>
            ))}
          </div>
        </section>

        {/* Physics Feedback Card */}
        <section className="p-6 bg-surface-container-highest rounded-xl space-y-4 border border-outline-variant/10">
          <div className="flex items-center gap-3">
            <Bolt className="w-5 h-5 text-tertiary fill-current" />
            <h3 className="text-sm font-bold text-on-surface">AI Physics Check</h3>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            The current rotation speed requires a minimum launch velocity of <span className="font-bold text-on-surface">18.4 m/s</span> to maintain stability.
          </p>
          <div className="p-3 bg-tertiary/10 rounded-lg border border-tertiary/20">
            <div className="flex justify-between items-center text-[10px] font-bold text-tertiary mb-1">
              <span>Rotational Torque</span>
              <span>Optimal</span>
            </div>
            <div className="w-full h-1 bg-tertiary/20 rounded-full overflow-hidden">
              <div className="h-full bg-tertiary" style={{ width: '92%' }}></div>
            </div>
          </div>
        </section>

        {/* Action Button Container */}
        <div className="mt-auto pt-4 flex gap-3">
          <button className="flex-1 py-4 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-xs font-bold text-on-surface-variant uppercase tracking-widest hover:bg-white transition-all active:scale-95 shadow-sm">
            Save Preset
          </button>
        </div>
      </div>
    </div>
  );
}
