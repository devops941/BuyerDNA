import React, { useEffect, useState } from 'react';
import { useDataset } from '../context/DatasetContext';
import { datasetApi } from '../api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import {
  Database,
  Upload,
  Trash2,
  CheckCircle,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const DataWorkspace: React.FC = () => {
  const { datasets, selectedDatasetId, setSelectedDatasetId, refetchDatasets, isLoading } = useDataset();
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedDatasetId) {
      loadPreview(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const loadPreview = async (id: string) => {
    setIsPreviewLoading(true);
    try {
      const res = await datasetApi.getPreview(id);
      setPreviewRows(res.data.data);
    } catch {
      setPreviewRows([]);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete dataset "${name}" and all associated analysis records?`)) {
      return;
    }

    try {
      await datasetApi.deleteDataset(id);
      toast.success('Dataset deleted successfully');
      await refetchDatasets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete dataset');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading dataset workspace..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Data Workspace</h2>
          <p className="text-xs text-slate-500">
            Manage, inspect, and switch between your imported customer transaction datasets
          </p>
        </div>
        <Button variant="primary" icon={Upload} onClick={() => navigate('/import')}>
          Import New Dataset
        </Button>
      </div>

      {/* Dataset Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {datasets.map((d: any) => {
          const dId = d._id || d.id;
          const isSelected = dId === selectedDatasetId;
          return (
            <div
              key={dId}
              className={`p-5 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-emerald-50/30 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 truncate max-w-[170px]" title={d.name}>
                      {d.name}
                    </h3>
                    <p className="text-[11px] text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <Badge variant={d.status === 'ready' ? 'success' : d.status === 'failed' ? 'danger' : 'warning'} size="sm">
                  {d.status}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Rows</span>
                  <span className="text-xs font-bold text-slate-800">{d.rowCount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Columns</span>
                  <span className="text-xs font-bold text-slate-800">{d.columnCount}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Quality</span>
                  <span className="text-xs font-bold text-emerald-600">{d.qualityScore}%</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <Button
                  variant={isSelected ? 'secondary' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedDatasetId(dId)}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Active
                    </>
                  ) : (
                    'Set as Active'
                  )}
                </Button>
                <button
                  onClick={() => handleDelete(dId, d.name)}
                  className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete dataset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dataset Data Exploration Table */}
      <Card
        title="Transaction Data Preview"
        subtitle={`Showing sample transaction records for the currently active dataset`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={Eye} onClick={() => navigate('/validation')}>
              Validation Details
            </Button>
            <Button variant="outline" size="sm" icon={FileSpreadsheet} onClick={() => navigate('/reports')}>
              Export
            </Button>
          </div>
        }
      >
        {isPreviewLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading preview records...</div>
        ) : previewRows.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No records found to display.</div>
        ) : (
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Customer ID</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Qty</th>
                  <th className="py-2.5 px-3">Unit Price</th>
                  <th className="py-2.5 px-3">Total Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewRows.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3 font-mono text-slate-800 font-medium">{r.transactionId}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{r.customerId}</td>
                    <td className="py-2 px-3 text-slate-600">{new Date(r.transactionDate).toLocaleDateString()}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {r.productCategory}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-700">{r.quantity}</td>
                    <td className="py-2 px-3 text-slate-700">${Number(r.unitPrice).toFixed(2)}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">${Number(r.totalAmount).toFixed(2)}</td>
                    <td className="py-2 px-3 text-slate-600">{r.paymentMethod}</td>
                    <td className="py-2 px-3 text-slate-600">{r.channel}</td>
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
