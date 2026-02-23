'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useChartTheme } from './useChartTheme';

interface RatingBarChartProps {
  data: Record<string, number>;
  compact?: boolean;
}

export function RatingBarChart({ data, compact = false }: RatingBarChartProps) {
  const palette = useChartTheme();

  const chartData = [
    { name: 'Poor', value: Number(data.poor || 0), color: palette.ratingPoor },
    { name: 'Fair', value: Number(data.fair || 0), color: palette.ratingFair },
    { name: 'Good', value: Number(data.good || 0), color: palette.ratingGood },
    { name: 'Great', value: Number(data.great || 0), color: palette.ratingGreat },
  ];

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: compact ? 180 : 250 }}>
        <p className="text-sm text-slate-500 dark:text-slate-400">No data yet</p>
      </div>
    );
  }

  const height = compact ? 180 : 250;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
        <XAxis type="number" tick={{ fill: palette.text, fontSize: 11 }} axisLine={false} tickLine={false} hide={compact} />
        <YAxis type="category" dataKey="name" tick={{ fill: palette.text, fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} width={compact ? 40 : 50} />
        <Tooltip
          contentStyle={{
            backgroundColor: palette.tooltipBg,
            border: `1px solid ${palette.tooltipBorder}`,
            borderRadius: '8px',
            fontSize: '12px',
            color: palette.text,
          }}
          formatter={(value) => [`${(value as number) ?? 0} sessions`]}
          cursor={{ fill: 'transparent' }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={compact ? 16 : 22} style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
