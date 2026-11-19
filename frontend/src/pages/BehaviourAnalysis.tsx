import React, { useEffect, useState } from 'react';
import { useDataset } from '../context/DatasetContext';
import { analysisApi } from '../api';
import { AnalysisResult } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { BarChart } from '../components/charts/BarChart';
import { DonutChart } from '../components/charts/DonutChart';
import { Activity, Clock, Repeat, DollarSign, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BehaviourAnalysis: React.FC = () => {
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
    return <LoadingSpinner message="Analyzing customer transaction frequency and price elasticity..." />;
  }

  if (!result) {
    return (
      <EmptyState
        title="No Behavioural Data Available"
        description="Run an analysis pipeline to extract customer purchase interval patterns."
        actionText="Execute Analysis"
        onAction={() => navigate('/model-studio')}
      />
    );
  }

  const dayPatterns = result.dayOfWeekPatterns || [];
  const priceTiers = result.priceTierDistribution || [];

  const tierDonutData = priceTiers.map((t) => ({
    name: t.tier,
    value: t.revenue,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Purchase Behaviour Analysis</h2>
        <p className="text-xs text-slate-500">
          Repurchase cadences, customer order intervals, day-of-week sales volume, and price tier sensitivity
        </p>
      </div>

      {/* Top Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Repeat Rate</span>
            <Repeat className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{result.repeatPurchaseRate}%</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Buyers with multiple completed orders</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Basket Size</span>
            <DollarSign className="w-4 h-4 text-brand-900" />
          </div>
          <div className="text-2xl font-bold text-slate-900">${result.averageOrderValue.toFixed(2)}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Gross merchandise value per checkout</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Customer Base</span>
            <Activity className="w-4 h-4 text-accent-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{result.totalCustomers.toLocaleString()}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Calculated across verified transactions</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">${result.totalRevenue.toLocaleString()}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Full analytical period</span>
        </div>
      </div>

      {/* Row 2: Day of Week Pattern & Price Tier Sensitivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Day of Week Sales Volume"
          subtitle="Transaction count distribution across calendar weekdays"
        >
          <BarChart
            data={dayPatterns}
            xKey="day"
            yKey="transactions"
            color="#0F766E"
            height={280}
            valueFormatter={(v) => `${v} txns`}
          />
        </Card>

        <Card
          title="Price Sensitivity & Tier Revenue ($)"
          subtitle="Spending distribution across Budget, Moderate, Premium, and Luxury price brackets"
        >
          <DonutChart data={tierDonutData} height={250} valueFormatter={(v) => `$${v.toLocaleString()}`} />
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
            {priceTiers.map((pt) => (
              <div key={pt.tier} className="flex items-center justify-between p-2 rounded bg-slate-50">
                <span className="font-medium text-slate-700">{pt.tier}</span>
                <span className="font-bold text-slate-900">${pt.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
