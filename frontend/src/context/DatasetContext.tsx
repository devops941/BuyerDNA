import React, { createContext, useContext, useState, useEffect } from 'react';
import { Dataset } from '../types';
import { datasetApi } from '../api';

interface DatasetContextType {
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  selectedDatasetId: string;
  setSelectedDatasetId: (id: string) => void;
  isLoading: boolean;
  refetchDatasets: () => Promise<void>;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(() => {
    return localStorage.getItem('buyerdna_selected_dataset_id') || '';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDatasets = async () => {
    setIsLoading(true);
    try {
      const res = await datasetApi.getDatasets();
      const list: any[] = res.data.data || [];
      // Normalize _id and id on all dataset objects
      const normalized = list.map((d) => {
        const docId = d._id || d.id || '';
        return { ...d, _id: docId, id: docId };
      });
      setDatasets(normalized);

      if (normalized.length > 0) {
        // If current selection is invalid or empty, default to first ready dataset
        const readyDs = normalized.find((d) => d.status === 'ready') || normalized[0];
        const readyId = readyDs._id || readyDs.id;
        const exists = normalized.some((d) => (d._id || d.id) === selectedDatasetId);

        if (!selectedDatasetId || !exists) {
          setSelectedDatasetId(readyId);
          localStorage.setItem('buyerdna_selected_dataset_id', readyId);
        }
      }
    } catch (err) {
      console.error('[DatasetContext] Failed to load datasets', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleSelectDatasetId = (id: string) => {
    setSelectedDatasetId(id);
    localStorage.setItem('buyerdna_selected_dataset_id', id);
  };

  const selectedDataset = datasets.find((d: any) => (d._id || d.id) === selectedDatasetId) || null;

  return (
    <DatasetContext.Provider
      value={{
        datasets,
        selectedDataset,
        selectedDatasetId,
        setSelectedDatasetId: handleSelectDatasetId,
        isLoading,
        refetchDatasets: fetchDatasets,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
};

export const useDataset = () => {
  const context = useContext(DatasetContext);
  if (!context) throw new Error('useDataset must be used within a DatasetProvider');
  return context;
};
