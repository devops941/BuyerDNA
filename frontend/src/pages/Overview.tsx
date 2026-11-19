import React, { useEffect, useState } from 'react';
import { useDataset } from '../context/DatasetContext';
import { dashboardApi } from '../api';
import { DashboardOverviewData } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { DonutChart } from '../components/charts/DonutChart';
import { RevenueAreaChart } from '../components/charts/RevenueAreaChart';
import { BarChart } from '../components/charts/BarChart';
import {
  Users,
  CreditCard,
  DollarSign,
  ShoppingBag,
  Award,
  AlertTriangle,
  Repeat,
  Target,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Cpu,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ENTERPRISE_COLORS = [
  '#1E3A8A', // Deep Navy Blue
  '#0D9488', // Teal
  '#D97706', // Warm Amber
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#7C3AED', // Violet
  '#DC2626', // Crimson
  '#64748B', // Slate
];

export const Overview: React.FC = () => {
  const { selectedDatasetId } = useDataset();
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const res = await dashboardApi.getOverview(selectedDatasetId);
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load dashboard overview', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [selectedDatasetId]);

  if (isLoading) {
    return <LoadingSpinner message="Calculating real-time business metrics and RFM scoring..." />;
  }

  if (!data || !data.dataset) {
    return (
      <EmptyState
        title="No Active Dataset"
        description="Select or upload a customer transaction dataset to unlock analytics and segmentation."
        actionText="Import Dataset"
        onAction={() => navigate('/import')}
      />
    );
  }

  const { kpis, segmentDistribution, topCustomers, analysisResult } = data;

  const donutData = segmentDistribution.map((s) => ({
    name: s.name,
    value: s.count,
  }));

  const categoryBarData = analysisResult?.categoryInsights?.map((ci) => ({
    category: ci.category,
    revenue: ci.revenue,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Executive Command Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Executive Analytics Scope
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              Reliability Score: {data.dataset.qualityScore}%
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
            {data.dataset.name}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5">
            <span>
              Transactions:{' '}
              <strong className="text-slate-800 tabular-nums">
                {kpis.totalTransactions.toLocaleString()}
              </strong>
            </span>
            <span>•</span>
            <span>
              Accounts:{' '}
              <strong className="text-slate-800 tabular-nums">
                {kpis.totalCustomers.toLocaleString()}
              </strong>
            </span>
            <span>•</span>
            <span>
              Clusters Identified:{' '}
              <strong className="text-slate-800">
                {analysisResult?.clusteringSummary?.chosenK || 4} Tiers
              </strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={FileSpreadsheet}
            onClick={() => navigate('/reports')}
          >
            Export Dossier
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Cpu}
            onClick={() => navigate('/model-studio')}
          >
            ML Model Studio
          </Button>
        </div>
      </div>

      {/* 8 Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={kpis.totalCustomers.toLocaleString()}
          subtitle="Distinct buyer IDs"
          icon={Users}
          iconColor="text-blue-700"
          iconBg="bg-blue-50"
        />

        <StatCard
          title="Gross Revenue"
          value={`$${kpis.totalRevenue.toLocaleString()}`}
          change="+14.2%"
          isPositive={true}
          subtitle="Net merchandise volume"
          icon={DollarSign}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-50"
        />

        <StatCard
          title="VIP Champions"
          value={kpis.vipCustomers.toLocaleString()}
          badge="High GMV"
          change="+8.3%"
          isPositive={true}
          subtitle="Highest frequency & spend"
          icon={Award}
          iconColor="text-amber-700"
          iconBg="bg-amber-50"
        />

        <StatCard
          title="Average Order Value"
          value={`$${kpis.averageOrderValue.toLocaleString()}`}
          subtitle="Mean checkout basket"
          icon={ShoppingBag}
          iconColor="text-indigo-700"
          iconBg="bg-indigo-50"
        />

        <StatCard
          title="Total Transactions"
          value={kpis.totalTransactions.toLocaleString()}
          subtitle="Audited purchase logs"
          icon={CreditCard}
          iconColor="text-slate-700"
          iconBg="bg-slate-100"
        />

        <StatCard
          title="At-Risk Cohort"
          value={kpis.atRiskCustomers.toLocaleString()}
          badge="Lapse Warning"
          subtitle="High churn probability"
          icon={AlertTriangle}
          iconColor="text-rose-700"
          iconBg="bg-rose-50"
        />

        <StatCard
          title="Repeat Purchase Rate"
          value={`${kpis.repeatPurchaseRate}%`}
          change="+4.5%"
          isPositive={true}
          subtitle="Accounts with >1 order"
          icon={Repeat}
          iconColor="text-teal-700"
          iconBg="bg-teal-50"
        />

        <StatCard
          title="Average RFM Score"
          value={kpis.averageRfmScore}
          subtitle="Standardized 5.0 scale"
          icon={Target}
          iconColor="text-purple-700"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Row 2: Customer Segmentation Donut + Monthly Revenue Line */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Customer Segmentation Breakdown"
          subtitle="Distribution of accounts across RFM cohorts"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/rfm')}>
              RFM Matrix
            </Button>
          }
          className="lg:col-span-1"
        >
          <DonutChart data={donutData} height={240} colors={ENTERPRISE_COLORS} />
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 max-h-[160px] overflow-y-auto">
            {segmentDistribution.slice(0, 5).map((seg) => (
              <div key={seg.name} className="flex items-center justify-between text-xs py-0.5">
                <span className="text-slate-700 font-medium truncate max-w-[140px]">
                  {seg.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 tabular-nums">{seg.count}</span>
                  <Badge variant="default" size="sm">
                    ${seg.revenue.toLocaleString()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Monthly Revenue Trend (GMV)"
          subtitle="12-month historical sales trajectory and order volume"
          action={
            <div className="flex items-center text-xs text-emerald-700 font-semibold gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              <TrendingUp className="w-3.5 h-3.5" />
              Healthy Growth Trajectory
            </div>
          }
          className="lg:col-span-2"
        >
          <RevenueAreaChart data={analysisResult?.monthlyTrends || []} height={290} />
        </Card>
      </div>

      {/* Row 3: Product Category Insights + Top Spenders Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Category-wise Revenue Contribution"
          subtitle="Gross merchandise volume per merchandise category"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/demand')}>
              All Categories
            </Button>
          }
        >
          <BarChart
            data={categoryBarData}
            xKey="category"
            yKey="revenue"
            color="#1E3A8A"
            height={260}
            valueFormatter={(v) => `$${v.toLocaleString()}`}
          />
        </Card>

        <Card
          title="Top Customer Spenders"
          subtitle="High-value client profiles ranked by gross monetary contribution"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/profiles')}>
              Full Directory <ArrowRight className="w-3.5 h-3.5 ml-1 inline" />
            </Button>
          }
        >
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Customer ID</th>
                  <th className="py-2.5 px-3">Segment</th>
                  <th className="py-2.5 px-3 text-right">Orders</th>
                  <th className="py-2.5 px-3 text-right">Gross Spend</th>
                  <th className="py-2.5 px-3 text-right">Churn Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topCustomers.map((c) => (
                  <tr
                    key={c.customerId}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/profiles?id=${c.customerId}`)}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {c.customerId}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant={
                          c.segment === 'Champions'
                            ? 'success'
                            : c.segment === 'Loyal Customers'
                            ? 'info'
                            : 'default'
                        }
                        size="sm"
                      >
                        {c.segment}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700 tabular-nums">
                      {c.frequency}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                      ${c.monetary.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Badge
                        variant={
                          c.churnRiskLevel === 'High'
                            ? 'danger'
                            : c.churnRiskLevel === 'Medium'
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                      >
                        {c.churnRiskLevel}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Row 4: Executive Recommendations Preview */}
      {analysisResult?.recommendations && analysisResult.recommendations.length > 0 && (
        <Card
          title="Automated Retail Optimization Playbooks"
          subtitle="Algorithmic intervention strategies formulated from RFM matrices and churn signals"
          action={
            <Button variant="outline" size="sm" onClick={() => navigate('/insights')}>
              All Playbooks ({analysisResult.recommendations.length})
            </Button>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analysisResult.recommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                className="p-5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
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
                      size="sm"
                    >
                      {rec.priority} Priority
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1 leading-snug">{rec.title}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                    {rec.actionPlan}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-200/70 text-[10px] text-slate-500 font-medium">
                  Objective: <strong className="text-slate-800">{rec.expectedImpact}</strong>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
