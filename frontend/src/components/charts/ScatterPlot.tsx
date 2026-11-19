import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

interface ScatterPoint {
  x: number;
  y: number;
  z?: number;
  name: string;
  cluster?: string;
  clusterId?: number;
  [key: string]: any;
}

interface ScatterPlotProps {
  data: ScatterPoint[];
  xLabel?: string;
  yLabel?: string;
  height?: number;
}

const CLUSTER_COLORS = ['#12372A', '#0F766E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'];

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data,
  xLabel = 'Principal Component 1',
  yLabel = 'Principal Component 2',
  height = 340,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[340px] flex items-center justify-center text-xs text-slate-400">
        No scatter plot data points available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded-lg shadow-xl border border-slate-700">
          <p className="font-bold text-emerald-400">{p.name}</p>
          {p.cluster && <p className="text-slate-300 text-[11px] mt-0.5">Cluster: {p.cluster}</p>}
          <div className="mt-1 pt-1 border-t border-slate-800 text-[11px] text-slate-400">
            <span>X: {p.x}</span> | <span>Y: {p.y}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            tick={{ fontSize: 10, fill: '#64748B' }}
            axisLine={{ stroke: '#E2E8F0' }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            tick={{ fontSize: 10, fill: '#64748B' }}
            axisLine={{ stroke: '#E2E8F0' }}
          />
          <ZAxis type="number" dataKey="z" range={[50, 150]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter name="Customers" data={data} fill="#0F766E">
            {data.map((entry, index) => (
              <Cell
                key={`scatter-cell-${index}`}
                fill={CLUSTER_COLORS[(entry.clusterId ?? index) % CLUSTER_COLORS.length]}
                fillOpacity={0.85}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
