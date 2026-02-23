'use client';

import { Flame, Trophy } from 'lucide-react';
import type { AnalyticsStreak } from '@/types';

interface StreakDisplayProps {
  streak: AnalyticsStreak;
  compact?: boolean;
}

export function StreakDisplay({ streak, compact = false }: StreakDisplayProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 dark:shadow-[0_0_12px_rgba(251,146,60,0.4)]">
          <Flame className="w-5 h-5 drop-shadow-[0_0_8px_currentColor]" />
        </div>
        <div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
            {streak.current}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            day streak
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="group relative overflow-hidden bg-orange-500/5 dark:bg-slate-900/30 backdrop-blur-xl border border-orange-500/20 dark:border-orange-500/10 rounded-xl p-4 shadow-sm hover:border-orange-500/40 transition-all duration-500">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10 flex items-center gap-2 mb-2">
          <Flame className="w-5 h-5 text-orange-500 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Current Streak</span>
        </div>
        <div className="relative z-10 text-3xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
          {streak.current}
        </div>
        <div className="relative z-10 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {streak.current === 1 ? 'day' : 'days'}
        </div>
      </div>
      <div className="group relative overflow-hidden bg-amber-500/5 dark:bg-slate-900/30 backdrop-blur-xl border border-amber-500/20 dark:border-amber-500/10 rounded-xl p-4 shadow-sm hover:border-amber-500/40 transition-all duration-500">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10 flex items-center gap-2 mb-2">
          <Trophy className="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Longest Streak</span>
        </div>
        <div className="relative z-10 text-3xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
          {streak.longest}
        </div>
        <div className="relative z-10 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {streak.longest === 1 ? 'day' : 'days'}
        </div>
      </div>
    </div>
  );
}
