'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useChartTheme } from './useChartTheme';
import type { AnalyticsDailyActivity } from '@/types';

interface ActivityAreaChartProps {
  data: AnalyticsDailyActivity[];
}

export function ActivityAreaChart({ data }: ActivityAreaChartProps) {
  const palette = useChartTheme();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: 300 }}>
        <p className="text-sm text-slate-500 dark:text-slate-400">No practice activity yet</p>
      </div>
    );
  }

  // Format date for display
  const formattedData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={palette.areaFill} stopOpacity={0.4} />
            <stop offset="95%" stopColor={palette.areaFill} stopOpacity={0} />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: palette.textMuted, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: palette.textMuted, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={30}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: palette.tooltipBg,
            border: `1px solid ${palette.tooltipBorder}`,
            borderRadius: '8px',
            fontSize: '12px',
            color: palette.text,
          }}
          formatter={(value, name) => {
            const v = (value as number) ?? 0;
            if (name === 'sessions') return [`${v} sessions`, 'Sessions'];
            if (name === 'timeSpentMinutes') return [`${v} min`, 'Time'];
            return [v, String(name)];
          }}
          labelFormatter={(label) => `Date: ${label}`}
        />
        <Area
          type="monotone"
          dataKey="sessions"
          stroke={palette.areaStroke}
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorSessions)"
          style={{ filter: 'url(#glow)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
