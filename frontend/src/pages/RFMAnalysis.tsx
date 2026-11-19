import React, { useEffect, useState } from 'react';
import { useDataset } from '../context/DatasetContext';
import { analysisApi } from '../api';
import { AnalysisResult } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { DonutChart } from '../components/charts/DonutChart';
import { BarChart } from '../components/charts/BarChart';
import { PieChart as PieIcon, ArrowRight, Target, Users, DollarSign, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RFMAnalysis: React.FC = () => {
  const { selectedDatasetId, datasets, setSelectedDatasetId } = useDataset();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let targetId = selectedDatasetId;
    if (!targetId && datasets.length > 0) {
      targetId = (datasets[0] as any)._id || (datasets[0] as any).id;
      if (targetId) setSelectedDatasetId(targetId);
    }
    loadResults(targetId);
  }, [selectedDatasetId, datasets]);

  const loadResults = async (targetId?: string) => {
    const idToUse = targetId || selectedDatasetId;
    setIsLoading(true);
    try {
      const res = await analysisApi.getLatestResult(idToUse || undefined);
      setResult(res.data.data);
    } catch {
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading RFM segmentation matrices..." />;
  }

  if (!result || !result.rfmSegmentsSummary) {
    return (
      <EmptyState
        title="No RFM Analysis Run Found"
        description="Run an analysis job from the navigation bar or ML Model Studio to populate RFM segments."
        actionText="Go to ML Studio"
        onAction={() => navigate('/model-studio')}
      />
    );
  }

  const segmentSummary = result.rfmSegmentsSummary;

  const donutData = segmentSummary.map((s) => ({
    name: s.segment,
    value: s.customerCount,
  }));

  const revenueBarData = segmentSummary.map((s) => ({
    segment: s.segment,
    revenue: s.totalRevenue,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">RFM Segmentation Engine</h2>
          <p className="text-xs text-slate-500">
            Multi-dimensional behavioral segmentation based on Recency, Frequency, and Monetary parameters
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={ArrowRight} onClick={() => navigate('/segmentation')}>
          View ML Clusters
        </Button>
      </div>

      {/* Visual Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Customer Segment Distribution" subtitle="Headcount percentage across RFM cohorts">
          <DonutChart data={donutData} height={260} />
        </Card>

        <Card title="Segment Gross Revenue ($)" subtitle="Cumulative sales contribution by RFM segment">
          <BarChart
            data={revenueBarData}
            xKey="segment"
            yKey="revenue"
            color="#12372A"
            height={260}
            valueFormatter={(v) => `$${v.toLocaleString()}`}
          />
        </Card>
      </div>

      {/* RFM Cohort Detailed Cards */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3">
          RFM Segment Profiles & Characteristics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segmentSummary.map((seg) => {
            const isVIP = seg.segment === 'Champions' || seg.segment === 'Loyal Customers';
            const isAtRisk = seg.segment === 'At Risk Customers' || seg.segment === 'Hibernating Customers';
            return (
              <div
                key={seg.segment}
                className={`p-5 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${
                  isVIP ? 'border-emerald-200' : isAtRisk ? 'border-rose-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{seg.segment}</h4>
                  <Badge variant={isVIP ? 'success' : isAtRisk ? 'danger' : 'teal'} size="sm">
                    {seg.percentage}% of Base
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs py-3 border-y border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Avg Inactivity</span>
                    <span className="font-bold text-slate-800">{seg.avgRecency} days</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Avg Orders</span>
                    <span className="font-bold text-slate-800">{seg.avgFrequency} txns</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Avg Customer Spend</span>
                    <span className="font-bold text-slate-900">${seg.avgMonetary.toLocaleString()}</span>
                  </div>
                  <div className="mt-2">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Revenue</span>
                    <span className="font-bold text-emerald-700">${seg.totalRevenue.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">{seg.customerCount} Customers</span>
                  <button
                    onClick={() => navigate(`/analytics`)}
                    className="text-accent-700 hover:underline font-semibold flex items-center gap-1"
                  >
                    Inspect Buyers <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
