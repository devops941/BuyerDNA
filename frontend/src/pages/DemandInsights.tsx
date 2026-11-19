import React, { useEffect, useState } from 'react';
import { useDataset } from '../context/DatasetContext';
import { analysisApi } from '../api';
import { AnalysisResult } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { BarChart } from '../components/charts/BarChart';
import { TrendingUp, Package, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemandInsights: React.FC = () => {
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
    return <LoadingSpinner message="Calculating product category affinities and sales volume..." />;
  }

  if (!result || !result.categoryInsights) {
    return (
      <EmptyState
        title="No Demand Insights Available"
        description="Execute an analysis run to extract catalog demand patterns."
        actionText="Run Analysis"
        onAction={() => navigate('/model-studio')}
      />
    );
  }

  const catInsights = result.categoryInsights;

  const barData = catInsights.map((ci) => ({
    category: ci.category,
    revenue: ci.revenue,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Demand Insights & Category Performance</h2>
        <p className="text-xs text-slate-500">
          Product category affinity, inventory unit velocities, and gross revenue contribution
        </p>
      </div>

      {/* Row 1: Category Revenue Bar Chart */}
      <Card
        title="Category Gross Merchandise Value ($)"
        subtitle="Ranked revenue contribution per merchandise department"
      >
        <BarChart
          data={barData}
          xKey="category"
          yKey="revenue"
          color="#12372A"
          height={280}
          valueFormatter={(v) => `$${v.toLocaleString()}`}
        />
      </Card>

      {/* Row 2: Category Breakdown Table */}
      <Card
        title="Merchandise Category Performance Matrix"
        subtitle="Detailed unit volume, transaction density, and average selling price"
      >
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Category Name</th>
                <th className="py-2.5 px-3">Gross Revenue</th>
                <th className="py-2.5 px-3">Revenue %</th>
                <th className="py-2.5 px-3">Units Sold</th>
                <th className="py-2.5 px-3">Total Orders</th>
                <th className="py-2.5 px-3">Avg Selling Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {catInsights.map((ci) => (
                <tr key={ci.category} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-accent-700" />
                    {ci.category}
                  </td>
                  <td className="py-2.5 px-3 font-extrabold text-slate-900">
                    ${ci.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant="teal" size="sm">
                      {ci.percentageRevenue.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-700">
                    {ci.unitsSold.toLocaleString()} units
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-700">
                    {ci.transactionsCount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-slate-800 font-semibold">
                    ${ci.avgPrice.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
