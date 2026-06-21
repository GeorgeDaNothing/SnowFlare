import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Scale,
  Sparkles,
  ChevronRight,
  Play,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getTrainingLogs, getMoves } from '@/lib/storage';
import type { TrainingLog } from '@/types';

export function Dashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TrainingLog[]>([]);
  const [savedMoves, setSavedMoves] = useState<Awaited<ReturnType<typeof getMoves>>>([]);

  useEffect(() => {
    getTrainingLogs().then(setSessions);
    getMoves().then(setSavedMoves);
  }, []);

  const stats = useMemo(() => {
    if (sessions.length === 0) return null;

    const allMoves = sessions.flatMap((s) => s.moves);
    const totalAttempts = allMoves.length;
    const landed = allMoves.filter((m) => m.landed).length;
    const injuries = allMoves.filter((m) => m.injuryOccurred).length;
    const avgRisk = totalAttempts > 0 ? Math.round(allMoves.reduce((s, m) => s + m.preAnalysisRiskScore, 0) / totalAttempts) : 0;

    // Most practiced move
    const moveCounts: Record<string, number> = {};
    allMoves.forEach((m) => {
      moveCounts[m.moveName] = (moveCounts[m.moveName] || 0) + 1;
    });
    const mostPracticed = Object.entries(moveCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    // Recent trend (last 3 sessions vs previous 3)
    const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recent = sorted.slice(0, 3).flatMap((s) => s.moves);
    const previous = sorted.slice(3, 6).flatMap((s) => s.moves);
    const recentAvgRisk = recent.length > 0 ? recent.reduce((s, m) => s + m.preAnalysisRiskScore, 0) / recent.length : 0;
    const prevAvgRisk = previous.length > 0 ? previous.reduce((s, m) => s + m.preAnalysisRiskScore, 0) / previous.length : 0;
    const riskDelta = prevAvgRisk > 0 ? ((recentAvgRisk - prevAvgRisk) / prevAvgRisk) * 100 : 0;

    return {
      totalSessions: sessions.length,
      totalAttempts,
      landingRate: totalAttempts > 0 ? Math.round((landed / totalAttempts) * 100) : 0,
      injuryRate: totalAttempts > 0 ? Math.round((injuries / totalAttempts) * 100) : 0,
      avgRisk,
      mostPracticed,
      riskDelta: Math.round(riskDelta),
      recentSessions: sorted.slice(0, 5),
    };
  }, [sessions]);

  const hasData = sessions.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
      <header className="mb-12">
        <span className="text-primary font-bold tracking-widest text-[10px] uppercase block mb-2">Athlete Profile</span>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <h1 className="text-5xl font-bold tracking-tight text-on-surface">
            Welcome back, <span className="text-primary">{user?.name || 'Rider'}</span>.
          </h1>
          <div className="flex items-center gap-4 bg-surface-container-low px-6 py-3 rounded-lg border border-outline-variant/10">
            <div className="text-right">
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider leading-none">Status</p>
              <p className="text-sm font-semibold text-on-surface">{hasData ? 'Active Training' : 'Get Started'}</p>
            </div>
            <div className="h-10 w-px bg-outline-variant/30"></div>
            <CheckCircle2 className="w-6 h-6 text-primary fill-current text-white" />
          </div>
        </div>
      </header>

      {!hasData ? (
        <EmptyDashboard />
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Stats Section */}
          <section className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rotation Speed Card - repurposed as Landing Rate */}
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
                  <span className={cn('text-xs font-bold flex items-center px-2 py-1 rounded', stats!.landingRate >= 70 ? 'text-green-700 bg-green-50' : 'text-orange-700 bg-orange-50')}>
                    {stats!.landingRate}% rate
                  </span>
                </div>
                <h3 className="text-on-surface-variant text-sm font-medium mb-1">Landing Success</h3>
                <p className="text-4xl font-bold text-on-surface">{stats!.landingRate}<span className="text-lg font-normal text-on-surface-variant ml-1">%</span></p>
              </div>
              <div className="mt-6 h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${stats!.landingRate}%` }}></div>
              </div>
            </motion.div>

            {/* Landing Stability Card - repurposed as Avg Risk */}
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
                  <span className={cn('text-xs font-bold flex items-center px-2 py-1 rounded', stats!.riskDelta > 0 ? 'text-error bg-error-container' : stats!.riskDelta < 0 ? 'text-green-700 bg-green-50' : 'text-on-surface-variant bg-surface-container-high')}>
                    {stats!.riskDelta > 0 ? '+' : ''}{stats!.riskDelta}% vs last 3
                  </span>
                </div>
                <h3 className="text-on-surface-variant text-sm font-medium mb-1">Average Risk Score</h3>
                <p className="text-4xl font-bold text-on-surface">{stats!.avgRisk}<span className="text-lg font-normal text-on-surface-variant ml-1">/100</span></p>
              </div>
              <div className="mt-6 h-1 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', stats!.avgRisk > 60 ? 'bg-error' : stats!.avgRisk > 40 ? 'bg-orange-500' : 'bg-tertiary')} style={{ width: `${stats!.avgRisk}%` }}></div>
              </div>
            </motion.div>

            {/* AI Prediction Card - repurposed as Insight Card */}
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
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Training Insight</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-4 leading-tight">
                    {stats!.injuryRate > 10
                      ? 'Your injury rate is elevated — consider stepping back difficulty.'
                      : stats!.landingRate > 80
                      ? 'Strong consistency — you\'re ready to progress rotation.'
                      : 'Focus on landing fundamentals before increasing complexity.'}
                  </h2>
                  <p className="text-on-primary/80 max-w-md text-sm leading-relaxed">
                    {stats!.mostPracticed !== '-' && `Most practiced: ${stats!.mostPracticed}. `}
                    {stats!.totalAttempts} total attempts across {stats!.totalSessions} sessions.
                  </p>
                </div>
                <div className="bg-on-primary/10 backdrop-blur-md p-6 rounded-xl border border-on-primary/20 text-center min-w-[180px]">
                  <p className="text-[10px] font-bold uppercase mb-1">Injury Rate</p>
                  <p className="text-5xl font-black italic">{stats!.injuryRate}<span className="text-lg not-italic">%</span></p>
                  <p className="text-[10px] text-on-primary/60 mt-2">{stats!.injuryRate < 5 ? 'Excellent' : stats!.injuryRate < 10 ? 'Acceptable' : 'Caution'}</p>
                </div>
              </div>
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-500"></div>
            </motion.div>
          </section>

          {/* Sidebar Content */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-on-surface">Recent Sessions</h3>
                <a href="#/training-log" className="text-primary text-xs font-bold hover:underline">View All</a>
              </div>
              <div className="space-y-4">
                {stats!.recentSessions.map((session: TrainingLog, i: number) => {
                  const landed = session.moves.filter((m) => m.landed).length;
                  const total = session.moves.length;
                  return (
                    <a key={session.id} href={`#/sessions`} className="flex items-center gap-4 group">
                      <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center font-black text-xl transition-colors', landed === total ? 'text-green-700 bg-green-50' : 'text-on-surface-variant bg-surface-container-highest')}>
                        {total > 0 ? Math.round((landed / total) * 100) : 0}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-on-surface">{session.location || 'Training'}</h4>
                        <p className="text-xs text-on-surface-variant">{new Date(session.date).toLocaleDateString()} • {landed}/{total} landed</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-on-surface-variant/40 group-hover:text-primary transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-surface-container-highest rounded-xl p-6 border border-outline-variant/10">
              <h3 className="text-sm font-bold text-on-surface mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <a href="#/designer" className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-on-surface">Design a Move</p>
                    <p className="text-xs text-on-surface-variant">Configure and analyze</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors" />
                </a>
                <a href="#/training-log" className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-tertiary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-on-surface">View Training Log</p>
                    <p className="text-xs text-on-surface-variant">Record outcomes</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-on-surface-variant group-hover:text-primary transition-colors" />
                </a>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-primary-container p-8 rounded-xl text-on-primary orange-glow relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 fill-current" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Getting Started</span>
            </div>
            <h2 className="text-3xl font-bold mb-4 leading-tight">Welcome to SnowFlare</h2>
            <p className="text-on-primary/80 max-w-md text-sm leading-relaxed mb-6">
              Start by designing a move in the Move Designer, then analyze it for danger factors. Log your sessions to build a personal risk profile over time.
            </p>
            <div className="flex gap-3">
              <a href="#/designer" className="px-6 py-3 bg-on-primary text-primary font-bold rounded-lg text-sm hover:bg-on-primary/90 transition-colors flex items-center gap-2">
                <Play className="w-4 h-4 fill-current" />
                Design First Move
              </a>
              <a href="#/sessions" className="px-6 py-3 bg-on-primary/10 text-on-primary font-bold rounded-lg text-sm hover:bg-on-primary/20 transition-colors flex items-center gap-2 border border-on-primary/20">
                View Training Log
              </a>
            </div>
          </div>
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </motion.div>
      </div>
      <aside className="col-span-12 lg:col-span-4">
        <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
          <h3 className="text-lg font-bold text-on-surface mb-4">How It Works</h3>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Design Your Move', desc: 'Set rotation, flip, grab, and kicker config.' },
              { step: '2', title: 'Analyze Danger', desc: 'Get instant physics + risk assessment.' },
              { step: '3', title: 'Log Outcomes', desc: 'Record what happened to track trends.' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-on-surface">{item.title}</h4>
                  <p className="text-xs text-on-surface-variant">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
