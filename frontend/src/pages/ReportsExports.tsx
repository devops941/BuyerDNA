import React, { useState, useEffect } from 'react';
import { useDataset } from '../context/DatasetContext';
import { reportApi } from '../api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { FileSpreadsheet, Download, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const ReportsExports: React.FC = () => {
  const { selectedDatasetId, selectedDataset, datasets, setSelectedDatasetId } = useDataset();
  const [reports, setReports] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'xlsx'>('csv');

  useEffect(() => {
    let targetId = selectedDatasetId;
    if (!targetId && datasets.length > 0) {
      targetId = (datasets[0] as any)._id || (datasets[0] as any).id;
      if (targetId) setSelectedDatasetId(targetId);
    }
    loadReports(targetId);
  }, [selectedDatasetId, datasets]);

  const loadReports = async (targetId?: string) => {
    try {
      const idToUse = targetId || selectedDatasetId;
      const res = await reportApi.getReports(idToUse || undefined);
      setReports(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (type: string) => {
    let activeId = selectedDatasetId;
    if (!activeId && datasets.length > 0) {
      activeId = (datasets[0] as any)._id || (datasets[0] as any).id;
      if (activeId) setSelectedDatasetId(activeId);
    }

    if (!activeId) {
      toast.error('Please choose a dataset first.');
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading(`Generating ${type.toUpperCase()} report in ${selectedFormat.toUpperCase()} format...`);

    try {
      const res = await reportApi.generateReport({
        datasetId: activeId,
        type,
        format: selectedFormat,
      });

      toast.success('Report ready for download!', { id: toastId });
      loadReports(activeId);

      // Trigger download
      if (res.data.data?.downloadUrl) {
        window.open(`http://localhost:5000${res.data.data.downloadUrl}`, '_blank');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Report generation failed', { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const reportCards = [
    {
      type: 'rfm',
      title: 'Customer RFM Segmentation Export',
      desc: 'Complete customer roster with recency days, frequency, monetary spend, individual R-F-M scores, and segment tags.',
    },
    {
      type: 'segmentation',
      title: 'ML Cluster Assignments Dossier',
      desc: 'K-Means cluster IDs, cluster persona descriptions, 2D PCA coordinate vectors, and lifetime spending values.',
    },
    {
      type: 'behaviour',
      title: 'Catalog Demand & Category Insights',
      desc: 'Aggregated product category GMV, units sold, transaction frequencies, and average selling price.',
    },
    {
      type: 'validation',
      title: 'Dataset Validation & Anomaly Audit',
      desc: 'Summary of ingested data quality score, missing values, duplicates, and corrective adjustments.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reports & Analytical Exports</h2>
          <p className="text-xs text-slate-500">
            Generate and export production data files in CSV and XLSX formats for executive presentations and CRM sync
          </p>
        </div>

        {/* Format Selector */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 text-xs">
          <span className="font-semibold text-slate-600 ml-2">Format:</span>
          <button
            onClick={() => setSelectedFormat('csv')}
            className={`px-3 py-1 rounded font-bold transition-colors ${
              selectedFormat === 'csv'
                ? 'bg-brand-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            CSV
          </button>
          <button
            onClick={() => setSelectedFormat('xlsx')}
            className={`px-3 py-1 rounded font-bold transition-colors ${
              selectedFormat === 'xlsx'
                ? 'bg-brand-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            XLSX (Excel)
          </button>
        </div>
      </div>

      {/* Report Generation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportCards.map((rc) => (
          <div
            key={rc.type}
            className="p-5 rounded-xl border border-slate-200/90 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-brand-900 font-bold text-sm mb-1">
                <FileSpreadsheet className="w-4 h-4 text-accent-700" />
                {rc.title}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{rc.desc}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Target: {selectedDataset?.name || 'Active Dataset'}
              </span>
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={() => handleGenerate(rc.type)}
                isLoading={isGenerating}
              >
                Generate & Download
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Generated Reports History Table */}
      <Card
        title="Previously Generated Reports"
        subtitle="Download or review your analytical export records"
      >
        {reports.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No exported report archives found yet. Generate one above!
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Report Title</th>
                  <th className="py-2.5 px-3">Report Type</th>
                  <th className="py-2.5 px-3">Format</th>
                  <th className="py-2.5 px-3">File Size</th>
                  <th className="py-2.5 px-3">Created Date</th>
                  <th className="py-2.5 px-3 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((rep) => (
                  <tr key={rep._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{rep.title}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="teal" size="sm">{rep.type}</Badge>
                    </td>
                    <td className="py-2.5 px-3 font-mono uppercase font-bold text-slate-700">
                      {rep.format}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{(rep.fileSize / 1024).toFixed(1)} KB</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(rep.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <a
                        href={`http://localhost:5000${rep.downloadUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </td>
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
