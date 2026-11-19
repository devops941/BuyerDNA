import React, { useEffect, useState } from 'react';
import { useDataset } from '../context/DatasetContext';
import { analysisApi, historyApi } from '../api';
import { AnalysisJob } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { History, Shield, CheckCircle2, AlertTriangle, GitCompare } from 'lucide-react';

export const AnalysisHistory: React.FC = () => {
  const { selectedDatasetId } = useDataset();
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'runs' | 'audit'>('runs');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedDatasetId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [jobsRes, auditRes] = await Promise.all([
        analysisApi.getAllJobs(selectedDatasetId || undefined),
        historyApi.getAuditLogs(1, 40),
      ]);
      setJobs(jobsRes.data.data);
      setAuditLogs(auditRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Analysis History & Audit Trails</h2>
          <p className="text-xs text-slate-500">
            Immutable log of algorithm executions, parameter modifications, and administrative audit traces
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 text-xs">
          <button
            onClick={() => setActiveTab('runs')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'runs'
                ? 'bg-brand-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ML Run Executions
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'audit'
                ? 'bg-brand-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Platform Audit Trail
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Retrieving historical logs and audit records..." />
      ) : activeTab === 'runs' ? (
        <Card title="Machine Learning Job Runs" subtitle="Execution history of analytical runs on datasets">
          {jobs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No analysis jobs recorded yet.</div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Job ID</th>
                    <th className="py-2.5 px-3">Algorithm</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Started At</th>
                    <th className="py-2.5 px-3">Execution Logs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job) => (
                    <tr key={job._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                        {job._id.substring(job._id.length - 8)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 uppercase text-[11px]">
                        {job.algorithm}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant={
                            job.status === 'completed'
                              ? 'success'
                              : job.status === 'processing'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {job.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">
                        {job.durationSeconds ? `${job.durationSeconds}s` : '–'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(job.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 truncate max-w-[200px]" title={job.logs?.[job.logs.length - 1]}>
                        {job.logs?.[job.logs.length - 1] || 'Completed'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card title="Security & Audit Log" subtitle="Platform-wide trace of user operations and events">
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Action Event</th>
                  <th className="py-2.5 px-3">Target Resource</th>
                  <th className="py-2.5 px-3">IP Address</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3 text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800">
                      {log.userName || log.userEmail || 'System'}
                    </td>
                    <td className="py-2 px-3 font-mono font-semibold text-brand-900 text-[11px]">
                      {log.action}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{log.resource}</td>
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant={log.status === 'success' ? 'success' : 'danger'} size="sm">
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
