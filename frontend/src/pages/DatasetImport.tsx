import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { datasetApi } from '../api';
import { useDataset } from '../context/DatasetContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  UploadCloud,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Database,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const DatasetImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<any>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const { refetchDatasets, setSelectedDatasetId } = useDataset();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      if (!datasetName) {
        setDatasetName(f.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please choose a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', datasetName || file.name);

    setIsUploading(true);
    const toastId = toast.loading('Uploading and analyzing file columns...');

    try {
      const res = await datasetApi.uploadDataset(formData);
      setUploadResponse(res.data.data);
      setColumnMapping(res.data.data.detectedMapping || {});
      toast.success('File uploaded! Review column mapping below.', { id: toastId });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'File upload failed', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmMapping = async () => {
    if (!uploadResponse?.dataset?._id) return;

    setIsValidating(true);
    const toastId = toast.loading('Cleaning data, validating records, and populating database...');

    try {
      const res = await datasetApi.validateDataset(uploadResponse.dataset._id, columnMapping);
      toast.success(
        `Success! Quality Score: ${res.data.data.qualityScore}%. ${res.data.data.rowCount} transactions ingested.`,
        { id: toastId }
      );
      await refetchDatasets();
      setSelectedDatasetId(res.data.data._id);
      navigate('/validation');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Validation failed', { id: toastId });
    } finally {
      setIsValidating(false);
    }
  };

  const requiredFields = [
    { key: 'customerId', label: 'Customer ID', description: 'Unique buyer identifier' },
    { key: 'transactionId', label: 'Transaction ID', description: 'Unique order or invoice ID' },
    { key: 'transactionDate', label: 'Transaction Date', description: 'Purchase timestamp or date' },
    { key: 'totalAmount', label: 'Total Amount', description: 'Total revenue or order price' },
    { key: 'quantity', label: 'Quantity', description: 'Units purchased' },
    { key: 'unitPrice', label: 'Unit Price', description: 'Price per individual item' },
    { key: 'productCategory', label: 'Product Category', description: 'Merchandise group' },
    { key: 'productId', label: 'Product ID', description: 'SKU or item identifier' },
  ];

  const optionalFields = [
    { key: 'customerName', label: 'Customer Name' },
    { key: 'paymentMethod', label: 'Payment Method' },
    { key: 'discount', label: 'Discount Amount' },
    { key: 'channel', label: 'Sales Channel' },
    { key: 'city', label: 'City' },
    { key: 'region', label: 'Region / Country' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Dataset Import & Column Mapping</h2>
        <p className="text-xs text-slate-500">
          Upload your retail transaction logs (CSV, XLSX, XLS). Our engine handles schema mapping, data cleaning, and validation.
        </p>
      </div>

      {/* Step 1: File Upload */}
      <Card title="Step 1: Choose File & Dataset Name">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dataset Label / Name</label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder="e.g. Q1 Retail Transactions 2026"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <input
              type="file"
              id="file-upload"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <div className="p-3 bg-white rounded-full border border-slate-200 text-accent-700 shadow-sm mb-2">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                {file ? file.name : 'Click to select CSV or Excel spreadsheet'}
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
                Supported formats: CSV, XLSX, XLS (Max 50MB)
              </span>
            </label>
          </div>

          {file && (
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-medium">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpload}
                isLoading={isUploading}
                icon={UploadCloud}
              >
                Upload & Scan Headers
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Step 2: Column Mapping */}
      {uploadResponse && (
        <Card
          title="Step 2: Confirm Column Mapping"
          subtitle="Match the detected CSV headers to the standard BuyerDNA analytical schema"
          action={
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowRight}
              onClick={handleConfirmMapping}
              isLoading={isValidating}
            >
              Validate & Ingest Records
            </Button>
          }
        >
          <div className="space-y-6">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Auto-detection completed: </span>
                Our intelligent scanner pre-mapped recognized column names. Please review and adjust if necessary before proceeding.
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Mandatory Retail Analytics Fields
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requiredFields.map((field) => (
                  <div key={field.key} className="p-3 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">{field.label}</span>
                      <Badge variant="danger" size="sm">Required</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">{field.description}</p>
                    <select
                      value={columnMapping[field.key] || ''}
                      onChange={(e) =>
                        setColumnMapping({ ...columnMapping, [field.key]: e.target.value })
                      }
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500"
                    >
                      <option value="">-- Choose column from file --</option>
                      {uploadResponse.availableColumns?.map((col: string) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Optional Enrichment Fields
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {optionalFields.map((field) => (
                  <div key={field.key} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                    <span className="text-xs font-semibold text-slate-700 block mb-1">
                      {field.label}
                    </span>
                    <select
                      value={columnMapping[field.key] || ''}
                      onChange={(e) =>
                        setColumnMapping({ ...columnMapping, [field.key]: e.target.value })
                      }
                      className="w-full text-xs px-2 py-1 border border-slate-300 rounded bg-white"
                    >
                      <option value="">-- None --</option>
                      {uploadResponse.availableColumns?.map((col: string) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                variant="primary"
                icon={CheckCircle2}
                onClick={handleConfirmMapping}
                isLoading={isValidating}
              >
                Validate & Finalize Dataset
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
