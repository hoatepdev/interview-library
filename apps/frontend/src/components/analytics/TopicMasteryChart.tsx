'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useChartTheme } from './useChartTheme';
import type { AnalyticsTopicMastery } from '@/types';

interface TopicMasteryChartProps {
  data: AnalyticsTopicMastery[];
}

export function TopicMasteryChart({ data }: TopicMasteryChartProps) {
  const palette = useChartTheme();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: 250 }}>
        <p className="text-sm text-slate-500 dark:text-slate-400">No topic data yet</p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.total - a.total);
  const height = Math.max(250, sortedData.length * 45);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={sortedData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
        <XAxis type="number" tick={{ fill: palette.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="topicName"
          tick={{ fill: palette.text, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={120}
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
            const labels: Record<string, string> = { new: 'New', learning: 'Learning', mastered: 'Mastered' };
            return [`${(value as number) ?? 0}`, labels[String(name)] || String(name)];
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '12px', color: palette.text }}
          formatter={(value: string) => {
            const labels: Record<string, string> = { new: 'New', learning: 'Learning', mastered: 'Mastered' };
            return labels[value] || value;
          }}
        />
        <Bar dataKey="new" stackId="a" fill={palette.statusNew} radius={0} barSize={20} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
        <Bar dataKey="learning" stackId="a" fill={palette.statusLearning} radius={0} barSize={20} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
        <Bar dataKey="mastered" stackId="a" fill={palette.statusMastered} radius={[0, 4, 4, 0]} barSize={20} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
      </BarChart>
    </ResponsiveContainer>
  );
}
