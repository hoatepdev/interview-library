'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart3, Target, TrendingUp, Clock, Flame, Lock, CalendarDays } from 'lucide-react';
import { practiceApi, topicsApi } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useLoginDialog } from '@/contexts/login-dialog-context';
import type { PracticeStats, AnalyticsResponse, DueQuestion } from '@/types';

import { ChartCard } from './ChartCard';
import { ChartSkeleton } from './ChartSkeleton';
import { StatusPieChart } from './StatusPieChart';
import { RatingBarChart } from './RatingBarChart';
import { LevelDistributionChart } from './LevelDistributionChart';
import { ActivityAreaChart } from './ActivityAreaChart';
import { TopicMasteryChart } from './TopicMasteryChart';
import { RatingTrendChart } from './RatingTrendChart';
import { StreakDisplay } from './StreakDisplay';

interface AnalyticsData {
  stats: PracticeStats | null;
  analytics: AnalyticsResponse | null;
  dueQuestions: DueQuestion[];
}

export function AnalyticsPage() {
  const t = useTranslations('analytics');
  const tPractice = useTranslations('practice');
  const tAuth = useTranslations('auth');
  const { user, loading: authLoading } = useAuth();
  const { openDialog } = useLoginDialog();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [statsResult, analyticsResult, dueResult] = await Promise.allSettled([
          practiceApi.getStats(),
          practiceApi.getAnalytics(30),
          practiceApi.getQuestionsDueForReview(100),
        ]);

        setData({
          stats: statsResult.status === 'fulfilled' ? statsResult.value : null,
          analytics: analyticsResult.status === 'fulfilled' ? analyticsResult.value : null,
          dueQuestions: dueResult.status === 'fulfilled' ? dueResult.value : [],
        });
      } catch (error) {
        console.error('Failed to load analytics', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="space-y-6">
        <ChartSkeleton height={100} />
        <ChartSkeleton height={300} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartSkeleton height={250} />
          <ChartSkeleton height={250} />
        </div>
      </div>
    );
  }

  // Login prompt
  if (!user) {
    return (
      <div className="group relative overflow-hidden bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/10 p-6 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10 flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800/80 dark:shadow-[0_0_15px_rgba(148,163,184,0.3)] flex items-center justify-center transition-shadow duration-500">
            <Lock className="w-7 h-7 text-slate-400 dark:text-slate-500" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{t('title')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('loginRequired')}</p>
          </div>
          <button
            onClick={() => openDialog()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer dark:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
          >
            {tAuth('login')}
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/10 p-4 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <ChartSkeleton height={300} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartSkeleton height={250} />
          <ChartSkeleton height={250} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartSkeleton height={250} />
          <ChartSkeleton height={250} />
        </div>
        <ChartSkeleton height={300} />
      </div>
    );
  }

  const stats = data?.stats;
  const analytics = data?.analytics;
  const dueQuestions = data?.dueQuestions || [];

  // Calculate derived metrics
  const positiveRatings = Number(stats?.practiceByRating?.good || 0) + Number(stats?.practiceByRating?.great || 0);
  const totalRatings = stats?.totalPracticeSessions || 1;
  const accuracy = totalRatings > 0 ? Math.round((positiveRatings / totalRatings) * 100) : 0;

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Spaced repetition averages
  const avgEaseFactor = dueQuestions.length > 0
    ? (dueQuestions.reduce((sum, q) => sum + ((q as any).easeFactor || 2.5), 0) / dueQuestions.length).toFixed(2)
    : '—';
  const avgInterval = dueQuestions.length > 0
    ? Math.round(dueQuestions.reduce((sum, q) => sum + ((q as any).intervalDays || 0), 0) / dueQuestions.length)
    : 0;

  // Count questions due in next 7 days
  const now = new Date();
  const next7Days = new Date(now);
  next7Days.setDate(next7Days.getDate() + 7);

  return (
    <div className="space-y-6">
      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="group relative overflow-hidden bg-blue-500/5 dark:bg-slate-900/30 backdrop-blur-xl border border-blue-500/20 dark:border-blue-500/10 rounded-2xl p-4 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-blue-500/40 transition-all duration-500">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Target className="w-3.5 h-3.5 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
            {t('sessions')}
          </div>
          <div className="relative z-10 text-3xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
            {stats?.totalPracticeSessions || 0}
          </div>
        </div>
        <div className="group relative overflow-hidden bg-green-500/5 dark:bg-slate-900/30 backdrop-blur-xl border border-green-500/20 dark:border-green-500/10 rounded-2xl p-4 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-green-500/40 transition-all duration-500">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-3.5 h-3.5 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
            {t('accuracy')}
          </div>
          <div className="relative z-10 text-3xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
            {accuracy}%
          </div>
        </div>
        <div className="group relative overflow-hidden bg-purple-500/5 dark:bg-slate-900/30 backdrop-blur-xl border border-purple-500/20 dark:border-purple-500/10 rounded-2xl p-4 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-purple-500/40 transition-all duration-500">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
            {t('timeSpent')}
          </div>
          <div className="relative z-10 text-3xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
            {formatTime(stats?.totalPracticeTimeMinutes || 0)}
          </div>
        </div>
        <div className="group relative overflow-hidden bg-orange-500/5 dark:bg-slate-900/30 backdrop-blur-xl border border-orange-500/20 dark:border-orange-500/10 rounded-2xl p-4 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-orange-500/40 transition-all duration-500">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center gap-1.5 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Flame className="w-3.5 h-3.5 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
            {t('currentStreak')}
          </div>
          <div className="relative z-10 text-3xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
            {analytics?.streak.current || 0}
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1 drop-shadow-none">{t('days')}</span>
          </div>
        </div>
      </div>

      {/* Streak Display */}
      {analytics?.streak && (
        <ChartCard title={t('currentStreak')} icon={Flame} iconColor="text-orange-500">
          <StreakDisplay streak={analytics.streak} />
        </ChartCard>
      )}

      {/* Practice Activity */}
      {analytics?.dailyActivity && (
        <ChartCard title={t('practiceActivity')} subtitle={t('practiceActivityDesc')} icon={BarChart3}>
          <ActivityAreaChart data={analytics.dailyActivity} />
        </ChartCard>
      )}

      {/* Status + Level Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title={t('questionsMastery')} icon={Target} iconColor="text-green-500">
          <StatusPieChart data={stats?.questionsByStatus || {}} />
        </ChartCard>
        <ChartCard title={t('levelDistribution')} icon={BarChart3} iconColor="text-purple-500">
          <LevelDistributionChart data={stats?.questionsByLevel || {}} />
        </ChartCard>
      </div>

      {/* Rating Distribution + Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title={t('ratingDistribution')} icon={TrendingUp} iconColor="text-yellow-500">
          <RatingBarChart data={stats?.practiceByRating || {}} />
        </ChartCard>
        {analytics?.ratingTrend && (
          <ChartCard title={t('ratingTrend')} subtitle={t('ratingTrendDesc')} icon={TrendingUp} iconColor="text-blue-500">
            <RatingTrendChart data={analytics.ratingTrend} />
          </ChartCard>
        )}
      </div>

      {/* Topic Mastery Breakdown */}
      {analytics?.topicMastery && analytics.topicMastery.length > 0 && (
        <ChartCard title={t('topicBreakdown')} icon={BarChart3} iconColor="text-indigo-500">
          <TopicMasteryChart data={analytics.topicMastery} />
        </ChartCard>
      )}

      {/* Spaced Repetition Metrics */}
      <ChartCard title={t('spacedRepetition')} subtitle={t('spacedRepetitionDesc')} icon={CalendarDays} iconColor="text-teal-500">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="group relative overflow-hidden bg-teal-500/5 dark:bg-slate-900/30 backdrop-blur-xl border border-teal-500/20 dark:border-teal-500/10 rounded-xl p-3 shadow-sm hover:border-teal-500/40 transition-all duration-500">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]">
              {tPractice('dueForReview')}
            </div>
            <div className="relative z-10 text-2xl font-black text-slate-900 dark:text-white">{stats?.questionsNeedingReview || 0}</div>
          </div>
          <div className="group relative overflow-hidden bg-indigo-500/5 dark:bg-slate-900/30 backdrop-blur-xl border border-indigo-500/20 dark:border-indigo-500/10 rounded-xl p-3 shadow-sm hover:border-indigo-500/40 transition-all duration-500">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]">
              {t('avgEaseFactor')}
            </div>
            <div className="relative z-10 text-2xl font-black text-slate-900 dark:text-white">{avgEaseFactor}</div>
          </div>
          <div className="group relative overflow-hidden bg-violet-500/5 dark:bg-slate-900/30 backdrop-blur-xl border border-violet-500/20 dark:border-violet-500/10 rounded-xl p-3 shadow-sm hover:border-violet-500/40 transition-all duration-500">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]">
              {t('avgInterval')}
            </div>
            <div className="relative z-10 text-2xl font-black text-slate-900 dark:text-white">
              {avgInterval}
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1">{t('days')}</span>
            </div>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
