import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface ElbowPoint {
  k: number;
  wcss: number;
  silhouette?: number;
}

export const ElbowChart: React.FC<{ data: ElbowPoint[]; height?: number }> = ({ data, height = 260 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[260px] flex items-center justify-center text-xs text-slate-400">
        No elbow curve points available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-300">Cluster count (K): {label}</p>
          <p className="text-emerald-400 mt-0.5">WCSS / Inertia: {payload[0].value.toLocaleString()}</p>
          {payload[1] && <p className="text-blue-400">Silhouette Score: {payload[1].value}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis dataKey="k" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="wcss"
            name="WCSS (Inertia)"
            stroke="#12372A"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#12372A' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
