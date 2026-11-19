import React, { useEffect, useState } from 'react';
import { useDataset } from '../context/DatasetContext';
import { analysisApi, customerApi } from '../api';
import { AnalysisResult, Customer } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { ScatterPlot } from '../components/charts/ScatterPlot';
import { Network, Cpu, CheckCircle, Info, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CustomerSegmentation: React.FC = () => {
  const { selectedDatasetId, datasets, setSelectedDatasetId } = useDataset();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let targetId = selectedDatasetId;
    if (!targetId && datasets.length > 0) {
      targetId = (datasets[0] as any)._id || (datasets[0] as any).id;
      if (targetId) setSelectedDatasetId(targetId);
    }
    loadData(targetId);
  }, [selectedDatasetId, datasets]);

  const loadData = async (targetId?: string) => {
    const idToUse = targetId || selectedDatasetId;
    setIsLoading(true);
    try {
      const [resResult, resCustomers] = await Promise.all([
        analysisApi.getLatestResult(idToUse || undefined),
        customerApi.getCustomers({ datasetId: idToUse || undefined, limit: 150 }),
      ]);
      setResult(resResult.data.data);
      setCustomers(resCustomers.data.data || []);
    } catch (err) {
      console.error('[CustomerSegmentation] Failed to load data:', err);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Calculating cluster centroids and projecting PCA coordinates..." />;
  }

  if (!result || !result.clusters) {
    return (
      <EmptyState
        title="No Clustering Run Available"
        description="Execute an analysis run to generate unsupervised K-Means customer clusters."
        actionText="Open ML Studio"
        onAction={() => navigate('/model-studio')}
      />
    );
  }

  const { clusters, clusteringSummary } = result;

  const pcaScatterData = customers.map((c) => ({
    x: c.pcaX,
    y: c.pcaY,
    name: c.customerId,
    cluster: c.clusterName,
    clusterId: c.clusterId,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Customer Segmentation – Machine Learning Studio
          </h2>
          <p className="text-xs text-slate-500">
            Unsupervised K-Means clustering algorithm with Principal Component Analysis (PCA) 2D projection
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={Cpu} onClick={() => navigate('/model-studio')}>
          Tune Hyperparameters
        </Button>
      </div>

      {/* Model Quality Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Optimal Cluster Count
          </span>
          <div className="text-2xl font-bold text-brand-900 mt-1">
            K = {clusteringSummary.chosenK}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Evaluated using Within-Cluster Sum of Squares (Elbow Method)
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Silhouette Coefficient
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {clusteringSummary.silhouetteScore}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Normalized partition separation on scale [-1.0 to +1.0]
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Standardized Features
          </span>
          <div className="flex flex-wrap gap-1 mt-2">
            {clusteringSummary.featuresUsed.map((feat) => (
              <Badge key={feat} variant="teal" size="sm">
                {feat}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive 2D PCA Cluster Scatter Plot */}
      <Card
        title="2D PCA Dimensionality Reduction Scatter Plot"
        subtitle="Unsupervised vector projection of multi-attribute customer vectors into 2D latent space"
      >
        <ScatterPlot
          data={pcaScatterData}
          xLabel="First Principal Component (PCA 1)"
          yLabel="Second Principal Component (PCA 2)"
          height={380}
        />
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs pt-3 border-t border-slate-100">
          {clusters.map((cl, idx) => (
            <div key={cl.clusterId} className="flex items-center gap-1.5 font-medium text-slate-700">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#12372A', '#0F766E', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'][
                    idx % 6
                  ],
                }}
              ></span>
              <span>{cl.name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Cluster Profiles Table */}
      <Card
        title="Interpreted Cluster Centroids & Personas"
        subtitle="Calculated geometric centroids with human-readable business interpretation"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clusters.map((cl) => (
            <div
              key={cl.clusterId}
              className="p-5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent-700">
                    Cluster #{cl.clusterId + 1}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{cl.name}</h4>
                </div>
                <Badge variant="teal">
                  {cl.customerCount} Buyers ({cl.percentage}%)
                </Badge>
              </div>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{cl.description}</p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs py-3 border-y border-slate-100 bg-slate-50/50 rounded-lg px-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Avg Recency</span>
                  <span className="font-bold text-slate-800">{cl.avgRecency} days</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Avg Frequency</span>
                  <span className="font-bold text-slate-800">{cl.avgFrequency} orders</span>
                </div>
                <div className="mt-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Avg Spending</span>
                  <span className="font-bold text-slate-900">${cl.avgMonetary.toLocaleString()}</span>
                </div>
                <div className="mt-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Revenue</span>
                  <span className="font-bold text-emerald-700">${cl.totalSpending.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {cl.dominantTraits.map((trait, i) => (
                  <Badge key={i} variant="default" size="sm">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
