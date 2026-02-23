'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { BookOpen, Trophy, ArrowRight, Clock, Zap, Activity, BarChart3 } from 'lucide-react';
import { topicsApi, practiceApi } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import type { PracticeStats, PracticeLogEntry, AnalyticsResponse } from '@/types';
import { StatusPieChart } from '@/components/analytics/StatusPieChart';
import { RatingBarChart } from '@/components/analytics/RatingBarChart';
import { StreakDisplay } from '@/components/analytics/StreakDisplay';
import { ChartCard } from '@/components/analytics/ChartCard';

interface DashboardData {
  topicsCount: number;
  masteredCount: number;
  practiceTimeFormatted: string;
  dueCount: number;
  recentActivity: PracticeLogEntry[];
  practiceStats: PracticeStats | null;
  streak: { current: number; longest: number } | null;
}

const ratingColorMap: Record<string, string> = {
  great: 'text-green-500 bg-green-500/10',
  good: 'text-yellow-500 bg-yellow-500/10',
  fair: 'text-orange-500 bg-orange-500/10',
  poor: 'text-red-500 bg-red-500/10',
};

function formatPracticeTime(minutes: number, unit: string): string {
  if (minutes === 0) return `0${unit}`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}${unit}`;
  return `${hours}.${Math.round((mins / 60) * 10)}${unit}`;
}

function StatSkeleton() {
  return (
    <div className="relative group p-6 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-gradient-to-br from-slate-100/50 to-slate-200/30 dark:from-slate-800/50 dark:to-slate-900/30 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-slate-200/50 dark:bg-slate-700/50 w-12 h-12 animate-pulse" />
        <div className="w-12 h-1 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </div>
      <div>
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
        <div className="h-8 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-hidden">
      {[0, 1, 2].map((i) => (
        <div key={i} className="p-4 border-b border-slate-100 dark:border-white/5 last:border-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1.5" />
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-6 w-14 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function DashboardContent() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const tPractice = useTranslations('practice');
  const tAnalytics = useTranslations('analytics');
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [topics, stats, dueResult, history, analyticsResult] = await Promise.allSettled([
          topicsApi.getAll(),
          user ? practiceApi.getStats() : Promise.resolve(null),
          user ? practiceApi.getDueQuestionsCount() : Promise.resolve({ count: 0 }),
          user ? practiceApi.getHistory(5) : Promise.resolve([]),
          user ? practiceApi.getAnalytics(30) : Promise.resolve(null),
        ]);

        const topicsList = topics.status === 'fulfilled' ? topics.value : [];
        const statsData = stats.status === 'fulfilled' ? stats.value as PracticeStats | null : null;
        const due = dueResult.status === 'fulfilled' ? (dueResult.value as { count: number }) : { count: 0 };
        const recentLogs = history.status === 'fulfilled' ? history.value as PracticeLogEntry[] : [];
        const analyticsData = analyticsResult.status === 'fulfilled' ? analyticsResult.value as AnalyticsResponse | null : null;

        const masteredCount = statsData?.questionsByStatus?.mastered
          ? Number(statsData.questionsByStatus.mastered)
          : 0;

        const practiceMinutes = statsData?.totalPracticeTimeMinutes ?? 0;

        setData({
          topicsCount: topicsList.length,
          masteredCount,
          practiceTimeFormatted: formatPracticeTime(practiceMinutes, t('hours')),
          dueCount: due.count,
          recentActivity: recentLogs,
          practiceStats: statsData,
          streak: analyticsData?.streak ?? null,
        });
      } catch (error) {
        console.error('Failed to load dashboard data', error);
        setData({
          topicsCount: 0,
          masteredCount: 0,
          practiceTimeFormatted: `0${t('hours')}`,
          dueCount: 0,
          recentActivity: [],
          practiceStats: null,
          streak: null,
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, t]);

  const dueCount = data?.dueCount ?? 0;

  const stats = [
    {
      icon: BookOpen,
      label: t('totalTopics'),
      value: loading ? null : String(data?.topicsCount ?? 0),
      color: 'blue',
      bg: 'from-blue-500/10 to-blue-600/5',
      border: 'border-blue-500/20',
    },
    {
      icon: Trophy,
      label: t('mastered'),
      value: loading ? null : String(data?.masteredCount ?? 0),
      color: 'green',
      bg: 'from-green-500/10 to-green-600/5',
      border: 'border-green-500/20',
    },
    {
      icon: Clock,
      label: t('practiceTime'),
      value: loading ? null : (data?.practiceTimeFormatted ?? `0${t('hours')}`),
      color: 'purple',
      bg: 'from-purple-500/10 to-purple-600/5',
      border: 'border-purple-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
              {t('welcome')}
            </h1>
            <p className="text-lg text-blue-100/80 mb-8 leading-relaxed">
              {t('subtitle', { count: dueCount })}
            </p>
            <Link
              href="/practice"
              className="group inline-flex items-center px-8 py-4 bg-white text-slate-900 rounded-full font-semibold hover:bg-blue-50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              <Zap className="mr-2 w-5 h-5 text-blue-600 group-hover:fill-blue-600 transition-colors" />
              {t('startPractice')}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl transform rotate-3 hover:rotate-6 transition-transform duration-500">
              <Trophy className="w-16 h-16 md:w-24 md:h-24 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading
          ? [0, 1, 2].map((i) => <StatSkeleton key={i} />)
          : stats.map((stat, idx) => (
              <div
                key={idx}
                className={`relative group p-6 rounded-2xl border ${stat.border} bg-gradient-to-br ${stat.bg} backdrop-blur-xl hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-500 shadow-inner`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className={`w-12 h-1 rounded-full bg-${stat.color}-500/20 overflow-hidden`}>
                    <div className={`h-full bg-${stat.color}-500 w-2/3 shadow-[0_0_10px_rgba(var(--${stat.color}-500),0.5)]`} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono tracking-tight">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('recentActivity')}</h2>
          </div>
          <Link
            href="/practice"
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors flex items-center gap-1 group"
          >
            {tCommon('viewAll')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <ActivitySkeleton />
        ) : data?.recentActivity && data.recentActivity.length > 0 ? (
          <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/5 overflow-hidden">
            {data.recentActivity.map((item, idx) => {
              const ratingLabel = tPractice(`ratings.${item.rating}`);
              const colorClass = ratingColorMap[item.rating] || 'text-slate-500 bg-slate-500/10';
              const levelLabel = item.level.charAt(0).toUpperCase() + item.level.slice(1);
              const tags = [item.topicName, levelLabel].filter(Boolean).join(' \u2022 ');

              return (
                <div
                  key={item.id}
                  className="group p-4 border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-bold font-mono">
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                        {item.questionTitle}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {tags}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colorClass}`}>
                    {ratingLabel}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/5 p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400">{tCommon('noData')}</p>
          </div>
        )}
      </section>

      {/* Quick Analytics */}
      {user && !loading && data?.practiceStats && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{tAnalytics('title')}</h2>
            </div>
            <Link
              href={"/analytics" as any}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors flex items-center gap-1 group"
            >
              {tAnalytics('viewFullAnalytics')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard title={tAnalytics('questionsMastery')} iconColor="text-green-500">
              <StatusPieChart data={data.practiceStats.questionsByStatus} compact />
            </ChartCard>
            <ChartCard title={tAnalytics('ratingDistribution')} iconColor="text-yellow-500">
              <RatingBarChart data={data.practiceStats.practiceByRating} compact />
            </ChartCard>
          </div>

          {data.streak && (
            <div className="mt-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/5 p-5">
              <StreakDisplay streak={data.streak} compact />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
