import React, { useEffect, useState } from 'react';
import { useDataset } from '../context/DatasetContext';
import { analysisApi } from '../api';
import { AnalysisResult } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Lightbulb, Target, Sparkles, TrendingUp, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MarketingInsights: React.FC = () => {
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
    return <LoadingSpinner message="Generating automated marketing recommendations and playbooks..." />;
  }

  if (!result || !result.recommendations || result.recommendations.length === 0) {
    return (
      <EmptyState
        title="No Marketing Recommendations Available"
        description="Run an analysis run to generate data-backed marketing playbooks."
        actionText="Execute Analysis"
        onAction={() => navigate('/model-studio')}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Marketing Insights & Actionable Playbooks
        </h2>
        <p className="text-xs text-slate-500">
          Rule-based, data-grounded retail intervention strategies formulated from RFM matrices and churn signals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {result.recommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-6 rounded-2xl border border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-accent-700 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" />
                  {rec.targetSegment}
                </span>
                <Badge
                  variant={
                    rec.priority === 'Urgent'
                      ? 'danger'
                      : rec.priority === 'High'
                      ? 'warning'
                      : 'info'
                  }
                >
                  {rec.priority} Priority
                </Badge>
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-2">{rec.title}</h3>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 text-xs text-slate-700 mb-4 leading-relaxed">
                <strong className="text-slate-900 block mb-1">Analytical Rationale:</strong>
                {rec.rationale}
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-800">Action Plan: </span>
                  <span className="text-slate-600 leading-relaxed">{rec.actionPlan}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Supporting Metric: </span>
                  <span className="text-slate-600">{rec.supportingMetric}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Expected Business Impact</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                {rec.expectedImpact}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
