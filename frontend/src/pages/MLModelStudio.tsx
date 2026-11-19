import React, { useState, useEffect } from 'react';
import { useDataset } from '../context/DatasetContext';
import { analysisApi } from '../api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ElbowChart } from '../components/charts/ElbowChart';
import { AnalysisResult, AnalysisJob } from '../types';
import {
  Cpu,
  Play,
  RotateCcw,
  CheckCircle2,
  Terminal,
  Activity,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const MLModelStudio: React.FC = () => {
  const { selectedDatasetId, selectedDataset, datasets, setSelectedDatasetId } = useDataset();
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('comprehensive');
  const [kClusters, setKClusters] = useState(4);
  const [inactivityDays, setInactivityDays] = useState(60);

  const [activeJob, setActiveJob] = useState<AnalysisJob | null>(null);
  const [latestResult, setLatestResult] = useState<AnalysisResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedDatasetId) {
      loadLatest();
    }
  }, [selectedDatasetId]);

  // Polling for active job status if processing
  useEffect(() => {
    let timer: any;
    if (activeJob && (activeJob.status === 'queued' || activeJob.status === 'processing')) {
      timer = setInterval(async () => {
        try {
          const res = await analysisApi.getJobStatus(activeJob._id);
          setActiveJob(res.data.data.job);
          if (res.data.data.job.status === 'completed') {
            toast.success('ML Model run finished successfully!');
            if (res.data.data.result) {
              setLatestResult(res.data.data.result);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [activeJob]);

  const loadLatest = async () => {
    try {
      const [resResult, resJobs] = await Promise.all([
        analysisApi.getLatestResult(selectedDatasetId),
        analysisApi.getAllJobs(selectedDatasetId),
      ]);
      setLatestResult(resResult.data.data);
      if (resJobs.data.data.length > 0) {
        setActiveJob(resJobs.data.data[0]);
      }
    } catch {
      // Ignored if no runs exist yet
    }
  };

  const handleStartRun = async () => {
    let activeId = selectedDatasetId;
    if (!activeId && datasets.length > 0) {
      activeId = (datasets[0] as any)._id || (datasets[0] as any).id;
      if (activeId) setSelectedDatasetId(activeId);
    }

    if (!activeId) {
      toast.error('Please choose a dataset first.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Dispatching job to Python ML runtime...');

    try {
      const res = await analysisApi.startAnalysis(activeId, selectedAlgorithm, {
        clusteringConfig: { n_clusters: kClusters },
        inactivity_threshold_days: inactivityDays,
      });

      setActiveJob(res.data.data);
      toast.success('Job queued for processing', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start ML job', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">ML Model Studio</h2>
          <p className="text-xs text-slate-500">
            Interactive pipeline orchestrator: tune hyper-parameters, monitor live execution logs, and inspect mathematical convergence
          </p>
        </div>
        <Button
          variant="primary"
          icon={Play}
          onClick={handleStartRun}
          isLoading={isSubmitting || activeJob?.status === 'processing'}
        >
          Execute Model Training
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Algorithm Config */}
        <div className="lg:col-span-1 space-y-4">
          <Card title="Algorithm Parameters" subtitle="Configure hyper-parameters">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Analytical Pipeline
                </label>
                <select
                  value={selectedAlgorithm}
                  onChange={(e) => setSelectedAlgorithm(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 bg-white"
                >
                  <option value="comprehensive">Comprehensive (RFM + K-Means + PCA + Churn)</option>
                  <option value="rfm">RFM Engine Only</option>
                  <option value="clustering">K-Means & PCA Clustering</option>
                  <option value="churn">Customer Churn & CLV Engine</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clusters Count (K): {kClusters}
                </label>
                <input
                  type="range"
                  min="2"
                  max="7"
                  value={kClusters}
                  onChange={(e) => setKClusters(parseInt(e.target.value))}
                  className="w-full accent-brand-900"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                  <span>6</span>
                  <span>7</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inactivity Churn Threshold: {inactivityDays} Days
                </label>
                <input
                  type="range"
                  min="30"
                  max="120"
                  step="15"
                  value={inactivityDays}
                  onChange={(e) => setInactivityDays(parseInt(e.target.value))}
                  className="w-full accent-accent-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-100">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  icon={Zap}
                  onClick={handleStartRun}
                  isLoading={isSubmitting || activeJob?.status === 'processing'}
                >
                  Start Run Now
                </Button>
              </div>
            </div>
          </Card>

          {/* Model Status Card */}
          <Card title="Run Status" subtitle="Active job metadata">
            {activeJob ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Job Status</span>
                  <Badge
                    variant={
                      activeJob.status === 'completed'
                        ? 'success'
                        : activeJob.status === 'processing'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {activeJob.status}
                  </Badge>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                    <span>Progress</span>
                    <span>{activeJob.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${activeJob.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Duration</span>
                  <span className="font-semibold text-slate-900">{activeJob.durationSeconds}s</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">No active job</p>
            )}
          </Card>
        </div>

        {/* Right Column: Execution Logs & Elbow Curve */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Execution Logs Console */}
          <div className="bg-slate-950 text-emerald-400 rounded-xl p-4 font-mono text-xs border border-slate-800 shadow-md">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-slate-400">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-200">Python ML Execution Log Stream</span>
              </div>
              <span className="text-[10px] text-slate-500">FastAPI Microservice stdout</span>
            </div>

            <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
              {activeJob?.logs?.map((log, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-300">
                  <span className="text-slate-600 select-none">&gt;</span>
                  <span className="leading-relaxed">{log}</span>
                </div>
              )) || <div className="text-slate-600">System idle. Awaiting next analysis dispatch.</div>}
            </div>
          </div>

          {/* Elbow Curve / WCSS Inertia Plot */}
          <Card
            title="K-Means Elbow Method Curve (WCSS Inertia)"
            subtitle="Identification of mathematical point of diminishing return for cluster count K"
          >
            <ElbowChart data={latestResult?.elbowCurve || []} height={260} />
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center justify-between">
              <span>
                Determined Optimal K:{' '}
                <strong className="text-slate-900">{latestResult?.clusteringSummary?.chosenK || 4}</strong>
              </span>
              <span>
                Silhouette Score:{' '}
                <strong className="text-emerald-700">
                  {latestResult?.clusteringSummary?.silhouetteScore || 0.25}
                </strong>
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
