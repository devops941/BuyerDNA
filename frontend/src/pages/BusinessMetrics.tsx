import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { settingsApi, analysisApi } from '../api';
import { useDataset } from '../context/DatasetContext';
import { Sliders, Save, Play, BookmarkCheck, Info, Check, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const BusinessMetrics: React.FC = () => {
  const { selectedDatasetId, datasets, setSelectedDatasetId } = useDataset();
  const navigate = useNavigate();

  // Metric states
  const [presetName, setPresetName] = useState('Custom Enterprise Configuration');
  const [referenceDate, setReferenceDate] = useState('');
  const [recencyWeight, setRecencyWeight] = useState(0.35);
  const [frequencyWeight, setFrequencyWeight] = useState(0.30);
  const [monetaryWeight, setMonetaryWeight] = useState(0.35);
  const [rBins, setRBins] = useState(5);
  const [inactivityThreshold, setInactivityThreshold] = useState(60);

  // Clustering states
  const [nClusters, setNClusters] = useState(4);
  const [autoDetectK, setAutoDetectK] = useState(false);
  const [features, setFeatures] = useState<string[]>([
    'recency',
    'frequency',
    'monetary',
    'avg_order_value',
  ]);

  const [presets, setPresets] = useState<any[]>([]);
  const [activePresetId, setActivePresetId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const res = await settingsApi.getPresets();
      const list = res.data.data || [];
      setPresets(list);
      // Auto-mark default as active initially if none selected
      const def = list.find((p: any) => p.isDefault);
      if (def && !activePresetId) {
        setActivePresetId(def._id || def.id || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyPreset = (p: any) => {
    setActivePresetId(p._id || p.id || '');
    if (p.name) setPresetName(p.name);
    if (p.rfmConfig) {
      if (p.rfmConfig.referenceDate !== undefined) setReferenceDate(p.rfmConfig.referenceDate || '');
      if (p.rfmConfig.recencyWeight !== undefined) setRecencyWeight(p.rfmConfig.recencyWeight);
      if (p.rfmConfig.frequencyWeight !== undefined) setFrequencyWeight(p.rfmConfig.frequencyWeight);
      if (p.rfmConfig.monetaryWeight !== undefined) setMonetaryWeight(p.rfmConfig.monetaryWeight);
      if (p.rfmConfig.rBins !== undefined) setRBins(p.rfmConfig.rBins);
    }
    if (p.inactivityThresholdDays !== undefined) {
      setInactivityThreshold(p.inactivityThresholdDays);
    }
    if (p.clusteringConfig) {
      if (p.clusteringConfig.nClusters !== undefined) setNClusters(p.clusteringConfig.nClusters);
      if (p.clusteringConfig.autoDetectK !== undefined) setAutoDetectK(p.clusteringConfig.autoDetectK);
      if (p.clusteringConfig.features && Array.isArray(p.clusteringConfig.features)) {
        setFeatures(p.clusteringConfig.features);
      }
    }
    toast.success(`Loaded "${p.name}" configuration!`);
  };

  const handleDeletePreset = async (e: React.MouseEvent, pId: string, pName: string) => {
    e.stopPropagation();
    try {
      await settingsApi.deletePreset(pId);
      toast.success(`Deleted preset "${pName}".`);
      loadPresets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete preset');
    }
  };

  const handleFeatureToggle = (feat: string) => {
    if (features.includes(feat)) {
      if (features.length <= 2) {
        toast.error('Select at least 2 features for K-Means clustering.');
        return;
      }
      setFeatures(features.filter((f) => f !== feat));
    } else {
      setFeatures([...features, feat]);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName) {
      toast.error('Please give this configuration a name.');
      return;
    }

    setIsSaving(true);
    try {
      await settingsApi.savePreset({
        name: presetName,
        rfmConfig: {
          referenceDate: referenceDate || undefined,
          rBins,
          fBins: 5,
          mBins: 5,
          recencyWeight,
          frequencyWeight,
          monetaryWeight,
        },
        clusteringConfig: {
          nClusters,
          autoDetectK,
          kMin: 2,
          kMax: 7,
          features,
          randomState: 42,
        },
        inactivityThresholdDays: inactivityThreshold,
      });
      toast.success('Configuration preset saved!');
      loadPresets();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save preset');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunCustomAnalysis = async () => {
    let activeId = selectedDatasetId;
    if (!activeId && datasets.length > 0) {
      activeId = datasets[0]._id || (datasets[0] as any).id;
      if (activeId) setSelectedDatasetId(activeId);
    }

    if (!activeId) {
      toast.error('Please choose or upload an active dataset first.');
      return;
    }

    setIsRunning(true);
    const toastId = toast.loading('Dispatching configured parameters to ML engine...');

    try {
      await analysisApi.startAnalysis(activeId, 'comprehensive', {
        rfmConfig: {
          reference_date: referenceDate || null,
          recency_weight: recencyWeight,
          frequency_weight: frequencyWeight,
          monetary_weight: monetaryWeight,
        },
        clusteringConfig: {
          n_clusters: nClusters,
          auto_detect_k: autoDetectK,
          features,
        },
        inactivity_threshold_days: inactivityThreshold,
      });

      toast.success('Analysis initiated with custom parameters!', { id: toastId });
      navigate('/model-studio');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to launch analysis', { id: toastId });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Business Metric Configuration</h2>
          <p className="text-xs text-slate-500">
            Tune algorithmic parameters, RFM composite scoring weights, clustering hyperparameters, and churn inactivity windows
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={Save} onClick={handleSavePreset} isLoading={isSaving}>
            Save Preset
          </Button>
          <Button variant="secondary" size="sm" icon={Play} onClick={handleRunCustomAnalysis} isLoading={isRunning}>
            Execute Run
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: RFM Scoring Calibration */}
        <div className="md:col-span-2 space-y-6">
          <Card title="RFM Engine Calibration" subtitle="Define reference dates, quantile bins, and composite scoring weights">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preset Configuration Name
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Analysis Reference Cutoff Date (Optional)
                </label>
                <input
                  type="date"
                  value={referenceDate}
                  onChange={(e) => setReferenceDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Leave blank to automatically default to the latest transaction date in dataset + 1 day.
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">
                  Composite RFM Scoring Weights (Must sum to 1.0)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Recency Weight ({recencyWeight})
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={recencyWeight}
                      onChange={(e) => setRecencyWeight(parseFloat(e.target.value))}
                      className="w-full accent-brand-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Frequency Weight ({frequencyWeight})
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={frequencyWeight}
                      onChange={(e) => setFrequencyWeight(parseFloat(e.target.value))}
                      className="w-full accent-brand-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Monetary Weight ({monetaryWeight})
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={monetaryWeight}
                      onChange={(e) => setMonetaryWeight(parseFloat(e.target.value))}
                      className="w-full accent-brand-900"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantile Binning Resolution ({rBins} Tiers)
                </label>
                <div className="flex gap-2">
                  {[3, 4, 5].map((bins) => (
                    <button
                      key={bins}
                      type="button"
                      onClick={() => setRBins(bins)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        rBins === bins
                          ? 'bg-brand-900 text-white border-brand-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {bins} Quantiles (1 to {bins})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card title="K-Means Clustering & ML Feature Selection" subtitle="Feature matrix scaling and optimal cluster count">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Clusters (K Count)</span>
                  <span className="text-[11px] text-slate-500">Number of centroids for unsupervised partitioning</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={nClusters}
                    disabled={autoDetectK}
                    onChange={(e) => setNClusters(parseInt(e.target.value))}
                    className="text-xs font-semibold border border-slate-300 rounded px-2.5 py-1 bg-white"
                  >
                    {[2, 3, 4, 5, 6, 7].map((k) => (
                      <option key={k} value={k}>
                        {k} Clusters
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="auto-detect-k"
                  checked={autoDetectK}
                  onChange={(e) => setAutoDetectK(e.target.checked)}
                  className="rounded text-brand-900 accent-brand-900"
                />
                <label htmlFor="auto-detect-k" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Auto-detect optimal K using highest Silhouette Score
                </label>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700 block mb-2">Input Features</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'recency', label: 'Recency (Days Inactive)' },
                    { key: 'frequency', label: 'Transaction Frequency' },
                    { key: 'monetary', label: 'Cumulative Monetary Spend' },
                    { key: 'avg_order_value', label: 'Average Order Value (AOV)' },
                  ].map((f) => (
                    <div
                      key={f.key}
                      onClick={() => handleFeatureToggle(f.key)}
                      className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer flex items-center justify-between transition-colors ${
                        features.includes(f.key)
                          ? 'bg-accent-50 border-accent-600 text-accent-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span>{f.label}</span>
                      {features.includes(f.key) && <Check className="w-3.5 h-3.5 text-accent-700" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Churn Thresholds & Presets */}
        <div className="space-y-6">
          <Card title="Churn & Retention Windows" subtitle="Customer dormancy threshold">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inactivity Churn Threshold: {inactivityThreshold} Days
                </label>
                <input
                  type="range"
                  min="30"
                  max="180"
                  step="15"
                  value={inactivityThreshold}
                  onChange={(e) => setInactivityThreshold(parseInt(e.target.value))}
                  className="w-full accent-accent-700"
                />
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Customers who have not transacted within {inactivityThreshold} days and exceed 2× their
                  historical repurchase cycle will be categorized as At-Risk or High Churn Probability.
                </p>
              </div>
            </div>
          </Card>

          <Card title="Saved Presets" subtitle="Click any preset to load its parameters into this form">
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {presets.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No saved presets yet.</p>
              ) : (
                presets.map((p) => {
                  const pId = p._id || p.id;
                  const isSelected = activePresetId === pId;
                  return (
                    <div
                      key={pId}
                      onClick={() => handleApplyPreset(p)}
                      className={`group p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50/70 border-amber-500 shadow-sm ring-1 ring-amber-500'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                      }`}
                      title="Click to apply these parameters"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold text-slate-900 truncate max-w-[145px]">{p.name}</span>
                          {isSelected && <Badge variant="warning" size="sm">Active</Badge>}
                          {p.isDefault && !isSelected && <Badge variant="teal" size="sm">Default</Badge>}
                        </div>
                        {!p.isDefault && (
                          <button
                            type="button"
                            onClick={(e) => handleDeletePreset(e, pId, p.name)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity rounded"
                            title="Delete preset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500">
                        <span>
                          K={p.clusteringConfig?.nClusters || 4} | Churn: {p.inactivityThresholdDays || 60}d
                        </span>
                        <span className="text-royal-600 font-semibold group-hover:underline">Click to load →</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
