'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useChartTheme } from './useChartTheme';

interface LevelDistributionChartProps {
  data: Record<string, number>;
}

export function LevelDistributionChart({ data }: LevelDistributionChartProps) {
  const palette = useChartTheme();

  const chartData = [
    { name: 'Junior', value: Number(data.junior || 0), color: palette.levelJunior },
    { name: 'Middle', value: Number(data.middle || 0), color: palette.levelMiddle },
    { name: 'Senior', value: Number(data.senior || 0), color: palette.levelSenior },
  ].filter(d => d.value > 0);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height: 250 }}>
        <p className="text-sm text-slate-500 dark:text-slate-400">No data yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
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
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ height: 250 }}>
        <div className="text-center">
          <div className="text-2xl font-black text-slate-900 dark:text-white">{total}</div>
          <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total</div>
        </div>
      </div>
      <div className="flex justify-center gap-4 mt-2">
        {chartData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-slate-600 dark:text-slate-400">{entry.name} ({entry.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
