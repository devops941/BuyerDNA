import React, { useEffect, useState } from 'react';
import { useDataset } from '../context/DatasetContext';
import { analysisApi } from '../api';
import { AnalysisResult } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { GitCompare, Users, DollarSign, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SegmentComparison: React.FC = () => {
  const { selectedDatasetId } = useDataset();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [segment1, setSegment1] = useState('Champions');
  const [segment2, setSegment2] = useState('At Risk Customers');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedDatasetId) {
      loadResults();
    }
  }, [selectedDatasetId]);

  const loadResults = async () => {
    setIsLoading(true);
    try {
      const res = await analysisApi.getLatestResult(selectedDatasetId);
      setResult(res.data.data);
    } catch {
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Calculating comparative cohort metrics..." />;
  }

  if (!result || !result.rfmSegmentsSummary) {
    return (
      <EmptyState
        title="No Segmentation Results Available"
        description="Run an analysis job to enable comparative cohort evaluations."
        actionText="Run Analysis"
        onAction={() => navigate('/model-studio')}
      />
    );
  }

  const summaries = result.rfmSegmentsSummary;
  const seg1Data = summaries.find((s) => s.segment === segment1) || summaries[0];
  const seg2Data = summaries.find((s) => s.segment === segment2) || summaries[1] || summaries[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Segment Comparison Matrix</h2>
          <p className="text-xs text-slate-500">
            Side-by-side comparative diagnostics between distinct behavioral customer cohorts
          </p>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Cohort A:</span>
          <select
            value={segment1}
            onChange={(e) => setSegment1(e.target.value)}
            className="text-xs font-bold text-brand-900 border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50"
          >
            {summaries.map((s) => (
              <option key={s.segment} value={s.segment}>
                {s.segment} ({s.customerCount})
              </option>
            ))}
          </select>
        </div>

        <div className="p-2 rounded-full bg-slate-100 text-slate-500">
          <GitCompare className="w-4 h-4" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Cohort B:</span>
          <select
            value={segment2}
            onChange={(e) => setSegment2(e.target.value)}
            className="text-xs font-bold text-accent-700 border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50"
          >
            {summaries.map((s) => (
              <option key={s.segment} value={s.segment}>
                {s.segment} ({s.customerCount})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparative Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cohort A */}
        <div className="bg-white p-6 rounded-2xl border border-brand-900/20 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-brand-800 tracking-wider">Cohort A</span>
              <h3 className="text-base font-extrabold text-slate-900">{seg1Data.segment}</h3>
            </div>
            <Badge variant="teal">{seg1Data.customerCount} Buyers ({seg1Data.percentage}%)</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-slate-50">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Revenue</span>
              <span className="text-base font-bold text-emerald-700">${seg1Data.totalRevenue.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{seg1Data.revenuePercentage}% of gross sales</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Avg Customer Spend</span>
              <span className="text-base font-bold text-slate-900">${seg1Data.avgMonetary.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Basket value</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Avg Order Frequency</span>
              <span className="text-base font-bold text-slate-900">{seg1Data.avgFrequency} txns</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Avg Inactivity</span>
              <span className="text-base font-bold text-slate-900">{seg1Data.avgRecency} days</span>
            </div>
          </div>
        </div>

        {/* Cohort B */}
        <div className="bg-white p-6 rounded-2xl border border-accent-600/20 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-accent-700 tracking-wider">Cohort B</span>
              <h3 className="text-base font-extrabold text-slate-900">{seg2Data.segment}</h3>
            </div>
            <Badge variant="purple">{seg2Data.customerCount} Buyers ({seg2Data.percentage}%)</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-slate-50">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Revenue</span>
              <span className="text-base font-bold text-emerald-700">${seg2Data.totalRevenue.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">{seg2Data.revenuePercentage}% of gross sales</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Avg Customer Spend</span>
              <span className="text-base font-bold text-slate-900">${seg2Data.avgMonetary.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Basket value</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Avg Order Frequency</span>
              <span className="text-base font-bold text-slate-900">{seg2Data.avgFrequency} txns</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Avg Inactivity</span>
              <span className="text-base font-bold text-slate-900">{seg2Data.avgRecency} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
