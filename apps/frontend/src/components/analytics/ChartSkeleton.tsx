'use client';

interface ChartSkeletonProps {
  height?: number;
  className?: string;
}

export function ChartSkeleton({ height = 250, className = '' }: ChartSkeletonProps) {
  return (
    <div className={`bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/5 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
      <div
        className="bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse"
        style={{ height }}
      />
    </div>
  );
}
