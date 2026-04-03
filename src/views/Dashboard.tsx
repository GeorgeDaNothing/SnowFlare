import React from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Scale, 
  Sparkles, 
  ChevronRight, 
  Play,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
      <header className="mb-12">
        <span className="text-primary font-bold tracking-widest text-[10px] uppercase block mb-2">Athlete Profile</span>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <h1 className="text-5xl font-bold tracking-tight text-on-surface">
            Welcome back, <span className="text-primary">Marcus</span>.
          </h1>
          <div className="flex items-center gap-4 bg-surface-container-low px-6 py-3 rounded-lg border border-outline-variant/10">
            <div className="text-right">
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider leading-none">Status</p>
              <p className="text-sm font-semibold text-on-surface">Pro Elite Rank #12</p>
            </div>
            <div className="h-10 w-px bg-outline-variant/30"></div>
            <CheckCircle2 className="w-6 h-6 text-primary fill-current text-white" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* Stats Section */}
        <section className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rotation Speed Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between aspect-video md:aspect-auto border border-outline-variant/5 shadow-sm"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary-fixed rounded-lg">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-bold text-green-600 flex items-center bg-green-50 px-2 py-1 rounded">+12% vs last week</span>
              </div>
              <h3 className="text-on-surface-variant text-sm font-medium mb-1">Rotation Speed</h3>
              <p className="text-4xl font-bold text-on-surface">720<span className="text-lg font-normal text-on-surface-variant ml-1">°/s</span></p>
            </div>
            <div className="mt-6 h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[85%] rounded-full"></div>
            </div>
          </motion.div>

          {/* Landing Stability Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-container-lowest p-8 rounded-xl flex flex-col justify-between border border-outline-variant/5 shadow-sm"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-tertiary-fixed rounded-lg">
                  <Scale className="w-6 h-6 text-tertiary" />
                </div>
                <span className="text-xs font-bold text-orange-600 flex items-center bg-orange-50 px-2 py-1 rounded">-2% deviation</span>
              </div>
              <h3 className="text-on-surface-variant text-sm font-medium mb-1">Landing Stability</h3>
              <p className="text-4xl font-bold text-on-surface">94.2<span className="text-lg font-normal text-on-surface-variant ml-1">%</span></p>
            </div>
            <div className="mt-6 h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div className="bg-tertiary h-full w-[94%] rounded-full"></div>
            </div>
          </motion.div>

          {/* AI Prediction Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="col-span-12 bg-gradient-to-br from-primary to-primary-container p-8 rounded-xl text-on-primary orange-glow relative overflow-hidden group"
          >
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Peak Performance Window</span>
                </div>
                <h2 className="text-3xl font-bold mb-4 leading-tight">Your optimal training window is forecasted for tomorrow morning.</h2>
                <p className="text-on-primary/80 max-w-md text-sm leading-relaxed">Based on your sleep telemetry and recent rotation consistency, your neuromotor readiness will peak between 08:00 and 10:30 AM.</p>
              </div>
              <div className="bg-on-primary/10 backdrop-blur-md p-6 rounded-xl border border-on-primary/20 text-center min-w-[180px]">
                <p className="text-[10px] font-bold uppercase mb-1">Estimated Readiness</p>
                <p className="text-5xl font-black italic">98%</p>
                <button className="mt-4 w-full py-2 bg-on-primary text-primary font-bold rounded text-xs tracking-tight transition-transform active:scale-95">Set Alert</button>
              </div>
            </div>
            {/* Abstract BG Shape */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-500"></div>
          </motion.div>
        </section>

        {/* Sidebar Content */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-on-surface">Recent Sessions</h3>
              <button className="text-primary text-xs font-bold hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {[
                { grade: 'A', title: 'Frontside 1080 Mastery', time: '2h 15m • yesterday', color: 'text-primary bg-primary-fixed' },
                { grade: 'B+', title: 'Backcountry Transition', time: '1h 40m • 3 days ago', color: 'text-on-surface-variant bg-surface-container-highest' },
                { grade: 'A', title: 'Vertical G-Force Prep', time: '3h 05m • 4 days ago', color: 'text-primary bg-primary-fixed' },
              ].map((session, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center font-black text-xl transition-colors", session.color)}>
                    {session.grade}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-on-surface">{session.title}</h4>
                    <p className="text-xs text-on-surface-variant">{session.time}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-on-surface-variant/40 group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Tech Library Promo */}
          <div className="bg-surface-container-highest rounded-xl overflow-hidden relative aspect-square flex flex-col justify-end p-6 group cursor-pointer">
            <img 
              alt="Technique Library Cover" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCA0F8jRNpKTaAmNny9sg-NqZPR4KORvlEKU8cShOuWcVJExFX-jY1xiCoi2lDwihyInXHsVJZ4OgWTh9w_Ee1b2JlDS2c5a8wuC0B3DcwXYRTsgL4_XBujBj_C4F64vOM79SnMv5re7r-UuQpyDl697-kGqZF5IAdXVnb9l9XE7vQ18zsZ0r5Q_c_Lv1R7O6Pf-7Cf1wcsIhTrln4ZfA5v09pk5Dc_Wzv9r_1vj11JdPd1WdJkI7fDkkCKnHsXUBXzyqwd8SStC6k"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="relative z-10">
              <h3 className="text-white font-bold text-xl mb-2">New Technique Added</h3>
              <p className="text-white/70 text-sm mb-4">Master the 'Triple Cork' with our latest AI-enhanced breakdown.</p>
              <button className="bg-white text-on-surface px-6 py-2 rounded-lg text-sm font-bold active:scale-95 duration-200">Learn Move</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
