'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useChartTheme } from './useChartTheme';

interface StatusPieChartProps {
  data: Record<string, number>;
  compact?: boolean;
}

export function StatusPieChart({ data, compact = false }: StatusPieChartProps) {
  const palette = useChartTheme();

  const chartData = [
    { name: 'New', value: Number(data.new || 0), color: palette.statusNew },
    { name: 'Learning', value: Number(data.learning || 0), color: palette.statusLearning },
    { name: 'Mastered', value: Number(data.mastered || 0), color: palette.statusMastered },
  ].filter(d => d.value > 0);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: compact ? 180 : 250 }}>
        <p className="text-sm text-slate-500 dark:text-slate-400">No data yet</p>
      </div>
    );
  }

  const height = compact ? 180 : 250;
  const innerRadius = compact ? 45 : 60;
  const outerRadius = compact ? 70 : 90;

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={3}
            dataKey="value"
            stroke={palette.tooltipBg}
            strokeWidth={1}
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: palette.tooltipBg,
              border: `1px solid ${palette.tooltipBorder}`,
              borderRadius: '8px',
              fontSize: '12px',
              color: palette.text,
            }}
            formatter={(value, name) => [`${(value as number) ?? 0} questions`, String(name)]}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl font-black text-slate-900 dark:text-white">{total}</div>
          <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total</div>
        </div>
      </div>
      {/* Legend */}
      {!compact && (
        <div className="flex justify-center gap-4 mt-2">
          {chartData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-slate-600 dark:text-slate-400">{entry.name} ({entry.value})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
