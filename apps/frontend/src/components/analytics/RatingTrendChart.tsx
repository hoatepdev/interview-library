'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useChartTheme } from './useChartTheme';
import type { AnalyticsRatingTrend } from '@/types';

interface RatingTrendChartProps {
  data: AnalyticsRatingTrend[];
}

export function RatingTrendChart({ data }: RatingTrendChartProps) {
  const palette = useChartTheme();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: 250 }}>
        <p className="text-sm text-slate-500 dark:text-slate-400">No rating history yet</p>
      </div>
    );
  }

  const formattedData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <filter id="glowTrend" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
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
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '12px', color: palette.text }}
          formatter={(value: string) => {
            const labels: Record<string, string> = { great: 'Great', good: 'Good', fair: 'Fair', poor: 'Poor' };
            return labels[value] || value;
          }}
        />
        <Area type="monotone" dataKey="great" stackId="1" stroke={palette.ratingGreat} strokeWidth={2} fill={palette.ratingGreat} fillOpacity={0.6} style={{ filter: 'url(#glowTrend)' }} />
        <Area type="monotone" dataKey="good" stackId="1" stroke={palette.ratingGood} strokeWidth={2} fill={palette.ratingGood} fillOpacity={0.6} style={{ filter: 'url(#glowTrend)' }} />
        <Area type="monotone" dataKey="fair" stackId="1" stroke={palette.ratingFair} strokeWidth={2} fill={palette.ratingFair} fillOpacity={0.6} style={{ filter: 'url(#glowTrend)' }} />
        <Area type="monotone" dataKey="poor" stackId="1" stroke={palette.ratingPoor} strokeWidth={2} fill={palette.ratingPoor} fillOpacity={0.6} style={{ filter: 'url(#glowTrend)' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
