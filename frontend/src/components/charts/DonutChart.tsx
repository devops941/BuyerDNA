import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface DonutChartProps {
  data: Array<{ name: string; value: number; [key: string]: any }>;
  colors?: string[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  valueFormatter?: (val: number) => string;
}

const DEFAULT_COLORS = [
  '#12372A', // Navy Green
  '#0F766E', // Teal
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#6366F1', // Indigo
  '#64748B', // Slate
];

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  colors = DEFAULT_COLORS,
  height = 260,
  innerRadius = 60,
  outerRadius = 90,
  valueFormatter = (val) => val.toLocaleString(),
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-xs text-slate-400">
        No distribution data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0];
      return (
        <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
          <p className="font-semibold">{p.name}</p>
          <p className="text-emerald-400 mt-0.5">{valueFormatter(p.value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Tooltip content={<CustomTooltip />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={3}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="#ffffff" strokeWidth={2} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
