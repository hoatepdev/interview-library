'use client';

import type { LucideIcon } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, icon: Icon, iconColor = 'text-blue-500', children, className = '' }: ChartCardProps) {
  return (
    <div className={`group relative overflow-hidden bg-white/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200/60 dark:border-white/10 p-6 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:border-blue-500/40 transition-all duration-500 ${className}`}>
      {/* Subtle top glare effect */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="mb-4 relative z-10">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 dark:shadow-[0_0_12px_currentColor] transition-shadow duration-500 ${iconColor}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h3>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-8">{subtitle}</p>
        )}
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
