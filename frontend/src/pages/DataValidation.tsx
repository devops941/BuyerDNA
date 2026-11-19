import React, { useEffect, useState } from 'react';
import { useDataset } from '../context/DatasetContext';
import { datasetApi } from '../api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import {
  ShieldCheck,
  AlertTriangle,
  Copy,
  CalendarX,
  FileDown,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DataValidation: React.FC = () => {
  const { selectedDataset, selectedDatasetId } = useDataset();
  const [rejectedRecords, setRejectedRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedDatasetId) {
      loadRejected(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const loadRejected = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await datasetApi.getRejected(id);
      setRejectedRecords(res.data.data);
    } catch {
      setRejectedRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        description="Select a dataset from the workspace to inspect its validation report."
        actionText="Go to Workspace"
        onAction={() => navigate('/workspace')}
      />
    );
  }

  const { validationSummary, qualityScore } = selectedDataset;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Data Quality & Validation Audit</h2>
          <p className="text-xs text-slate-500">
            Audit log of anomalies, missing values, duplicates, and cleaning adjustments for "{selectedDataset.name}"
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={FileDown} onClick={() => navigate('/reports')}>
            Validation Report
          </Button>
          <Button variant="secondary" size="sm" icon={ArrowRight} onClick={() => navigate('/metrics')}>
            Configure Metrics
          </Button>
        </div>
      </div>

      {/* Quality Score Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={qualityScore >= 80 ? 'text-emerald-500' : qualityScore >= 60 ? 'text-amber-500' : 'text-rose-500'}
                strokeDasharray={`${qualityScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-base font-extrabold text-slate-900">{qualityScore}%</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Dataset Reliability Score</h3>
              <Badge variant={qualityScore >= 80 ? 'success' : 'warning'}>
                {qualityScore >= 80 ? 'Enterprise Ready' : 'Review Suggested'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Calculated using automated heuristics for structural integrity, completeness of customer keys,
              validity of ISO purchase dates, and monetary value sanity checks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valid Rows Passed</span>
            <span className="text-lg font-bold text-emerald-600 block">
              {(validationSummary?.totalPassed || selectedDataset.rowCount).toLocaleString()}
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200 mx-2"></div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rejected / Flawed</span>
            <span className="text-lg font-bold text-rose-600 block">
              {(validationSummary?.rejectedRows || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Anomaly Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Missing Keys</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">{validationSummary?.missingValues || 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">Empty customer or order IDs</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Duplicate Invoices</span>
            <Copy className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">{validationSummary?.duplicates || 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">Identical transaction signatures</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Invalid Dates</span>
            <CalendarX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">{validationSummary?.invalidDates || 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">Non-parseable timestamp formats</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Auto-Cleaned Rows</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900">{validationSummary?.correctedRows || 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">Reconstructed from qty × unit_price</p>
        </div>
      </div>

      {/* Rejected Records Viewer */}
      <Card
        title="Rejected Records & Reason Log"
        subtitle="Unprocessed rows excluded from machine learning calculations to prevent analytical bias"
      >
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading rejected records...</div>
        ) : rejectedRecords.length === 0 ? (
          <div className="p-8 text-center text-xs text-emerald-700 bg-emerald-50/50 rounded-lg flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Clean dataset: No records were rejected during ingestion.</span>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[360px] overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Rejection Reason</th>
                  <th className="py-2.5 px-3">Customer ID</th>
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Raw Amount</th>
                  <th className="py-2.5 px-3">Raw Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rejectedRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-rose-50/40 transition-colors">
                    <td className="py-2 px-3 text-rose-600 font-semibold">{r.rejectionReasons}</td>
                    <td className="py-2 px-3 font-mono">{r.customer_id || '<missing>'}</td>
                    <td className="py-2 px-3 font-mono">{r.transaction_id || '<missing>'}</td>
                    <td className="py-2 px-3">{r.total_amount || r.amount || '<empty>'}</td>
                    <td className="py-2 px-3">{r.transaction_date || r.date || '<invalid>'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
