import React from 'react';
import { motion } from 'motion/react';
import { 
  Share2, 
  PlayCircle, 
  BarChart3, 
  RefreshCw, 
  Hand, 
  Scale, 
  ArrowRight,
  SkipBack,
  Pause,
  SkipForward,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function VideoAnalysis() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold tracking-widest uppercase rounded-full">AI Analysis Active</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-on-surface uppercase italic">360° BACKFLIP EVALUATION</h1>
          <p className="text-on-surface-variant max-w-xl mt-4 leading-relaxed">Detailed biomechanical breakdown of the latest session. AI-assisted frame analysis identifies precision gaps in rotation and landing phases.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-surface-container-high hover:bg-surface-container-highest transition-colors font-bold text-sm rounded-lg flex items-center gap-2">
            <Share2 className="w-4 h-4" /> Export Data
          </button>
          <button className="px-6 py-3 bg-primary text-on-primary font-bold text-sm rounded-lg flex items-center gap-2 shadow-lg shadow-primary/20">
            <PlayCircle className="w-4 h-4" /> Re-Run Model
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Video Analysis Card */}
        <div className="col-span-12 xl:col-span-8 bg-surface-container-low rounded-xl overflow-hidden relative group border border-outline-variant/10">
          <div className="aspect-video relative overflow-hidden">
            <img 
              alt="Backflip Analysis" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCcg_F3um--0AefYhwB8kdwRvbZfpxyFnlDOyxg1YASuv_K1UgCYIWiiXOh1GMnMWJ9c7ocPJeuU1wuowkcReWrc8a91GnqzhNIKJAQSjCWUKzyfzyY7Mou3CdgcT683VwDIMjRR98YLdzaOkCHUwONSvLtjYxcl9uMtLJJ4DQlckOk9h6MaFaAh9JU7LyEZIquUPkk35NzB1qws4DVSZffzf02YX0a_Cs5kMlp1d1xVFqwdVHZsdhNMKoyYn5eu3VbVlD1uELZUM"
              referrerPolicy="no-referrer"
            />
            {/* AI Overlay UI */}
            <div className="absolute inset-0 video-overlay-grid pointer-events-none"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-full h-full opacity-80" viewBox="0 0 1000 600">
                <circle cx="500" cy="300" fill="none" r="180" stroke="#FF6B35" strokeDasharray="10 5" strokeWidth="2"></circle>
                <line stroke="#FF6B35" strokeWidth="1" x1="500" x2="500" y1="120" y2="480"></line>
                <line stroke="#FF6B35" strokeWidth="1" x1="320" x2="680" y1="300" y2="300"></line>
                <circle cx="500" cy="120" fill="#FF6B35" r="6"></circle>
                <text className="text-[10px] font-bold" fill="#FF6B35" x="515" y="125">ROTATION AXIS [A]</text>
              </svg>
            </div>
            
            {/* Data Tags on Video */}
            <div className="absolute top-6 left-6 flex flex-col gap-2">
              <div className="bg-on-surface/90 text-surface px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> REC 00:04:12:09
              </div>
              <div className="bg-surface/80 backdrop-blur-md text-on-surface px-3 py-1.5 rounded-lg text-xs font-bold border border-outline-variant/20">
                VELOCITY: 42.4 KM/H
              </div>
            </div>

            {/* Player Controls */}
            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex flex-col gap-4">
                <div className="w-full h-1.5 bg-white/20 rounded-full relative overflow-hidden group/timeline">
                  <div className="absolute top-0 left-0 h-full w-[65%] bg-primary"></div>
                  <div className="absolute top-0 left-[65%] h-full w-1 bg-white shadow-xl shadow-white/50"></div>
                </div>
                <div className="flex justify-between items-center text-white">
                  <div className="flex items-center gap-6">
                    <button className="hover:scale-110 transition-transform"><SkipBack className="w-6 h-6" /></button>
                    <button className="hover:scale-110 transition-transform"><Pause className="w-8 h-8 fill-current" /></button>
                    <button className="hover:scale-110 transition-transform"><SkipForward className="w-6 h-6" /></button>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono opacity-80">
                    <span>FRAME 124/256</span>
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final Performance Index Card */}
        <div className="col-span-12 md:col-span-6 xl:col-span-4 bg-surface-container-highest p-8 rounded-xl flex flex-col justify-between border border-outline-variant/10">
          <div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-sm font-bold tracking-widest text-on-surface-variant uppercase">Final Performance Index</h3>
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-extrabold text-on-surface tracking-tighter">84</span>
              <span className="text-xl font-bold text-primary">ELITE GRADE</span>
            </div>
            <p className="text-sm text-on-surface-variant mt-4 leading-relaxed">Top 5% of your seasonal average. Consistent elevation and improved air-time logic observed.</p>
          </div>
          <div className="mt-8 space-y-4">
            <div className="h-1 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full w-[84%] bg-primary"></div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-on-surface-variant uppercase">
              <span>Base Skill</span>
              <span>World Class</span>
            </div>
          </div>
        </div>

        {/* Critical Deviations Card */}
        <div className="col-span-12 md:col-span-6 xl:col-span-5 bg-surface-container-low p-8 rounded-xl border border-outline-variant/20">
          <h3 className="text-sm font-bold tracking-widest text-on-surface-variant uppercase mb-8">Critical Deviations</h3>
          <div className="space-y-6">
            {[
              { icon: RefreshCw, title: 'Rotation Accuracy', desc: 'Over-rotated by 4.2° at apex', val: '-0.4pts', color: 'text-error' },
              { icon: Hand, title: 'Grab Completion', desc: 'Delayed tail-grab by 0.12s', val: '-0.2pts', color: 'text-error' },
              { icon: Scale, title: 'Stance Stability', desc: 'Optimal center of gravity on landing', val: '+0.8pts', color: 'text-tertiary', bg: 'bg-secondary-container' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", item.bg || "bg-primary/10")}>
                    <item.icon className={cn("w-5 h-5", item.bg ? "text-on-secondary-container" : "text-primary")} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{item.title}</p>
                    <p className="text-xs text-on-surface-variant">{item.desc}</p>
                  </div>
                </div>
                <span className={cn("text-xs font-bold", item.color)}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coach AI Suggestion */}
        <div className="col-span-12 xl:col-span-7 bg-on-surface text-surface p-8 rounded-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary-container opacity-20 blur-3xl rounded-full"></div>
          <div className="relative z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-on-primary rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
              Coach AI Insight
            </div>
            <h4 className="text-2xl font-bold mb-3">Optimize Apex Rotation</h4>
            <p className="text-surface/70 text-sm leading-relaxed max-w-lg">Your core tension is dropping 150ms before the flip peak. Try focusing on "reaching" with your lead shoulder earlier. This will stabilize the rotation axis and prevent the 4° drift we're seeing in the descent phase.</p>
            <button className="mt-6 flex items-center gap-2 text-primary font-bold text-sm hover:translate-x-2 transition-transform">
              View Corrective Drill Library <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="relative w-full md:w-48 aspect-square rounded-xl overflow-hidden shadow-2xl shrink-0 group cursor-pointer">
            <img 
              alt="AI Drill Preview" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC630xwd8Ycbel4DQPE4IOTGVKqUzbYsIpYCfeNH6Qhs6iKG91lJ5SlJb2Bz9QjSBnTxXsGNMI28xHdfV5bBSWNe0nXFJSx59nZAx-0r9RRT-3TZpiQaVflqMU_2hT09KzzL2ClzcTRclX69qsIchd3lnNXuZJfe2QrrqLJh_ZBqzpxoegaHefq6EIvXF9TwqDJ_XM0xA8_Bw8jbhPpPUCV5_T63p7EyhBcMSF-pPe9_yxS8k11RQyTOLj7EVMWwDzsvmm3UIf1HWc"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
              <PlayCircle className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
